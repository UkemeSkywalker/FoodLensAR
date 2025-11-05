import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';

export async function GET() {
  try {
    console.log('Testing S3 upload...');
    
    // Create a simple test buffer
    const testBuffer = Buffer.from('Test QR code content', 'utf-8');
    const testKey = `test-qr-codes/test-${Date.now()}.txt`;
    
    const s3Url = await uploadToS3(testBuffer, testKey, 'text/plain');

    console.log('S3 upload successful:', s3Url);

    return NextResponse.json({
      success: true,
      message: 'S3 upload test successful',
      s3Url: s3Url,
      testKey: testKey
    });

  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json({ 
      error: 'S3 test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}