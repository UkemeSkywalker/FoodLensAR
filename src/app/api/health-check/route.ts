import { NextResponse } from 'next/server'
import { databaseHealth } from '@/lib/database'

export async function GET() {
  try {
    const [connectionResult, tablesResult] = await Promise.all([
      databaseHealth.checkConnection(),
      databaseHealth.checkTables()
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Health check completed',
      results: {
        connection: connectionResult,
        tables: tablesResult
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}