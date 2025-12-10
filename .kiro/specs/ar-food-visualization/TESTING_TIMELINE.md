# Testing Timeline - When Can I Test What?

## TL;DR
- **Desktop browser**: Test after almost every task at `localhost:3000`
- **Mobile browser**: Setup ngrok once (Task 0), then test after every task!
- **Actual AR features**: Will work on mobile starting from Task 4 onwards

## Recommended Setup (Do This First!)

### One-Time Setup (5 minutes)
```bash
# Install ngrok
brew install ngrok

# Start your dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Save this URL - use it on your phone throughout development!
```

Now you can test on **both desktop AND mobile** after every task!

## Testing Timeline by Task

### Task 0: Setup Mobile Testing (Optional but Recommended)
**Do this first!** Then you can test on mobile throughout development.

### Task 1: Database Schema
**Desktop Test:**
- Run migration script
- Check database has `model_url` column
- Verify no errors

**Mobile Test:**
- Same as desktop (database changes)

### Tasks 2-3: WebXR Utilities & Model Loading
**Desktop Test:**
- Open browser console
- Check for WebXR detection
- Should see "WebXR not supported" (expected on desktop)
- Verify error handling works

**Mobile Test:**
- Open ngrok URL on phone
- Check browser console (use Safari/Chrome dev tools)
- Should see WebXR IS supported
- Verify no JavaScript errors

### Task 4: AR Viewer Component
**Desktop Test:**
- Navigate to `/ar/test-item-id`
- Should see error: "WebXR not supported on this device"
- Verify error message displays correctly
- Check UI layout

**Mobile Test:** 🎉 **First AR test!**
- Navigate to `/ar/test-item-id` on phone
- Should request camera permission
- Grant permission
- AR session should start!
- You'll see camera view (even if nothing else works yet)

### Tasks 5-6: Hit Testing & Model Placement
**Desktop Test:**
- Can't test AR features
- Check code for syntax errors
- Verify builds without errors

**Mobile Test:** 🎯 **Surface detection works!**
- Open AR view on phone
- Move phone around
- Should see reticle appear on surfaces
- Tap screen - model should place (if model loading works)

### Tasks 7: Rendering Loop
**Desktop Test:**
- Check console for errors
- Verify no infinite loops

**Mobile Test:** 🎨 **Full AR experience!**
- AR view should be smooth
- Camera updates in real-time
- Models stay anchored as you move

### Task 8-10: AR Page & Button Integration
**Desktop Test:**
- Navigate to menu page at `localhost:3000/menu/[restaurantId]`
- See "View in AR" button on each item
- Click button - navigates to AR page
- See "not supported" message (expected)

**Mobile Test:** 🚀 **Complete flow!**
- Open menu page on phone via ngrok URL
- See "View in AR" button
- Tap button
- AR session starts
- Place models on surfaces
- Full experience works!

### Tasks 11-14: API & Types
**Desktop Test:**
- Test API endpoints in browser/Postman
- Check TypeScript compilation
- Verify no type errors

**Mobile Test:**
- Same as desktop (backend changes)

### Task 15: Manual Testing Checkpoint
**Desktop Test:**
- Full UI flow on desktop
- All navigation works
- Error messages display correctly

**Mobile Test:**
- Full AR flow on mobile
- Everything should work end-to-end!

## Quick Testing Commands

### Start Development
```bash
# Terminal 1: Dev server
npm run dev

# Terminal 2: ngrok (for mobile testing)
ngrok http 3000
```

### Test on Desktop
```
Open: http://localhost:3000
```

### Test on Mobile
```
Open: https://[your-ngrok-url].ngrok.io
(Use the URL from ngrok terminal output)
```

## What You Can Test When

| Feature | Desktop | Mobile (HTTP) | Mobile (HTTPS via ngrok) |
|---------|---------|---------------|--------------------------|
| UI Layout | ✅ | ✅ | ✅ |
| Navigation | ✅ | ✅ | ✅ |
| Buttons | ✅ | ✅ | ✅ |
| API Calls | ✅ | ✅ | ✅ |
| Error Messages | ✅ | ✅ | ✅ |
| WebXR Detection | ✅ (shows "not supported") | ❌ (blocked) | ✅ |
| Camera Access | ❌ | ❌ | ✅ |
| AR Session | ❌ | ❌ | ✅ |
| Surface Detection | ❌ | ❌ | ✅ |
| Model Placement | ❌ | ❌ | ✅ |

## Pro Tips

### Keep ngrok Running
- Start ngrok once at the beginning
- Keep it running in a terminal
- Use the same URL throughout development
- Hot reload works through ngrok!

### Test Incrementally
After each task:
1. Save your code (auto-reloads)
2. Refresh browser (desktop or mobile)
3. Test the new feature
4. Fix any issues before moving to next task

### Use Browser Dev Tools on Mobile

**iOS Safari:**
1. Enable Web Inspector on iPhone: Settings → Safari → Advanced → Web Inspector
2. Connect iPhone to Mac via USB
3. Open Safari on Mac → Develop → [Your iPhone] → [Your Page]
4. See console logs, network requests, etc.

**Android Chrome:**
1. Enable USB Debugging on Android
2. Connect to computer via USB
3. Open Chrome on computer → `chrome://inspect`
4. See your mobile page and debug

### Quick Verification Checklist

After each task, verify:
- [ ] No console errors (red text)
- [ ] No TypeScript errors (in IDE)
- [ ] Page loads without crashing
- [ ] New feature appears/works as expected
- [ ] Existing features still work

## Common Issues

### "Can't connect to ngrok URL on mobile"
- Check both devices on same WiFi (not required for ngrok, but helps)
- Verify ngrok is running (check terminal)
- Try refreshing the page
- Check ngrok URL hasn't changed

### "WebXR not supported" on mobile with ngrok
- Ensure using HTTPS URL (not HTTP)
- Check browser: Safari on iOS 15.4+, Chrome on Android
- Verify device has AR capability
- Try restarting browser

### Changes not appearing
- Check dev server is running
- Verify hot reload worked (check terminal)
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check for console errors

### ngrok session expired
- Free tier: 2-hour sessions
- Just restart: `ngrok http 3000`
- URL will change - update on mobile
- Consider ngrok paid plan for longer sessions

## Summary

**You can test throughout development!**

1. **Setup ngrok once** (Task 0) - 5 minutes
2. **Test on desktop** after every task - instant feedback
3. **Test on mobile** after every task - full AR experience
4. **No waiting until Task 16** - test continuously!

The key is setting up ngrok early so you have HTTPS access on mobile from the start. Then every code change can be tested immediately on both desktop and mobile!
