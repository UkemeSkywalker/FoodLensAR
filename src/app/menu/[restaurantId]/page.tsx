'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MenuItem, Restaurant } from '@/types'
import { CustomerMenuItemCard, MenuSkeleton } from '@/components'

export default function CustomerMenuPage() {
  const params = useParams()
  const restaurantId = params.restaurantId as string
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique cuisines for filtering
  const cuisines = Array.from(new Set(menuItems.map(item => item.cuisine).filter(Boolean)))

  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch restaurant info and menu items
      const [restaurantResponse, menuResponse] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}`),
        fetch(`/api/menu?restaurantId=${restaurantId}&public=true`)
      ])

      if (!restaurantResponse.ok || !menuResponse.ok) {
        throw new Error('Restaurant not found')
      }

      const restaurantData = await restaurantResponse.json()
      const menuData = await menuResponse.json()

      setRestaurant(restaurantData.restaurant)
      setMenuItems(menuData.menuItems || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  const filterMenuItems = useCallback(() => {
    let filtered = menuItems

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(query)
        )
      )
    }

    // Filter by cuisine
    if (selectedCuisine) {
      filtered = filtered.filter(item => item.cuisine === selectedCuisine)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredItems(filtered)
  }, [menuItems, searchQuery, selectedCuisine, sortBy])

  useEffect(() => {
    fetchMenuData()
  }, [fetchMenuData])

  useEffect(() => {
    filterMenuItems()
  }, [filterMenuItems])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCuisine('')
    setSortBy('name')
  }

  const shareMenu = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${restaurant?.name} Menu`,
          text: `Check out the menu at ${restaurant?.name}`,
          url: url
        })
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
      }
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
    return <MenuSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black mb-2">
              {restaurant?.name}
            </h1>
            <p className="text-gray-600 mb-4">
              Discover our delicious menu with AI-generated food images
            </p>
            <button
              onClick={shareMenu}
              className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Menu
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search menu items, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Cuisine Filter */}
            {cuisines.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="">All Cuisines</option>
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine}>
                      {cuisine}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'newest')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="newest">Sort by Newest</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-3 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCuisine || sortBy !== 'name') && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-2 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCuisine && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {selectedCuisine}
                <button
                  onClick={() => setSelectedCuisine('')}
                  className="ml-2 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            {sortBy !== 'name' && (
              <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Sort: {sortBy === 'price' ? 'Price' : 'Newest'}
                <button
                  onClick={() => setSortBy('name')}
                  className="ml-2 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count and Stats */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600">
            {filteredItems.length === menuItems.length 
              ? `${menuItems.length} menu items`
              : `${filteredItems.length} of ${menuItems.length} menu items`
            }
          </p>
          
          {menuItems.length > 0 && (
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>{menuItems.filter(item => item.image_url).length} with images</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>{cuisines.length} cuisines</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>
                  ${Math.min(...menuItems.map(item => item.price)).toFixed(2)} - 
                  ${Math.max(...menuItems.map(item => item.price)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCuisine ? 'No items found' : 'No menu items available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCuisine 
                ? 'Try adjusting your search or filters'
                : 'This restaurant hasn&apos;t added any menu items yet'
              }
            </p>
            {(searchQuery || selectedCuisine) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {filteredItems.map((item) => (
              <CustomerMenuItemCard
                key={item.id}
                menuItem={item}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Powered by <span className="font-semibold text-red-500">Food Lens</span> - 
            AI-generated food images for better dining experiences
          </p>
          <div className="flex justify-center space-x-6 text-xs text-gray-500">
            <span>🤖 AI-Generated Images</span>
            <span>📱 Mobile Optimized</span>
            <span>🔍 Smart Search</span>
            <span>🎨 Interactive Design</span>
          </div>
        </div>
      </div>
    </div>
  )
}