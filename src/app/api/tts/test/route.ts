import { NextResponse } from 'next/server';
import { testTTS, getAvailableVoices, textToSpeechStream } from '@/lib/elevenlabs';

export async function GET() {
  try {
    console.log('Running TTS test...');
    
    // Test basic TTS functionality
    const ttsWorking = await testTTS();
    
    // Test streaming functionality
    let streamingWorking = false;
    try {
      const testStream = await textToSpeechStream("Test streaming");
      const reader = testStream.getReader();
      const { done } = await reader.read();
      reader.releaseLock();
      streamingWorking = !done; // If we got data, streaming works
    } catch (error) {
      console.log('Streaming test failed (this is optional):', error);
    }
    
    // Get available voices (optional, might fail if API key has limited access)
    let voices: Array<{id: string; name: string; category: string; description?: string}> = [];
    try {
      voices = await getAvailableVoices();
    } catch (error) {
      console.log('Could not fetch voices (this is optional):', error);
    }

    return NextResponse.json({
      status: 'success',
      tts_working: ttsWorking,
      streaming_working: streamingWorking,
      api_key_configured: !!process.env.ELEVENLABS_API_KEY,
      voice_id_configured: !!process.env.ELEVENLABS_VOICE_ID,
      available_voices_count: voices.length,
      voices: voices.slice(0, 5), // Return first 5 voices as sample
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('TTS test error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      api_key_configured: !!process.env.ELEVENLABS_API_KEY,
      voice_id_configured: !!process.env.ELEVENLABS_VOICE_ID,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}