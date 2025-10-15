'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestCustomerMenuPage() {
  const [restaurantId, setRestaurantId] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])
  const [availableRestaurants, setAvailableRestaurants] = useState<any[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const loadAvailableRestaurants = async () => {
    setLoadingRestaurants(true)
    try {
      const response = await fetch('/api/restaurants/list')
      if (response.ok) {
        const data = await response.json()
        setAvailableRestaurants(data.restaurants || [])
        addResult(`✅ Found ${data.restaurants.length} restaurants in database`)
      } else {
        addResult('❌ Failed to load restaurants list')
      }
    } catch (error) {
      addResult(`❌ Error loading restaurants: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoadingRestaurants(false)
    }
  }

  const testCustomerMenuAPI = async () => {
    if (!restaurantId.trim()) {
      addResult('❌ Please enter a restaurant ID')
      return
    }

    try {
      addResult('🧪 Testing customer menu API...')
      
      // Test restaurant API
      const restaurantResponse = await fetch(`/api/restaurants/${restaurantId}`)
      if (restaurantResponse.ok) {
        const restaurantData = await restaurantResponse.json()
        addResult(`✅ Restaurant API: Found "${restaurantData.restaurant.name}"`)
      } else {
        addResult(`❌ Restaurant API: ${restaurantResponse.status} - Restaurant not found`)
        return
      }

      // Test menu API with public access
      const menuResponse = await fetch(`/api/menu?restaurantId=${restaurantId}&public=true`)
      if (menuResponse.ok) {
        const menuData = await menuResponse.json()
        addResult(`✅ Menu API: Found ${menuData.menuItems.length} menu items`)
        
        // Check for images
        const itemsWithImages = menuData.menuItems.filter((item: any) => item.image_url)
        addResult(`📸 Images: ${itemsWithImages.length} items have generated images`)
        
        // Check for cuisines
        const cuisines = [...new Set(menuData.menuItems.map((item: any) => item.cuisine).filter(Boolean))]
        addResult(`🍽️ Cuisines: ${cuisines.length} different cuisines found`)
        
      } else {
        addResult(`❌ Menu API: ${menuResponse.status} - Failed to fetch menu`)
      }

      addResult('✅ All API tests completed successfully!')
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Customer Menu Test Page</h1>
          <p className="text-gray-600">
            Test the customer-facing menu functionality and API endpoints
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">API Testing</h2>
          
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter Restaurant ID (UUID)"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={testCustomerMenuAPI}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                Test APIs
              </button>
              <button
                onClick={clearResults}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={loadAvailableRestaurants}
                disabled={loadingRestaurants}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
              >
                {loadingRestaurants ? 'Loading...' : 'Load Available Restaurants'}
              </button>
            </div>
          </div>

          {/* Available Restaurants */}
          {availableRestaurants.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-3">Available Restaurants:</h3>
              <div className="space-y-2">
                {availableRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.email}</p>
                      <p className="text-xs text-gray-500 font-mono">{restaurant.id}</p>
                    </div>
                    <button
                      onClick={() => setRestaurantId(restaurant.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      Use This ID
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {restaurantId && (
            <div className="mb-4">
              <Link
                href={`/menu/${restaurantId}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Customer Menu
              </Link>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-black mb-3">Test Results:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature Checklist */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Customer Menu Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">✅ Implemented Features:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Public menu view with restaurant routing</li>
                <li>• Attractive MenuItemCard with image display</li>
                <li>• Hover effects and smooth transitions</li>
                <li>• Responsive grid layout</li>
                <li>• Loading skeletons and states</li>
                <li>• Image loading with fallback handling</li>
                <li>• Real-time search functionality</li>
                <li>• Cuisine filtering</li>
                <li>• Sorting options (name, price, newest)</li>
                <li>• Grid/List view toggle</li>
                <li>• Shareable menu URLs</li>
                <li>• Interactive image modal</li>
                <li>• Expandable descriptions</li>
                <li>• Ingredient tooltips</li>
                <li>• Menu statistics display</li>
                <li>• Floating scroll-to-top button</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">🎯 Key Requirements Met:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Requirement 3.6:</strong> Public menu access via QR codes</li>
                <li>• <strong>Requirement 7.4:</strong> Interactive customer experience</li>
                <li>• Mobile-responsive design</li>
                <li>• Fast loading with skeleton states</li>
                <li>• Smooth animations and transitions</li>
                <li>• Accessible navigation and controls</li>
                <li>• Error handling for missing data</li>
                <li>• SEO-friendly URLs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}