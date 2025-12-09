import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Factory function to create ElevenLabs client
function createElevenLabsClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }
  return new ElevenLabsClient({ apiKey });
}

// Default voice settings for consistent audio quality
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.0,
  use_speaker_boost: true,
};

// Default voice ID (can be overridden)
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // George voice

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

/**
 * Convert text to speech using ElevenLabs API
 * Returns audio buffer that can be streamed to client
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  try {
    const {
      voiceId = DEFAULT_VOICE_ID,
      modelId = 'eleven_multilingual_v2',
      voiceSettings = DEFAULT_VOICE_SETTINGS,
    } = options;

    // Clean text for better TTS output
    const cleanText = cleanTextForTTS(text);

    console.log('Generating TTS for text:', cleanText.substring(0, 100) + '...');

    const elevenlabs = createElevenLabsClient();
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: cleanText,
      modelId: modelId,
      voiceSettings: voiceSettings,
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    const reader = audioStream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }

    const audioBuffer = Buffer.concat(chunks);
    console.log('TTS generation successful, audio size:', audioBuffer.length, 'bytes');

    return audioBuffer;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert text to speech using ElevenLabs streaming API
 * Returns a ReadableStream for real-time audio streaming
 */
export async function textToSpeechStream(
  text: string,
  options: TTSOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  try {
    const {
      voiceId = DEFAULT_VOICE_ID,
      modelId = 'eleven_multilingual_v2',
      voiceSettings = DEFAULT_VOICE_SETTINGS,
    } = options;

    // Clean text for better TTS output
    const cleanText = cleanTextForTTS(text);

    console.log('Generating streaming TTS for text:', cleanText.substring(0, 100) + '...');

    // Use the streaming endpoint directly with fetch for better control
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: modelId,
        voice_settings: voiceSettings,
        output_format: 'mp3_44100_128',
        optimize_streaming_latency: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from ElevenLabs API');
    }

    console.log('TTS streaming started successfully');
    return response.body;
  } catch (error) {
    console.error('ElevenLabs TTS streaming error:', error);
    throw new Error(`TTS streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean text to make it more suitable for TTS
 * Removes special characters, formats numbers, etc.
 */
function cleanTextForTTS(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    
    // Remove special characters that might cause issues
    .replace(/[⚠️🔥💡]/g, '')
    
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim()
    
    // Ensure proper sentence endings
    .replace(/([.!?])\s*$/, '$1');
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices() {
  try {
    const elevenlabs = createElevenLabsClient();
    const voices = await elevenlabs.voices.getAll();
    return voices.voices?.map(voice => ({
      id: voice.voiceId || '',
      name: voice.name || 'Unknown',
      category: voice.category?.toString() || 'unknown',
      description: voice.description,
    })).filter(voice => voice.id && voice.name) || [];
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

/**
 * Test TTS functionality with a simple phrase
 */
export async function testTTS(): Promise<boolean> {
  try {
    const testText = "Hello! This is a test of the ElevenLabs text-to-speech integration.";
    const audioBuffer = await textToSpeech(testText);
    return audioBuffer.length > 0;
  } catch (error) {
    console.error('TTS test failed:', error);
    return false;
  }
}