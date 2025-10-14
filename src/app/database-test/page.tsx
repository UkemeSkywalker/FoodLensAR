'use client'

import { useState } from 'react'
import { databaseHealth } from '@/lib'

interface TestResult {
  message?: string
  error?: string
  instructions?: {
    message: string
    schemaLocation: string
  }
  [key: string]: unknown
}

interface HealthResult {
  connection?: {
    connected: boolean
    error?: string
  }
  tables?: {
    tables: string[]
    error?: string
  }
  error?: string
  [key: string]: unknown
}

export default function DatabaseTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [healthResult, setHealthResult] = useState<HealthResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [healthLoading, setHealthLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/setup-database')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({ error: 'Failed to test connection', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseHealth = async () => {
    setHealthLoading(true)
    try {
      const [connectionResult, tablesResult] = await Promise.all([
        databaseHealth.checkConnection(),
        databaseHealth.checkTables()
      ])
      
      setHealthResult({
        connection: connectionResult,
        tables: tablesResult,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setHealthResult({ error: 'Health check failed', details: error })
    } finally {
      setHealthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Integration Test</h2>
          <div className="space-x-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test API Connection'}
            </button>
            <button
              onClick={testDatabaseHealth}
              disabled={healthLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {healthLoading ? 'Checking...' : 'Check Database Health'}
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">API Connection Test Results</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
            
            {testResult.instructions && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-semibold text-yellow-800">Setup Instructions:</h4>
                <p className="text-yellow-700 mt-2">{testResult.instructions.message}</p>
                <p className="text-sm text-yellow-600 mt-1">
                  Schema file: {testResult.instructions.schemaLocation}
                </p>
              </div>
            )}
          </div>
        )}

        {healthResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Database Health Check Results</h3>
            <div className="space-y-4">
              <div className={`p-3 rounded ${healthResult.connection?.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h4 className="font-semibold">Connection Status</h4>
                <p className={healthResult.connection?.connected ? 'text-green-700' : 'text-red-700'}>
                  {healthResult.connection?.connected ? '✅ Connected' : '❌ Connection Failed'}
                </p>
                {healthResult.connection?.error && (
                  <p className="text-red-600 text-sm mt-1">{healthResult.connection.error}</p>
                )}
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold">Tables Status</h4>
                <p className="text-blue-700">
                  Found tables: {healthResult.tables?.tables?.join(', ') || 'None'}
                </p>
                {healthResult.tables?.error && (
                  <p className="text-red-600 text-sm mt-1">{healthResult.tables.error}</p>
                )}
              </div>
            </div>
            
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto mt-4">
              {JSON.stringify(healthResult, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Database Schema</h3>
          <p className="text-gray-600 mb-4">
            The following SQL schema needs to be executed in your Supabase SQL editor:
          </p>
          <div className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            <pre>{`-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    ingredients TEXT[],
    description TEXT,
    image_url TEXT,
    image_generation_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for restaurants
CREATE POLICY "Restaurants can only see their own data" ON restaurants
    FOR ALL USING (auth.uid()::text = email);

-- Create RLS policies for menu_items
CREATE POLICY "Restaurants can only manage their menu items" ON menu_items
    FOR ALL USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE email = auth.uid()::text
        )
    );`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}