'use client';

import { useState, useEffect } from 'react';
import { AudioPlayer } from '@/components';

interface TestResults {
  status: string;
  tts_working?: boolean;
  streaming_working?: boolean;
  api_key_configured?: boolean;
  voice_id_configured?: boolean;
  available_voices_count?: number;
  voices?: Array<{id: string; name: string; category: string}>;
  error?: string;
}

export default function TTSTestPage() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customText, setCustomText] = useState('Hello! This is a test of the ElevenLabs text-to-speech integration. The AI food advisor can now speak responses to help customers make informed dining decisions.');
  const [useStreaming, setUseStreaming] = useState(true);

  const sampleTexts = [
    "Welcome to our restaurant! I'm your AI food advisor, here to help you discover delicious dishes.",
    "This pasta dish contains wheat, eggs, and dairy. It's rich in carbohydrates and protein, making it a satisfying meal option.",
    "Based on your dietary preferences, I recommend the grilled salmon with quinoa. It's high in omega-3 fatty acids and provides excellent protein.",
    "Please note: This is general nutritional information. Always consult with healthcare providers for specific dietary advice.",
  ];

  useEffect(() => {
    runHealthCheck();
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tts/test');
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Health check failed:', error);
      setTestResults({ 
        status: 'error', 
        error: 'Failed to connect to TTS service' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            ElevenLabs TTS Integration Test
          </h1>

          {/* Health Check Results */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                System Health Check
              </h2>
              <button
                onClick={runHealthCheck}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Checking...' : 'Refresh'}
              </button>
            </div>

            {testResults && (
              <div className={`p-4 rounded-lg ${
                testResults.status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-2 ${
                      testResults.status === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResults.status}
                    </span>
                  </div>
                  <div>
                    <strong>API Key:</strong> 
                    <span className={`ml-2 ${
                      testResults.api_key_configured ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResults.api_key_configured ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                  <div>
                    <strong>Voice ID:</strong> 
                    <span className={`ml-2 ${
                      testResults.voice_id_configured ? 'text-green-700' : 'text-orange-600'
                    }`}>
                      {testResults.voice_id_configured ? 'Configured' : 'Using Default'}
                    </span>
                  </div>
                  <div>
                    <strong>TTS Working:</strong> 
                    <span className={`ml-2 ${
                      testResults.tts_working ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {testResults.tts_working ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <strong>Streaming:</strong> 
                    <span className={`ml-2 ${
                      testResults.streaming_working ? 'text-green-700' : 'text-orange-600'
                    }`}>
                      {testResults.streaming_working ? 'Working' : 'Not Available'}
                    </span>
                  </div>
                </div>

                {(testResults.available_voices_count ?? 0) > 0 && (
                  <div className="mt-4">
                    <strong>Available Voices ({testResults.available_voices_count ?? 0}):</strong>
                    <div className="mt-2 space-y-1">
                      {testResults.voices?.map((voice, index: number) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <strong>{voice.name}</strong> ({voice.id}) - {voice.category}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {testResults.error && (
                  <div className="mt-4 text-red-700">
                    <strong>Error:</strong> {testResults.error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custom Text Input */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Custom Text to Speech
              </h2>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useStreaming}
                    onChange={(e) => setUseStreaming(e.target.checked)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Use Streaming</span>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter text to convert to speech..."
                maxLength={5000}
              />
              <div className="text-sm text-gray-500">
                {customText.length}/5000 characters
              </div>
              
              {customText.trim() && (
                <AudioPlayer 
                  text={customText}
                  showText={false}
                  className="mt-4"
                  useStreaming={useStreaming}
                />
              )}
            </div>
          </div>

          {/* Sample Texts */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Sample Food Advisor Responses
            </h2>
            <div className="space-y-6">
              {sampleTexts.map((text, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-3">
                    Sample {index + 1} {useStreaming && <span className="text-xs text-blue-600">(Streaming)</span>}
                  </h3>
                  <AudioPlayer 
                    text={text}
                    showText={true}
                    useStreaming={useStreaming}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Usage Instructions</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click the play button to generate and play audio</li>
              <li>• Use the progress bar to seek through the audio</li>
              <li>• Click the refresh button (🔄) to regenerate audio</li>
              <li>• Toggle &quot;Use Streaming&quot; for real-time audio generation</li>
              <li>• Streaming mode provides faster initial playback</li>
              <li>• Audio is cached for better performance</li>
              <li>• Maximum text length is 5000 characters</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}