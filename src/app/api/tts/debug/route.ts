import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
    const apiKeyLength = process.env.ELEVENLABS_API_KEY?.length || 0;
    const hasVoiceId = !!process.env.ELEVENLABS_VOICE_ID;
    
    // Test a simple fetch to ElevenLabs API
    let apiTestResult = 'not_tested';
    if (hasApiKey) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
        });
        apiTestResult = response.ok ? 'success' : `error_${response.status}`;
      } catch (error) {
        apiTestResult = `fetch_error: ${error instanceof Error ? error.message : 'unknown'}`;
      }
    }
    
    return NextResponse.json({
      environment: {
        hasApiKey,
        apiKeyLength,
        hasVoiceId,
        voiceId: process.env.ELEVENLABS_VOICE_ID || 'default',
      },
      apiTest: apiTestResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug check failed', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    );
  }
}