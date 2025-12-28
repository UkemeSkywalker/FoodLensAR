# Variant Launch AR Development Guide

## Overview

Variant Launch provides seamless cross-platform AR that works on both iOS and Android without the limitations of WebXR. This guide explains how to integrate and test AR features during development.

## Key Advantages of Variant Launch

- **iOS Support**: Uses App Clips - no WebXR limitations
- **Android Support**: Direct WebXR in Chrome
- **Seamless UX**: QR codes work identically on both platforms
- **No Permissions**: Camera access handled automatically
- **HTTPS Required**: Must use secure connection for iOS App Clips

## Prerequisites

- **Variant Launch Account**: Sign up at https://launch.variant3d.com
- **SDK Key**: Get your project SDK key from the dashboard
- **HTTPS Connection**: Required for iOS App Clips (use ngrok)
- **Mobile Devices**: 
  - iOS 14+ with Safari
  - Android with Chrome (ARCore support)

## Setup Process

### Step 1: Get Variant Launch SDK Key

1. Sign up at https://launch.variant3d.com
2. Create a new project
3. Copy your SDK key from the project dashboard
4. Add to your environment variables:
   ```bash
   # In .env.local
   NEXT_PUBLIC_VARIANT_LAUNCH_SDK_KEY=your_sdk_key_here
   ```

### Step 2: Setup HTTPS with ngrok

```bash
# Install ngrok
brew install ngrok

# Start your dev server
npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# This HTTPS URL is REQUIRED for iOS App Clips
```

### Step 3: Add Variant Launch SDK

Add to your app layout (e.g., `src/app/layout.tsx`):

```tsx
<script 
  src={`https://launchar.app/sdk/v1?key=${process.env.NEXT_PUBLIC_VARIANT_LAUNCH_SDK_KEY}&redirect=true`}
/>
```

## Testing Flow

### Desktop Testing (Limited)
```
http://localhost:3000
- Test UI and navigation
- AR will show "not supported" (expected)
- Verify no JavaScript errors
```

### Mobile Testing (Full AR)
```
https://[your-ngrok-url].ngrok.io
- iOS: App Clip downloads seamlessly
- Android: Direct WebXR support
- Full AR functionality works
```

## Platform-Specific Behavior

### iOS Experience
1. User taps "View in AR" button
2. **Variant Launch detects iOS** → redirects to Launch Card
3. **App Clip downloads** automatically (2-3 seconds)
4. **AR-enabled browser opens** with your page
5. **AR session starts** immediately - no permission prompts
6. User can place and view 3D models

### Android Experience  
1. User taps "View in AR" button
2. **Variant Launch detects Android** → uses native WebXR
3. **AR session starts** directly in Chrome
4. User can place and view 3D models

### Key Differences
- **iOS**: Brief App Clip download, then seamless AR
- **Android**: Immediate AR in browser
- **Both**: Same WebXR API, same three.js code
- **Both**: No camera permission prompts needed

## Development Workflow

### Recommended Setup
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: ngrok (keep running)
ngrok http 3000

# Use the ngrok HTTPS URL on mobile throughout development
# Hot reload works through ngrok!
```

### Testing After Each Change
1. Save your code (auto-reloads via ngrok)
2. Refresh mobile browser
3. Test new functionality
4. Verify on both iOS and Android if possible

## Code Integration

### Basic AR Session Setup

```typescript
// Check if AR is available via Variant Launch
const checkARSupport = async () => {
  if (!navigator.xr) {
    return false;
  }
  
  return await navigator.xr.isSessionSupported('immersive-ar');
};

// Start AR session (works on both iOS and Android)
const startARSession = async () => {
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['local', 'anchors', 'dom-overlay', 'hit-test']
  });
  
  return session;
};
```

### Variant Launch Event Handling

```typescript
// Listen for Variant Launch initialization
window.addEventListener('vlaunch-initialized', (event) => {
  const { launchRequired, webXRStatus, launchUrl } = event.detail;
  
  if (launchRequired) {
    // iOS user - redirect to Launch Card
    window.location.href = launchUrl;
  } else {
    // Android user - WebXR available directly
    startARSession();
  }
});

// Listen for tracking quality changes
document.addEventListener('vlaunch-ar-tracking', (event) => {
  switch(event.detail.state) {
    case 'normal':
      // Tracking working normally
      hideTrackingWarning();
      break;
    case 'limited-insufficient-features':
      showTrackingWarning('Point at textured surfaces');
      break;
    case 'limited-excessive-motion':
      showTrackingWarning('Move device more slowly');
      break;
  }
});
```

