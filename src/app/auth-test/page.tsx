'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface Restaurant {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export default function AuthTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check current session
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        // Fetch restaurant profile
        const { data: restaurantData } = await supabase
          .from('restaurants')
          .select('*')
          .eq('email', session.user.email)
          .single()
        
        setRestaurant(restaurantData)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpass123'
    const testRestaurant = `Test Restaurant ${Date.now()}`

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          restaurantName: testRestaurant
        })
      })

      const result = await response.json()
      console.log('Signup test result:', result)
      
      if (response.ok) {
        alert('Signup test successful! Check console for details.')
        checkAuth()
      } else {
        alert('Signup test failed: ' + result.error)
      }
    } catch (error) {
      console.error('Signup test error:', error)
      alert('Signup test error: ' + error)
    }
  }

  const testLogout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setRestaurant(null)
      alert('Logout successful!')
    } catch (error) {
      console.error('Logout error:', error)
      alert('Logout error: ' + error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Authentication Test Page
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Test the authentication system functionality
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Current Status</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Authenticated:</span>{' '}
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? 'Yes' : 'No'}
                </span>
              </p>
              {user && (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">User ID:</span> {user.id}
                  </p>
                </>
              )}
              {restaurant && (
                <>
                  <p className="text-sm">
                    <span className="font-medium">Restaurant:</span> {restaurant.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Restaurant ID:</span> {restaurant.id}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Actions</h2>
            <div className="space-y-3">
              {!user ? (
                <>
                  <button
                    onClick={testSignup}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                  >
                    Test Signup (Creates Random Account)
                  </button>
                  <Link
                    href="/auth/login"
                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 block text-center"
                  >
                    Go to Login Page
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 block text-center"
                  >
                    Go to Signup Page
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 block text-center"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={testLogout}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                  >
                    Test Logout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Navigation</h2>
            <div className="space-y-2">
              <Link
                href="/"
                className="block text-indigo-600 hover:text-indigo-500 text-sm"
              >
                ← Back to Home
              </Link>
              <button
                onClick={checkAuth}
                className="block text-gray-600 hover:text-gray-500 text-sm"
              >
                🔄 Refresh Auth Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}