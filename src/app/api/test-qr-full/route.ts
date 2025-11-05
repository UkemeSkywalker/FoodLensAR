import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { uploadToS3 } from '@/lib/s3';

export async function GET() {
  try {
    console.log('Testing full QR code generation and upload flow...');
    
    // Generate test QR code
    const testUrl = 'http://localhost:3000/menu/test-restaurant-id';
    const qrCodeBuffer = await QRCode.toBuffer(testUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('QR code generated, buffer size:', qrCodeBuffer.length);

    // Upload to S3
    const s3Key = `test-qr-codes/full-test-${Date.now()}.png`;
    const s3Result = await uploadToS3(qrCodeBuffer, s3Key, 'image/png');

    console.log('QR code uploaded to S3:', s3Result);

    return NextResponse.json({
      success: true,
      message: 'Full QR code generation and upload test successful',
      qrCodeUrl: s3Result.url,
      menuUrl: testUrl,
      bufferSize: qrCodeBuffer.length
    });

  } catch (error) {
    console.error('Full QR code test error:', error);
    return NextResponse.json({ 
      error: 'Full QR code test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}