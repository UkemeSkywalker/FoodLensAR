'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  text: string;
  className?: string;
  autoPlay?: boolean;
  showText?: boolean;
  useStreaming?: boolean;
}

export default function AudioPlayer({ 
  text, 
  className = '', 
  autoPlay = false,
  showText = true,
  useStreaming = true
}: AudioPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateAudio = useCallback(async () => {
    if (!text || !text.trim()) return;

    setIsLoading(true);
    setError(null);
    
    // Only show streaming indicator for streaming mode
    if (useStreaming) {
      setIsStreaming(true);
    }

    let endpoint = useStreaming ? '/api/tts/stream' : '/api/tts';

    try {
      console.log('Generating audio using endpoint:', endpoint);
      
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      // If streaming fails, try regular TTS as fallback
      if (!response.ok && useStreaming) {
        console.log('Streaming failed, trying regular TTS as fallback');
        setIsStreaming(false);
        endpoint = '/api/tts';
        
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });
      }

      if (!response.ok) {
        let errorMessage = 'Failed to generate audio';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const audioBlob = await response.blob();
      console.log('Audio blob received, size:', audioBlob.size, 'bytes', 'from:', endpoint);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      const url = URL.createObjectURL(audioBlob);
      
      // Clean up previous URL using a callback to get current state
      setAudioUrl(prevUrl => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return url;
      });
      
      console.log('Audio URL created successfully');

    } catch (err) {
      console.error('Audio generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [text, useStreaming]); // Removed audioUrl from dependencies

  const playAudio = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      setIsPlaying(true);
      await audioRef.current.play();
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  }, [audioUrl]);

  // Generate audio when component mounts or text changes
  useEffect(() => {
    if (text && text.trim()) {
      generateAudio();
    }
  }, [text, generateAudio]);

  // Auto-play if requested
  useEffect(() => {
    if (autoPlay && audioUrl && audioRef.current) {
      playAudio();
    }
  }, [audioUrl, autoPlay, playAudio]);

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className={`audio-player ${className}`}>
      {/* Hidden audio element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      {/* Text display */}
      {showText && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
          {text}
        </div>
      )}

      {/* Audio controls */}
      <div className="flex items-center space-x-3 p-3 bg-white border rounded-lg shadow-sm">
        {/* Play/Pause/Stop buttons */}
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                disabled={!audioUrl || isLoading}
                className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={stopAudio}
                disabled={!audioUrl || isLoading}
                className="w-8 h-8 flex items-center justify-center bg-gray-500 text-white rounded-full hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                title="Stop"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Streaming...</span>
          </div>
        )}

        {/* Progress bar and time */}
        {audioUrl && duration > 0 && (
          <div className="flex-1 flex items-center space-x-2">
            <span className="text-xs text-gray-500 min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
              }}
            />
            
            <span className="text-xs text-gray-500 min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={generateAudio}
            disabled={isLoading}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Regenerate audio"
          >
            🔄
          </button>
          
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <span className={`px-2 py-1 rounded ${useStreaming ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
              {useStreaming ? '🌊 Stream' : '📁 Buffer'}
            </span>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}