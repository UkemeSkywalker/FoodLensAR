# QR Code Localhost Issue - Fix

## Problem
QR codes generated in production contain `localhost:3000` URLs instead of the App Runner URL.

## Root Cause
The QR code generation API route (`/api/restaurants/qr-code`) runs **server-side at runtime**, but was trying to read `NEXT_PUBLIC_APP_URL` which is only reliably available at **build-time**.

## Solution

### Code Changes (Already Applied)
Updated `src/app/api/restaurants/qr-code/route.ts` to use a runtime environment variable:

```typescript
// OLD (only worked at build-time)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// NEW (works at runtime)
const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

### Deployment Steps

1. **Add Runtime Environment Variable in App Runner**
   - Go to AWS App Runner Console
   - Select your service
   - Click "Configuration" → "Edit"
   - Go to **"Runtime environment variables"** section
   - Add:
     - Key: `APP_URL`
     - Value: `https://dxmpdhv9gm.us-east-1.awsapprunner.com`
   - Click "Save" and wait for deployment

2. **Commit and Push Code Changes**
   ```bash
   git add src/app/api/restaurants/qr-code/route.ts
   git commit -m "Fix QR code generation to use runtime APP_URL"
   git push origin main
   ```

3. **Wait for App Runner to Redeploy**
   - App Runner will automatically rebuild and redeploy
   - Check logs to verify deployment succeeded

4. **Regenerate QR Code**
   - Login to your production dashboard
   - Click "Regenerate QR Code" button
   - Download and scan the new QR code
   - It should now point to: `https://dxmpdhv9gm.us-east-1.awsapprunner.com/menu/{restaurant_id}`

## Why We Need Both Variables

| Variable | Type | Used For |
|----------|------|----------|
| `NEXT_PUBLIC_APP_URL` | Build-time | Client-side code, image generation, Lambda integration |
| `APP_URL` | Runtime | QR code generation (server-side API route) |

Both should be set to: `https://dxmpdhv9gm.us-east-1.awsapprunner.com`

## Verification

After regenerating the QR code:

1. **Check the logs** in App Runner for the QR code generation:
   ```
   APP_URL: https://dxmpdhv9gm.us-east-1.awsapprunner.com
   Menu URL: https://dxmpdhv9gm.us-east-1.awsapprunner.com/menu/{restaurant_id}
   ```

2. **Scan the QR code** with your phone - it should navigate to the App Runner URL

3. **Download the QR code** and inspect it with a QR code reader to verify the encoded URL

## Local Development

For local development, your `.env.local` should have:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000  # Add this line
```

This ensures QR codes work correctly in both local and production environments.
