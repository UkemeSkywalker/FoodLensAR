import { NextResponse } from 'next/server'

/**
 * Health check endpoint for AWS App Runner
 * Returns 200 OK if the service is healthy
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'food-lens-mvp',
      version: '1.0.0'
    },
    { status: 200 }
  )
}
