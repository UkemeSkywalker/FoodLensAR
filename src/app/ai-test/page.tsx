'use client'

import { useState } from 'react'

interface AIResponse {
  textResponse: string
  audioUrl?: string
  nutritionData?: Record<string, unknown>
  error?: string
  details?: string
}

export default function AITestPage() {
  const [query, setQuery] = useState('')
  const [restaurantId, setRestaurantId] = useState('')
  const [dishId, setDishId] = useState('')
  const [dishName, setDishName] = useState('')
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [healthStatus, setHealthStatus] = useState<Record<string, unknown> | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || !restaurantId.trim()) {
      alert('Please enter both query and restaurant ID')
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      const payload = {
        query: query.trim(),
        restaurantId: restaurantId.trim(),
        ...(dishId.trim() && dishName.trim() && {
          dishContext: {
            itemId: dishId.trim(),
            name: dishName.trim()
          }
        })
      }

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      setResponse(data)

    } catch (error) {
      console.error('Error:', error)
      setResponse({
        textResponse: '',
        error: 'Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/ai/query', { method: 'GET' })
      const data = await res.json()
      setHealthStatus(data)
    } catch (error) {
      setHealthStatus({
        status: 'error',
        message: 'Failed to check health',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">AI Food Advisor Test</h1>
        
        {/* Health Check Section */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-black">Service Health Check</h2>
            <button
              onClick={checkHealth}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Check Health
            </button>
          </div>
          
          {healthStatus && (
            <div className="bg-white p-4 rounded border">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Query Form */}
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="restaurantId" className="block text-sm font-medium text-black mb-2">
                Restaurant ID (required)
              </label>
              <input
                type="text"
                id="restaurantId"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>
            
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-black mb-2">
                Query (required)
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Tell me about the nutritional content of pizza"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="dishId" className="block text-sm font-medium text-black mb-2">
                Dish ID (optional)
              </label>
              <input
                type="text"
                id="dishId"
                value={dishId}
                onChange={(e) => setDishId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 456e7890-e12b-34d5-a678-901234567890"
              />
            </div>
            
            <div>
              <label htmlFor="dishName" className="block text-sm font-medium text-black mb-2">
                Dish Name (optional)
              </label>
              <input
                type="text"
                id="dishName"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Margherita Pizza"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing...' : 'Ask AI Food Advisor'}
          </button>
        </form>

        {/* Sample Queries */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-black mb-4">Sample Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-black mb-2">General Nutrition</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• &ldquo;Tell me about the nutritional content of pizza&rdquo;</li>
                <li>• &ldquo;What are the health benefits of salmon?&rdquo;</li>
                <li>• &ldquo;How many calories are in a burger?&rdquo;</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-black mb-2">Dietary Restrictions</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• &ldquo;I&rsquo;m diabetic, what should I avoid?&rdquo;</li>
                <li>• &ldquo;Do you have gluten-free options?&rdquo;</li>
                <li>• &ldquo;I&rsquo;m allergic to nuts, is this dish safe?&rdquo;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Response Section */}
        {response && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">AI Response</h3>
            
            {response.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Error</h4>
                <p className="text-red-700 mb-2">{response.error}</p>
                {response.details && (
                  <p className="text-sm text-red-600">Details: {response.details}</p>
                )}
                {response.textResponse && (
                  <div className="mt-4 p-3 bg-gray-100 rounded">
                    <p className="text-gray-700">{response.textResponse}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-black mb-2">Text Response</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{response.textResponse}</p>
                </div>
                
                {response.audioUrl && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-black mb-2">Audio Response</h4>
                    <audio controls className="w-full">
                      <source src={response.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                {response.nutritionData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-black mb-2">Nutrition Data</h4>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(response.nutritionData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}