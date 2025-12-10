# Mobile Testing Guide for AR Features

## Overview

WebXR requires HTTPS and only works on actual mobile devices (not desktop browsers for AR). This guide explains how to test the AR features on your mobile phone while developing on localhost.

## Prerequisites

- Mobile device with WebXR support:
  - **iOS**: iPhone with iOS 15.4+ using Safari
  - **Android**: Phone with ARCore support using Chrome
- Both laptop and mobile on the same WiFi network
- Development server running (`npm run dev`)

## Option 1: Local Network Access (Quickest for Testing)

### Step 1: Find Your Laptop's Local IP

**On macOS:**
```bash
ipconfig getifaddr en0
# Example output: 192.168.1.100
```

**On Windows:**
```bash
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

**On Linux:**
```bash
hostname -I
# First IP is usually your local network IP
```

### Step 2: Update Next.js Dev Server

By default, Next.js only listens on localhost. Update your dev command:

```bash
# In package.json, update the dev script:
"dev": "next dev -H 0.0.0.0"
```

Or run directly:
```bash
npm run dev -- -H 0.0.0.0
```

### Step 3: Access from Mobile

On your mobile device, open the browser and navigate to:
```
http://YOUR_LOCAL_IP:3000
```

Example: `http://192.168.1.100:3000`

### ⚠️ Important Limitation

**WebXR requires HTTPS**, so this method will show the UI but AR features won't work. You'll see an error like "WebXR not supported" because the browser blocks WebXR on non-HTTPS connections.

Use this method for testing:
- UI layout and responsiveness
- Navigation flow
- Button placement
- Non-AR features

For actual AR testing, use Option 2 or 3.

## Option 2: ngrok Tunnel (Recommended for AR Testing)

ngrok creates a secure HTTPS tunnel to your localhost, perfect for WebXR testing.

### Step 1: Install ngrok

**Using Homebrew (macOS):**
```bash
brew install ngrok
```

**Using npm:**
```bash
npm install -g ngrok
```

**Or download from:** https://ngrok.com/download

### Step 2: Start Your Dev Server

```bash
npm run dev
```

### Step 3: Create ngrok Tunnel

In a new terminal:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Access from Mobile

Open your mobile browser and navigate to the HTTPS URL provided by ngrok:
```
https://abc123.ngrok.io
```

### ✅ Benefits

- Full HTTPS support (WebXR works!)
- No network configuration needed
- Works from anywhere (not just local network)
- Free tier available

### ⚠️ Limitations

- Free tier has session limits (2 hours)
- URL changes each time you restart ngrok
- Slight latency compared to local network

## Option 3: Self-Signed Certificate (Advanced)

Create a self-signed SSL certificate for local HTTPS.

### Step 1: Generate Certificate

```bash
# Install mkcert
brew install mkcert  # macOS
# or download from: https://github.com/FiloSottile/mkcert

# Install local CA
mkcert -install

# Generate certificate for your local IP
mkcert YOUR_LOCAL_IP localhost 127.0.0.1
```

### Step 2: Configure Next.js for HTTPS

Create `server.js`:
```javascript
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./YOUR_LOCAL_IP+2-key.pem'),
  cert: fs.readFileSync('./YOUR_LOCAL_IP+2.pem'),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log('> Ready on https://YOUR_LOCAL_IP:3000');
  });
});
```

### Step 3: Run Custom Server

```bash
node server.js
```

### Step 4: Trust Certificate on Mobile

**iOS:**
1. Navigate to `https://YOUR_LOCAL_IP:3000`
2. Safari will show a warning
3. Tap "Show Details" → "visit this website"
4. Accept the certificate

**Android:**
1. Navigate to `https://YOUR_LOCAL_IP:3000`
2. Chrome will show a warning
3. Tap "Advanced" → "Proceed to site"

### ✅ Benefits

- Full HTTPS support
- No external services needed
- Fast (local network)
- No session limits

### ⚠️ Limitations

- More complex setup
- Certificate warnings on mobile
- Need to regenerate if IP changes

## Recommended Workflow

### For Quick UI Testing
1. Use **Option 1** (Local Network) - fastest for layout/styling
2. Accept that AR won't work, just test UI

### For AR Feature Testing
1. Use **Option 2** (ngrok) - easiest HTTPS setup
2. Start ngrok when you need to test AR specifically
3. Keep it running during AR development sessions

### For Production-Like Testing
1. Use **Option 3** (Self-Signed Cert) - most realistic
2. Set up once, use throughout development

## Testing Checklist

Once you have HTTPS access on mobile:

- [ ] Open menu page on mobile
- [ ] Verify "View in AR" button is visible and tappable
- [ ] Tap button - should request camera permission
- [ ] Grant camera permission
- [ ] Verify camera view appears (AR session started)
- [ ] Move phone around to scan environment
- [ ] Verify reticle appears on flat surfaces (floor, table, desk)
- [ ] Tap screen when reticle is visible
- [ ] Verify 3D model appears at tap location
- [ ] Move around the model - verify it stays anchored
- [ ] Tap multiple times - verify multiple models appear
- [ ] Test on different surfaces (horizontal and vertical)
- [ ] Test in different lighting conditions
- [ ] Verify "Exit AR" button works

## Troubleshooting

### "WebXR not supported" on mobile
- Ensure you're using HTTPS (not HTTP)
- Check browser compatibility (Safari on iOS 15.4+, Chrome on Android)
- Verify device has AR capabilities (ARCore on Android, ARKit on iOS)

### Camera permission denied
- Go to phone Settings → Safari/Chrome → Camera
- Enable camera access for the browser
- Reload the page

### Reticle not appearing
- Move phone slowly to scan surfaces
- Ensure good lighting
- Try different surfaces (flat, textured surfaces work best)
- Check browser console for hit-test errors

### Models not placing
- Verify reticle is visible before tapping
- Check browser console for model loading errors
- Ensure placeholder model URL is accessible

### Performance issues
- Close other apps on phone
- Reduce model complexity (check polygon count)
- Test on newer device if available
- Check for console errors indicating memory issues

## Quick Reference Commands

```bash
# Find local IP (macOS)
ipconfig getifaddr en0

# Start dev server on all interfaces
npm run dev -- -H 0.0.0.0

# Start ngrok tunnel
ngrok http 3000

# Generate self-signed cert
mkcert YOUR_LOCAL_IP localhost
```

## Additional Resources

- [WebXR Device API Spec](https://www.w3.org/TR/webxr/)
- [ngrok Documentation](https://ngrok.com/docs)
- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Can I Use WebXR](https://caniuse.com/webxr)
