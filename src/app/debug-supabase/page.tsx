'use client'

import { useState } from 'react'

export default function DebugSupabasePage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-supabase')
      const results = await response.json()
      setTestResults(results)
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Supabase Configuration Debug</h1>
        
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run Supabase Tests'}
          </button>
        </div>

        {testResults && (
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Check that your <code>.env.local</code> file has the correct Supabase credentials</li>
            <li>Verify that <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set</li>
            <li>Make sure <code>SUPABASE_SERVICE_ROLE_KEY</code> is set for authenticated operations</li>
            <li>Confirm that RLS is disabled for development (check database schema)</li>
            <li>Test the public client connection above</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}