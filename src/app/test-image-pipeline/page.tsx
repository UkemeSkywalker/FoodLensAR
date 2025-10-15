'use client'

import { useState } from 'react'

interface TestResult {
  step: string
  success: boolean
  data?: any
  error?: string
  duration?: number
}

export default function TestImagePipelinePage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentStep, setCurrentStep] = useState('')

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const runCompleteTest = async () => {
    setIsRunning(true)
    setResults([])
    
    try {
      // Step 1: Test API Connection
      setCurrentStep('Testing API Connection...')
      const startTime1 = Date.now()
      
      try {
        const response1 = await fetch('/api/generate-image')
        const data1 = await response1.json()
        addResult({
          step: 'API Connection Test',
          success: data1.status === 'connected',
          data: data1,
          duration: Date.now() - startTime1
        })
      } catch (error) {
        addResult({
          step: 'API Connection Test',
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
          duration: Date.now() - startTime1
        })
      }

      // Step 2: Test Image Generation
      setCurrentStep('Generating test image...')
      const startTime2 = Date.now()
      
      try {
        const response2 = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemName: 'Test Burger',
            description: 'Juicy beef patty with lettuce, tomato, and cheese',
            cuisine: 'American'
          })
        })
        
        const data2 = await response2.json()
        addResult({
          step: 'Image Generation Test',
          success: data2.success,
          data: data2,
          error: data2.error,
          duration: Date.now() - startTime2
        })
      } catch (error) {
        addResult({
          step: 'Image Generation Test',
          success: false,
          error: error instanceof Error ? error.message : 'Generation failed',
          duration: Date.now() - startTime2
        })
      }

      // Step 3: Test S3 Upload (if image generation succeeded)
      const imageGenResult = results.find(r => r.step === 'Image Generation Test')
      if (imageGenResult?.success && imageGenResult.data?.imageUrl) {
        setCurrentStep('Testing S3 image access...')
        const startTime3 = Date.now()
        
        try {
          const response3 = await fetch(imageGenResult.data.imageUrl, { method: 'HEAD' })
          addResult({
            step: 'S3 Image Access Test',
            success: response3.ok,
            data: { 
              status: response3.status,
              contentType: response3.headers.get('content-type'),
              url: imageGenResult.data.imageUrl
            },
            duration: Date.now() - startTime3
          })
        } catch (error) {
          addResult({
            step: 'S3 Image Access Test',
            success: false,
            error: error instanceof Error ? error.message : 'S3 access failed',
            duration: Date.now() - startTime3
          })
        }
      }

      setCurrentStep('Test completed!')
      
    } catch (error) {
      console.error('Test pipeline error:', error)
    } finally {
      setIsRunning(false)
      setCurrentStep('')
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">
          Image Generation Pipeline Test
        </h1>

        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Complete Pipeline Test
          </h2>
          <p className="text-gray-600 mb-4">
            This test will verify the complete image generation pipeline including API connection, 
            image generation, S3 upload, and image accessibility.
          </p>
          
          <button
            onClick={runCompleteTest}
            disabled={isRunning}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Complete Test'}
          </button>

          {currentStep && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">{currentStep}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-4">
              Test Results
            </h3>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result.success)}
                      <h4 className="font-medium text-black">{result.step}</h4>
                    </div>
                    <span className="text-sm text-gray-500">
                      {result.duration}ms
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div className="text-sm text-green-600">
                      ✓ Success
                      {result.data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-gray-600">View details</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ✗ Failed: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-black mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-green-600 font-medium">
                    {results.filter(r => r.success).length} Passed
                  </span>
                </div>
                <div>
                  <span className="text-red-600 font-medium">
                    {results.filter(r => !r.success).length} Failed
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Image Preview */}
            {results.find(r => r.step === 'Image Generation Test' && r.success && r.data?.imageUrl) && (
              <div className="mt-6">
                <h4 className="font-medium text-black mb-2">Generated Image</h4>
                <img
                  src={results.find(r => r.step === 'Image Generation Test')?.data?.imageUrl}
                  alt="Generated test image"
                  className="max-w-md rounded-lg border shadow-sm"
                  onError={() => console.error('Failed to load generated image')}
                />
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-semibold text-black mb-2">
            What This Test Covers
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Google Nano Banana API connection and authentication</li>
            <li>AI image generation with controlled prompts</li>
            <li>Base64 image data processing</li>
            <li>AWS S3 upload functionality</li>
            <li>Generated image accessibility and URL validation</li>
            <li>Complete pipeline performance timing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}