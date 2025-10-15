'use client'

import { useState } from 'react'

interface GenerationResult {
  success: boolean
  imageUrl?: string
  imageKey?: string
  error?: string
}

export default function ImageGenerationTestPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    service: string
    status: string
    error?: string
  } | null>(null)
  const [formData, setFormData] = useState({
    itemName: 'Margherita Pizza',
    description: 'Fresh mozzarella, tomato sauce, and basil',
    cuisine: 'Italian'
  })

  const testConnection = async () => {
    try {
      const response = await fetch('/api/generate-image')
      const data = await response.json()
      setConnectionStatus(data)
    } catch {
      setConnectionStatus({
        service: 'Google Nano Banana API',
        status: 'error',
        error: 'Failed to connect'
      })
    }
  }

  const generateImage = async () => {
    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      setResult(data)
    } catch {
      setResult({
        success: false,
        error: 'Failed to generate image'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">
          Google Nano Banana API Test
        </h1>

        {/* Connection Test */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Connection Test
          </h2>
          <button
            onClick={testConnection}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Test API Connection
          </button>
          
          {connectionStatus && (
            <div className="mt-4 p-4 bg-white rounded border">
              <p><strong>Service:</strong> {connectionStatus.service}</p>
              <p><strong>Status:</strong> 
                <span className={connectionStatus.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {connectionStatus.status}
                </span>
              </p>
              {connectionStatus.error && (
                <p><strong>Error:</strong> <span className="text-red-600">{connectionStatus.error}</span></p>
              )}
            </div>
          )}
        </div>

        {/* Image Generation Test */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Image Generation Test
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Margherita Pizza"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Fresh mozzarella, tomato sauce"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine
              </label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Italian"
              />
            </div>
          </div>

          <button
            onClick={generateImage}
            disabled={isGenerating || !formData.itemName}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Image...' : 'Generate Image'}
          </button>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Generating image with AI...</span>
            </div>
            <div className="mt-2 text-sm text-blue-600">
              This may take 10-30 seconds depending on API response time
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">
              Generation Result
            </h3>
            
            {result.success ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Image generated successfully!</p>
                    <p><strong>Image URL:</strong></p>
                    <p className="text-sm text-gray-600 break-all mb-2">{result.imageUrl}</p>
                    <p><strong>S3 Key:</strong></p>
                    <p className="text-sm text-gray-600 break-all">{result.imageKey}</p>
                  </div>
                  
                  <div>
                    {result.imageUrl && (
                      <div>
                        <p className="font-medium mb-2">Generated Image:</p>
                        <image
                          src={result.imageUrl}
                          alt={formData.itemName}
                          className="max-w-full h-auto rounded-lg border shadow-sm"
                          onError={() => {
                            console.error('Image load error')
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-medium mb-2">✗ Generation failed</p>
                <p><strong>Error:</strong> <span className="text-red-600">{result.error}</span></p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-black mb-2">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>First, test the API connection to verify credentials</li>
            <li>Fill in the form with menu item details</li>
            <li>Click &quot;Generate Image&quot; to create an AI-generated food image</li>
            <li>The image will be uploaded to S3 and displayed here</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}