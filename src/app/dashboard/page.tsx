"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AuthGuard,
  MenuItemCard,
  MenuItemForm,
  EmptyState,
  ToastContainer,
  toast,
} from "@/components";
import { supabase } from "@/lib/supabase";
import { Restaurant, MenuItem } from "@/types";
import { MenuItemFormData } from "@/components/MenuItemForm";

export default function DashboardPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [editingRestaurantName, setEditingRestaurantName] = useState(false);
  const [newRestaurantName, setNewRestaurantName] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQrCode, setGeneratingQrCode] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const router = useRouter();

  const fetchRestaurantProfile = useCallback(async () => {
    try {
      // Get the current user from Supabase client
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("User not authenticated");
        return;
      }

      // Try to get existing restaurant record
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('email', user.email)
        .single();

      // If restaurant doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        console.log('Restaurant record not found, creating one...');
        
        // Extract restaurant name from email (fallback)
        const restaurantName = user.email?.split('@')[0] || 'My Restaurant';
        
        const { data: newRestaurant, error: createError } = await supabase
          .from('restaurants')
          .insert([
            {
              name: restaurantName,
              email: user.email,
            }
          ])
          .select()
          .single();

        if (createError) {
          console.error('Failed to create restaurant record:', createError);
          setError("Failed to create restaurant profile");
          return;
        }

        setRestaurant(newRestaurant);
      } else if (error) {
        console.error('Restaurant query error:', error);
        setError("Failed to load restaurant profile");
        return;
      }

      if (restaurant) {
        console.log('=== Dashboard Restaurant Loaded ===');
        console.log('Restaurant data:', restaurant);
        setRestaurant(restaurant);
        // Ensure qr_code_url is a valid string URL, not an error object
        const qrUrl = restaurant.qr_code_url;
        if (qrUrl && typeof qrUrl === 'string' && qrUrl.startsWith('http')) {
          setQrCodeUrl(qrUrl);
        } else {
          setQrCodeUrl(null);
        }
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load restaurant profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    if (!restaurant) return;

    setMenuLoading(true);
    try {
      // Use direct Supabase query for now
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Failed to fetch menu items');
      }

      setMenuItems(menuItems || []);
    } catch (err) {
      console.error("Error fetching menu items:", err);
      setError("Failed to load menu items");
    } finally {
      setMenuLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    fetchRestaurantProfile();
  }, [fetchRestaurantProfile]);

  useEffect(() => {
    if (restaurant) {
      fetchMenuItems();
    }
  }, [restaurant, fetchMenuItems]);

  const handleCreateMenuItem = async (formData: MenuItemFormData) => {
    setIsSubmitting(true);
    try {
      if (!restaurant) return;

      // Validate required fields
      if (!formData.name || !formData.price) {
        throw new Error('Name and price are required');
      }

      const numericPrice = parseFloat(formData.price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        throw new Error('Price must be a valid positive number');
      }

      // Use direct Supabase query
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .insert({
          restaurant_id: restaurant.id,
          name: formData.name.trim(),
          price: numericPrice,
          ingredients: formData.ingredients || [],
          description: formData.description?.trim() || null,
          cuisine: formData.cuisine?.trim() || null,
          image_generation_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create menu item');
      }

      // Add new item to the beginning of the list (optimistic update)
      setMenuItems((prev) => [menuItem, ...prev]);
      setShowForm(false);

      // Show success toast for menu item creation
      toast.success('Menu item created!', 'AI image generation started automatically');

      // Automatically trigger image generation for the new menu item
      try {
        // Update status to generating immediately
        setMenuItems((prev) => 
          prev.map(item => 
            item.id === menuItem.id 
              ? { ...item, image_generation_status: 'generating' }
              : item
          )
        );

        console.log('=== Automatic Image Generation Debug ===');
        console.log('Restaurant:', restaurant);
        console.log('Menu Item:', menuItem);

        const response = await fetch(`/api/menu/${menuItem.id}/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            restaurantId: restaurant.id
          })
        });

        const result = await response.json();

        if (result.success) {
          // Update the menu item with the generated image
          setMenuItems(prev => 
            prev.map(item => 
              item.id === menuItem.id ? result.menuItem : item
            )
          );
          toast.success('Image generated!', `AI created a beautiful image for ${menuItem.name}`);
        } else {
          // Mark as failed if generation fails
          setMenuItems((prev) => 
            prev.map(item => 
              item.id === menuItem.id 
                ? { ...item, image_generation_status: 'failed' }
                : item
            )
          );
          toast.error('Image generation failed', result.error || 'Please try generating manually');
          console.error('Automatic image generation failed:', result.error);
        }
      } catch (error) {
        // Mark as failed if there's an error
        setMenuItems((prev) => 
          prev.map(item => 
            item.id === menuItem.id 
              ? { ...item, image_generation_status: 'failed' }
              : item
          )
        );
        toast.error('Image generation error', 'Please try generating manually');
        console.error('Error in automatic image generation:', error);
      }
    } catch (err) {
      console.error("Error creating menu item:", err);
      alert(err instanceof Error ? err.message : "Failed to create menu item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMenuItem = async (formData: MenuItemFormData) => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!formData.name || !formData.price) {
        throw new Error('Name and price are required');
      }

      const numericPrice = parseFloat(formData.price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        throw new Error('Price must be a valid positive number');
      }

      // Use direct Supabase query
      const { data: menuItem, error } = await supabase
        .from('menu_items')
        .update({
          name: formData.name.trim(),
          price: numericPrice,
          ingredients: formData.ingredients || [],
          description: formData.description?.trim() || null,
          cuisine: formData.cuisine?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)
        .select()
        .single();

      if (error || !menuItem) {
        throw new Error('Failed to update menu item');
      }

      // Update item in the list (optimistic update)
      setMenuItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? menuItem : item))
      );
      setEditingItem(null);
      setShowForm(false);
    } catch (err) {
      console.error("Error updating menu item:", err);
      alert("Failed to update menu item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    setDeletingItemId(itemId);
    try {
      // Use direct Supabase query
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error('Failed to delete menu item');
      }

      // Remove item from the list (optimistic update)
      setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error deleting menu item:", err);
      alert("Failed to delete menu item. Please try again.");
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setEditingItem(menuItem);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleGenerateImage = async (itemId: string) => {
    if (!restaurant) {
      console.error('No restaurant found for image generation');
      return;
    }
    
    console.log('=== Manual Image Generation Debug ===');
    console.log('Restaurant:', restaurant);
    console.log('Item ID:', itemId);
    
    setGeneratingImageId(itemId);
    try {
      const response = await fetch(`/api/menu/${itemId}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurantId: restaurant.id
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update the menu item in the list with the new image
        setMenuItems(prev => 
          prev.map(item => 
            item.id === itemId ? result.menuItem : item
          )
        );
        toast.success('Image generated!', 'Your menu item now has a beautiful AI-generated image');
      } else {
        toast.error('Generation failed', result.error || 'Please try again');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Generation error', 'Please try again');
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleUpdateRestaurantName = async () => {
    if (!restaurant || !newRestaurantName.trim()) return;

    try {
      const { data: updatedRestaurant, error } = await supabase
        .from('restaurants')
        .update({ name: newRestaurantName.trim() })
        .eq('id', restaurant.id)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update restaurant name');
      }

      setRestaurant(updatedRestaurant);
      setEditingRestaurantName(false);
      setNewRestaurantName('');
    } catch (err) {
      console.error('Error updating restaurant name:', err);
      alert('Failed to update restaurant name. Please try again.');
    }
  };

  const handleGenerateQrCode = async () => {
    if (!restaurant) return;

    setGeneratingQrCode(true);
    try {
      // Get the current user session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Authentication error', 'Please log in again');
        return;
      }

      const response = await fetch('/api/restaurants/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          restaurantId: restaurant.id
        })
      });

      const result = await response.json();

      console.log('QR Code generation result:', result);

      if (result.success && result.qrCodeUrl) {
        // Ensure qrCodeUrl is a string, not an object
        const qrUrl = typeof result.qrCodeUrl === 'string' ? result.qrCodeUrl : result.qrCodeUrl?.url;
        if (qrUrl) {
          setQrCodeUrl(qrUrl);
          setRestaurant(result.restaurant);
          toast.success('QR Code generated!', 'Your customers can now scan to view your menu');
        } else {
          toast.error('Generation failed', 'Invalid QR code URL received');
        }
      } else {
        toast.error('Generation failed', result.error || 'Please try again');
        console.error('QR Code generation failed:', result);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Generation error', 'Please try again');
    } finally {
      setGeneratingQrCode(false);
    }
  };

  const handleDownloadQrCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restaurant?.name || 'restaurant'}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded!', 'QR code saved to your device');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Download failed', 'Please try again');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error && !restaurant) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-black mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-black">Food Lens</h1>
                  <p className="text-sm text-gray-500">Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  {editingRestaurantName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newRestaurantName}
                        onChange={(e) => setNewRestaurantName(e.target.value)}
                        className="text-sm font-medium text-black bg-white border border-gray-300 rounded px-2 py-1 w-32"
                        placeholder="Restaurant name"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateRestaurantName}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditingRestaurantName(false);
                          setNewRestaurantName('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-sm font-medium text-black">
                          {restaurant?.name}
                        </p>
                        <p className="text-xs text-gray-500">{restaurant?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingRestaurantName(true);
                          setNewRestaurantName(restaurant?.name || '');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {restaurant && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(restaurant.id);
                        toast.success('Copied!', 'Restaurant ID copied to clipboard');
                      }}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1"
                      title="Copy Restaurant ID"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy ID</span>
                    </button>
                    <a
                      href={`/menu/${restaurant.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View Customer Menu</span>
                    </a>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-black mb-2">
                Menu Management
              </h2>
              <p className="text-gray-600">
                Create and manage your menu items with AI-generated images
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Menu Item</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-red-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-red-500">
                  {menuItems.length}
                </span>
              </div>
              <h3 className="font-semibold text-black">Total Items</h3>
            </div>

            <div className="bg-green-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-green-500">
                  {
                    menuItems.filter(
                      (item) => item.image_generation_status === "completed"
                    ).length
                  }
                </span>
              </div>
              <h3 className="font-semibold text-black">With Images</h3>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-yellow-500">
                  {
                    menuItems.filter(
                      (item) =>
                        item.image_generation_status === "generating" ||
                        item.image_generation_status === "pending"
                    ).length
                  }
                </span>
              </div>
              <h3 className="font-semibold text-black">Processing</h3>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-gray-500">
                  $
                  {menuItems
                    .reduce((sum, item) => sum + item.price, 0)
                    .toFixed(2)}
                </span>
              </div>
              <h3 className="font-semibold text-black">Total Value</h3>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-black mb-2">Customer QR Code</h3>
                <p className="text-gray-600">Generate a QR code for customers to easily access your menu</p>
              </div>
              <div className="flex items-center space-x-3">
                {qrCodeUrl && (
                  <>
                    <button
                      onClick={() => setShowQrCodeModal(true)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </button>
                    <button
                      onClick={handleDownloadQrCode}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download</span>
                    </button>
                  </>
                )}
                <button
                  onClick={handleGenerateQrCode}
                  disabled={generatingQrCode}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingQrCode ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span>{qrCodeUrl ? 'Regenerate QR Code' : 'Generate QR Code'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {qrCodeUrl && (
              <div className="flex items-center space-x-4 bg-white rounded-xl p-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <Image 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error('QR Code image failed to load:', qrCodeUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    unoptimized={true}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-black mb-1">QR Code Ready</p>
                  <p className="text-xs text-gray-500">
                    Customers can scan this code to view your menu at: /menu/{restaurant?.id}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          {menuLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Loading menu items...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <EmptyState
              title="No menu items yet"
              description="Start building your menu by adding your first dish. AI-generated images will be created automatically."
              actionLabel="Add Your First Item"
              onAction={() => setShowForm(true)}
              icon={
                <svg
                  className="w-12 h-12 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((menuItem) => (
                <MenuItemCard
                  key={menuItem.id}
                  menuItem={menuItem}
                  onEdit={handleEditMenuItem}
                  onDelete={handleDeleteMenuItem}
                  onGenerateImage={handleGenerateImage}
                  isDeleting={deletingItemId === menuItem.id}
                  isGeneratingImage={generatingImageId === menuItem.id}
                />
              ))}
            </div>
          )}
        </main>

        {/* Form Modal */}
        {showForm && (
          <MenuItemForm
            menuItem={editingItem}
            onSubmit={editingItem ? handleUpdateMenuItem : handleCreateMenuItem}
            onCancel={handleCancelForm}
            isSubmitting={isSubmitting}
          />
        )}

        {/* QR Code Modal */}
        {showQrCodeModal && qrCodeUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-black">Customer Menu QR Code</h3>
                <button
                  onClick={() => setShowQrCodeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center">
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-6 inline-block">
                  <Image 
                    src={qrCodeUrl} 
                    alt="QR Code for Customer Menu" 
                    width={256}
                    height={256}
                    className="w-64 h-64 object-contain mx-auto"
                    onError={(e) => {
                      console.error('QR Code modal image failed to load:', qrCodeUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    unoptimized={true}
                  />
                </div>
                
                <p className="text-gray-600 mb-6">
                  Print this QR code and place it on tables, menus, or anywhere customers can scan it to view your menu.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDownloadQrCode}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={() => {
                      if (restaurant) {
                        const menuUrl = `${window.location.origin}/menu/${restaurant.id}`;
                        navigator.clipboard.writeText(menuUrl);
                        toast.success('Copied!', 'Menu URL copied to clipboard');
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy URL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </AuthGuard>
  );
}
