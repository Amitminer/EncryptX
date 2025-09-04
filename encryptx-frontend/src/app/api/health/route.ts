import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker health checks and monitoring
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'encryptx-frontend',
      version: process.env.npm_package_version || '1.6.0'
    },
    { status: 200 }
  )
}