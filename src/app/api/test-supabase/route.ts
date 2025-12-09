import { NextResponse } from 'next/server'
import { createPublicClient, createServiceRoleClient } from '@/lib/supabase'

// GET /api/test-supabase - Test Supabase configuration
export async function GET() {
  try {
    const results = {
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      },
      tests: {} as Record<string, string>
    }

    // Test public client
    try {
      const publicClient = createPublicClient()
      const { data, error } = await publicClient
        .from('restaurants')
        .select('count')
        .limit(1)
      
      results.tests.publicClient = error ? `Error: ${error.message}` : 'Success'
    } catch (error) {
      results.tests.publicClient = `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    // Test server client (if service key is available)
    try {
      const serverClient = createServiceRoleClient()
      const { data, error } = await serverClient
        .from('restaurants')
        .select('count')
        .limit(1)
      
      results.tests.serverClient = error ? `Error: ${error.message}` : 'Success'
    } catch (error) {
      results.tests.serverClient = `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}