### Manual Launch URL Creation

```typescript
// Create launch URL for specific AR page
const createARLaunchURL = (menuItemId: string) => {
  const targetURL = `${window.location.origin}/ar/${menuItemId}`;
  return VLaunch.getLaunchUrl(targetURL);
};

// Use in AR button click handler
const handleARButtonClick = () => {
  if (window.VLaunch) {
    const launchUrl = createARLaunchURL(menuItemId);
    window.location.href = launchUrl;
  }
};
```

## Testing Checklist

### Basic Setup Testing
- [ ] ngrok HTTPS URL accessible on mobile
- [ ] Variant Launch SDK loads without errors
- [ ] Navigation to AR page works
- [ ] No console errors in browser dev tools

### iOS Testing
- [ ] "View in AR" button triggers App Clip download
- [ ] App Clip downloads and opens AR browser
- [ ] AR session starts automatically
- [ ] Camera view appears
- [ ] Surface detection works (reticle appears)
- [ ] Tap to place models works
- [ ] Models stay anchored when moving device
- [ ] Multiple model placement works
- [ ] Exit AR returns to menu

### Android Testing  
- [ ] "View in AR" button starts AR directly
- [ ] AR session starts in Chrome
- [ ] Camera view appears
- [ ] Surface detection works (reticle appears)
- [ ] Tap to place models works
- [ ] Models stay anchored when moving device
- [ ] Multiple model placement works
- [ ] Exit AR returns to menu

### Cross-Platform Testing
- [ ] Same AR experience on both platforms
- [ ] QR code scanning works on both platforms
- [ ] Performance is acceptable on both platforms
- [ ] Error handling works on both platforms

## Troubleshooting

### "App Clip won't download on iOS"
- Ensure using HTTPS URL (not HTTP)
- Verify Variant Launch SDK key is correct
- Check Safari browser (other browsers may not support App Clips)
- Try force-refreshing the page

### "AR not working on Android"
- Verify device has ARCore support
- Use Chrome browser (not other browsers)
- Check device has sufficient RAM/processing power
- Ensure HTTPS connection

### "Models not loading"
- Check browser console for network errors
- Verify model URLs are accessible
- Test with default sunflower model first
- Check CORS headers on model files

### "Tracking quality poor"
- Move device slowly to scan environment
- Ensure good lighting conditions
- Point at textured surfaces (not blank walls)
- Listen for Variant Launch tracking quality events

### "Performance issues"
- Close other apps on mobile device
- Test on newer device if available
- Reduce model complexity/polygon count
- Check for memory leaks in browser dev tools

## Performance Tips

### Optimize for Mobile
- Keep 3D models under 5MB
- Target <50k polygons per model
- Use texture compression
- Limit simultaneous models (max 5-10)

### Monitor Performance
- Use browser dev tools on mobile
- Watch for memory leaks
- Monitor frame rate (target 30fps minimum)
- Test on older devices

## Variant Launch vs WebXR Comparison

| Feature | WebXR (Native) | Variant Launch |
|---------|----------------|----------------|
| iOS Support | Limited/None | ✅ Full (App Clips) |
| Android Support | ✅ Chrome only | ✅ Chrome |
| Setup Complexity | High | Low |
| Permission Prompts | Required | None |
| QR Code UX | Inconsistent | Seamless |
| Development | Complex | Simple |
| Cross-Platform | Poor | Excellent |

## Quick Commands Reference

```bash
# Start development
npm run dev

# Start ngrok tunnel  
ngrok http 3000

# Check Variant Launch SDK status
# Open browser console and check for VLaunch object

# Test AR support detection
navigator.xr?.isSessionSupported('immersive-ar')
```

## Summary

Variant Launch makes AR development much simpler:

1. **One SDK** works on both iOS and Android
2. **Same code** runs on both platforms  
3. **Better UX** with seamless App Clips on iOS
4. **Easier testing** with consistent behavior
5. **Production ready** with no WebXR compatibility issues

The key is setting up HTTPS via ngrok and getting your Variant Launch SDK key. After that, AR development is straightforward and cross-platform!