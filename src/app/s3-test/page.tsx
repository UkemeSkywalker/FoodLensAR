'use client';

import { useState } from 'react';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export default function S3TestPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const runTest = async (testName: string, testFn: () => Promise<Record<string, unknown>>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: true,
          message: `${testName} completed successfully`,
          data: result
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testS3Config = () => runTest('S3 Configuration', async () => {
    const response = await fetch('/api/s3/test');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Configuration test failed');
    return data;
  });

  const testUpload = () => runTest('File Upload', async () => {
    const response = await fetch('/api/s3/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload-test' })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload test failed');
    return data;
  });

  const testUploadFromUrl = () => runTest('Upload from URL', async () => {
    // Using a sample image URL for testing
    const sampleImageUrl = 'https://via.placeholder.com/300x200/FF0000/FFFFFF?text=Test+Image';
    const response = await fetch('/api/s3/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload-from-url',
        imageUrl: sampleImageUrl,
        restaurantId: 'test-restaurant-id',
        menuItemId: 'test-menu-item-id'
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'URL upload test failed');
    return data;
  });

  const testSignedUrl = (key?: string) => runTest('Signed URL Generation', async () => {
    const testKey = key || 'test/test-image.png';
    const response = await fetch('/api/s3/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signed-url',
        key: testKey
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Signed URL test failed');
    return data;
  });

  const testDelete = (key?: string) => runTest('File Deletion', async () => {
    const testKey = key || 'test/test-image.png';
    const response = await fetch('/api/s3/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        key: testKey
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Delete test failed');
    return data;
  });

  const runAllTests = async () => {
    await testS3Config();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testUpload();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testUploadFromUrl();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use the key from upload test if available
    const uploadResult = results['File Upload']?.data?.result as { key?: string } | undefined;
    const testKey = uploadResult?.key || 'test/test-image.png';
    
    await testSignedUrl(testKey);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testDelete(testKey);
  };

  const ResultCard = ({ testName, result, isLoading }: {
    testName: string;
    result?: TestResult;
    isLoading: boolean;
  }) => (
    <div className={`p-4 rounded-lg border ${
      result?.success ? 'border-green-200 bg-green-50' :
      result?.error ? 'border-red-200 bg-red-50' :
      'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{testName}</h3>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        )}
      </div>
      
      {result?.success && (
        <div className="text-green-700 text-sm">
          ✅ {result.message}
          {result.data && (
            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      {result?.error && (
        <div className="text-red-700 text-sm">
          ❌ {result.error}
        </div>
      )}
      
      {!result && !isLoading && (
        <div className="text-gray-500 text-sm">Not tested yet</div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">S3 Integration Test</h1>
          <p className="text-gray-600">
            Test AWS S3 integration for Food Lens image storage
          </p>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={testS3Config}
            disabled={loading['S3 Configuration']}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test Configuration
          </button>
          <button
            onClick={testUpload}
            disabled={loading['File Upload']}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Test Upload
          </button>
          <button
            onClick={testUploadFromUrl}
            disabled={loading['Upload from URL']}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Test URL Upload
          </button>
          <button
            onClick={() => testSignedUrl()}
            disabled={loading['Signed URL Generation']}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Test Signed URL
          </button>
          <button
            onClick={() => testDelete()}
            disabled={loading['File Deletion']}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Test Delete
          </button>
          <button
            onClick={runAllTests}
            disabled={Object.values(loading).some(Boolean)}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            Run All Tests
          </button>
        </div>

        <div className="grid gap-4">
          <ResultCard
            testName="S3 Configuration"
            result={results['S3 Configuration']}
            isLoading={loading['S3 Configuration']}
          />
          <ResultCard
            testName="File Upload"
            result={results['File Upload']}
            isLoading={loading['File Upload']}
          />
          <ResultCard
            testName="Upload from URL"
            result={results['Upload from URL']}
            isLoading={loading['Upload from URL']}
          />
          <ResultCard
            testName="Signed URL Generation"
            result={results['Signed URL Generation']}
            isLoading={loading['Signed URL Generation']}
          />
          <ResultCard
            testName="File Deletion"
            result={results['File Deletion']}
            isLoading={loading['File Deletion']}
          />
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Environment Variables Required:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• AWS_ACCESS_KEY_ID</li>
            <li>• AWS_SECRET_ACCESS_KEY</li>
            <li>• AWS_REGION</li>
            <li>• AWS_S3_BUCKET_NAME</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Set these in your .env.local file after running the Terraform configuration.
          </p>
        </div>
      </div>
    </div>
  );
}