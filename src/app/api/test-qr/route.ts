import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET() {
  try {
    console.log('Testing QR code generation...');
    
    // Test QR code generation
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

    console.log('QR code generated successfully, buffer size:', qrCodeBuffer.length);

    return NextResponse.json({
      success: true,
      message: 'QR code generation test successful',
      bufferSize: qrCodeBuffer.length,
      testUrl: testUrl
    });

  } catch (error) {
    console.error('QR code test error:', error);
    return NextResponse.json({ 
      error: 'QR code test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}