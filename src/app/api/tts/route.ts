import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, TTSOptions } from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    const { text, options }: { text: string; options?: TTSOptions } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 5000 characters allowed.' },
        { status: 400 }
      );
    }

    console.log('TTS request received for text length:', text.length);

    // Generate audio
    const audioBuffer = await textToSpeech(text, options);

    // Return audio as response
    return new NextResponse(audioBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (err) {
    console.error('TTS API error:', err);
    
    return NextResponse.json(
      { 
        error: 'TTS generation failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Simple health check - just verify environment variables
    const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
    
    return NextResponse.json({
      status: 'ok',
      configured: hasApiKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}