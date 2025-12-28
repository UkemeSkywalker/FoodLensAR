# Mobile Testing Guide for AR Food Visualization

## Setup Instructions

### 1. Start ngrok tunnel
```bash
ngrok http 3000
```

This will provide you with URLs like:
- HTTP: `http://abc123.ngrok.io`
- HTTPS: `https://abc123.ngrok.io` (Use this one for WebXR)

### 2. Test on Mobile Device

1. **Open the HTTPS URL** on your mobile device
2. **Navigate to `/ar-test`** to verify setup: `https://abc123.ngrok.io/ar-test`
3. **Check three.js status** - should show green indicator
4. **Check WebXR support** - may show red on some devices (expected)

### 3. Browser Console Test

On desktop browser:
1. Open browser console (F12)
2. Navigate to `http://localhost:3000/ar-test`
3. In console, type: `THREE`
4. Should see the THREE.js object

### 4. WebXR Requirements

For AR to work on mobile:
- **HTTPS is required** (ngrok provides this)
- **iOS**: Safari 15.4+ with WebXR support
- **Android**: Chrome with WebXR support
- **Camera permissions** will be requested when AR starts

### 5. Testing Checklist

- [ ] Development server runs without errors (`npm run dev`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Database migration applied (model_url column exists)
- [ ] Three.js loads without errors
- [ ] AR test page accessible via ngrok HTTPS URL
- [ ] Browser console shows THREE object

### 6. Expected Results

- **Desktop browsers**: WebXR will likely show "not supported" (expected)
- **Mobile browsers**: WebXR support varies by device and browser
- **Three.js**: Should work on all modern browsers
- **Database**: model_url column should be present in menu_items table

### 7. Troubleshooting

**If three.js fails to load:**
- Check browser console for import errors
- Verify package installation: `npm list three`
- Try refreshing the page

**If ngrok fails:**
- Ensure development server is running on port 3000
- Check ngrok installation: `ngrok version`
- Try different ngrok region if needed

**If database migration fails:**
- Check Supabase connection in `.env.local`
- Verify service role key has admin permissions
- Check database logs in Supabase dashboard