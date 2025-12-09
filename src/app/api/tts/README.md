# Text-to-Speech API Endpoints

This directory contains the TTS (Text-to-Speech) API endpoints using ElevenLabs.

## Endpoints

### POST /api/tts
Standard TTS endpoint that returns complete audio file after generation.
- **Use case**: When you need the complete audio file before playback
- **Response**: Audio/mpeg binary data
- **Latency**: Higher initial latency, but complete file available immediately

### POST /api/tts/stream
Streaming TTS endpoint that returns audio data as it's generated.
- **Use case**: When you want faster initial playback and real-time streaming
- **Response**: Streaming audio/mpeg binary data
- **Latency**: Lower initial latency, audio starts playing while still generating

### GET /api/tts/test
Health check and functionality test endpoint.
- **Response**: JSON with system status, TTS functionality, and streaming capability

## Request Format

Both POST endpoints accept the same request format:

```json
{
  "text": "Text to convert to speech",
  "options": {
    "voiceId": "optional-voice-id",
    "modelId": "eleven_multilingual_v2",
    "voiceSettings": {
      "stability": 0.5,
      "similarity_boost": 0.8,
      "style": 0.0,
      "use_speaker_boost": true
    }
  }
}
```

## Usage Examples

### Standard TTS
```javascript
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: "Hello world" })
});
const audioBlob = await response.blob();
```

### Streaming TTS
```javascript
const response = await fetch('/api/tts/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: "Hello world" })
});
const audioBlob = await response.blob(); // Still works for simple usage
```

## AudioPlayer Component

The `AudioPlayer` component supports both modes:

```jsx
<AudioPlayer 
  text="Text to speak"
  useStreaming={true}  // Enable streaming mode
  autoPlay={false}
  showText={true}
/>
```

## Configuration

Set these environment variables:
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `ELEVENLABS_VOICE_ID`: Default voice ID (optional, defaults to George voice)