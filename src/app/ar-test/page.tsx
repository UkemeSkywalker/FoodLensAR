'use client';

import { useEffect, useState } from 'react';
import { testThreeJSAvailability, checkWebXRSupport } from '@/lib/webxr';
import { ARViewer } from '@/components';

export default function ARTestPage() {
  const [threeJSStatus, setThreeJSStatus] = useState<boolean | null>(null);
  const [webXRStatus, setWebXRStatus] = useState<{ supported: boolean; error?: string } | null>(null);
  const [showARViewer, setShowARViewer] = useState(false);

  useEffect(() => {
    // Test three.js availability
    const threeJSWorking = testThreeJSAvailability();
    setThreeJSStatus(threeJSWorking);

    // Test WebXR support
    checkWebXRSupport().then(setWebXRStatus);
  }, []);

  if (showARViewer) {
    return (
      <ARViewer
        menuItem={{
          id: 'test-item',
          name: 'Test Sunflower',
          model_url: null
        }}
        onExit={() => setShowARViewer(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">AR Setup Test</h1>
        
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Three.js Status</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                threeJSStatus === null ? 'bg-gray-400' :
                threeJSStatus ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-700">
                {threeJSStatus === null ? 'Testing...' :
                 threeJSStatus ? 'Three.js is working correctly' : 'Three.js failed to load'}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">WebXR Support</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                webXRStatus === null ? 'bg-gray-400' :
                webXRStatus.supported ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-gray-700">
                {webXRStatus === null ? 'Checking...' :
                 webXRStatus.supported ? 'WebXR AR is supported' : 
                 webXRStatus.error || 'WebXR AR is not supported'}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">AR Viewer Test</h2>
            <p className="text-gray-700 mb-4">
              Test the AR viewer component with a sunflower model.
            </p>
            <button
              onClick={() => setShowARViewer(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Test AR Viewer
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Browser Console Test</h2>
            <p className="text-gray-700 mb-2">
              Open browser console and run: <code className="bg-gray-100 px-2 py-1 rounded">THREE</code>
            </p>
            <p className="text-sm text-gray-500">
              You should see the THREE.js object if it's properly loaded.
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-black mb-4">Mobile Testing</h2>
            <p className="text-gray-700 mb-2">
              To test on mobile device:
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Install ngrok: <code className="bg-gray-100 px-1 rounded">npm install -g ngrok</code></li>
              <li>Run: <code className="bg-gray-100 px-1 rounded">ngrok http 3000</code></li>
              <li>Use the HTTPS URL on your mobile device</li>
              <li>WebXR requires HTTPS to work properly</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}