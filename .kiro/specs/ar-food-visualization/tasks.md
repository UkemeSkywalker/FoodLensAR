# Implementation Plan: AR Food Visualization

- [x] 1. Setup dependencies and database schema
  - Install three.js (v0.126.0+) and @types/three packages
  - Add model_url column to menu_items table (TEXT, nullable)
  - Update TypeScript MenuItem interface to include model_url field
  - Setup mobile testing with ngrok: `ngrok http 3000` (HTTPS required for Variant Launch)
  - Get Variant Launch SDK key from https://launch.variant3d.com
  - _Requirements: 9.1, 9.2, 2.4_

- [x] 1.1 **Testing Checkpoint - Verify Setup**
  - Run `npm run dev` to ensure no build errors
  - Test database migration works
  - Access app via ngrok HTTPS URL on mobile device (required for Variant Launch)
  - Verify three.js is accessible in browser console
  - Sign up for Variant Launch account and get SDK key

- [-] 2. Create simple AR viewer component with Variant Launch
  - Add Variant Launch SDK script to app layout with SDK key
  - Create ARViewer.tsx following Variant Launch + three.js pattern
  - Initialize AR session using Variant Launch (works on both iOS and Android)
  - Setup three.js scene with camera, renderer, and directional lighting
  - Load sunflower model from: `https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf`
  - Load reticle model from: `https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf`
  - Handle iOS App Clip redirect flow and Android direct WebXR
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.4, 7.1_

- [ ] 2.1 **Testing Checkpoint - Cross-Platform AR Works**
  - Test AR viewer component in browser (expect "not supported" on desktop)
  - Test on **iOS device** via ngrok URL - should trigger App Clip download
  - Test on **Android device** via ngrok URL - should work directly in Chrome
  - Verify AR session starts and shows camera view on both platforms
  - Verify no permission prompts needed (handled by Variant Launch)

- [ ] 3. Implement hit testing and model placement
  - Create hit test source using viewer reference space
  - Show/hide reticle based on surface detection
  - Add tap event listener to place sunflower models at reticle position
  - Implement continuous rendering loop with pose updates
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 6.1, 6.2_

- [ ] 3.1 **Testing Checkpoint - Model Placement Works**
  - Test surface detection - move phone to scan surfaces
  - Verify reticle appears on detected surfaces
  - Tap screen to place sunflower model
  - Verify model appears and stays anchored to surface
  - Place multiple models by tapping different locations

- [ ] 4. Create AR page route and navigation
  - Create `/ar/[menuItemId]/page.tsx` route
  - Fetch menu item data from database
  - Pass menu item name to ARViewer component (use sunflower model for now)
  - Create ARButton component with navigation to AR page
  - Add ARButton to CustomerMenuItemCard component
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 4.1 **Testing Checkpoint - Navigation Works**
  - Navigate to menu page and verify "View in AR" buttons appear
  - Click button and verify navigation to AR page with correct menu item ID
  - Test AR functionality works from menu navigation
  - Verify menu item name displays in AR view

- [ ] 5. Add error handling and model URL support
  - Add Variant Launch AR support detection with user-friendly error messages
  - Implement model URL logic (use custom model_url if available, fallback to sunflower)
  - Add error handling for model loading failures
  - Add "Exit AR" button and session cleanup
  - Update menu item API to return model_url field
  - Add Variant Launch tracking quality feedback UI
  - _Requirements: 2.2, 2.3, 8.1, 8.2, 8.3, 9.3_

- [ ] 5.1 **Testing Checkpoint - Error Handling Works**
  - Test on desktop browser (should show "AR not supported" message)
  - Test with invalid model URLs (should fallback to sunflower)
  - Test "Exit AR" button functionality
  - Verify graceful handling of AR session failures
  - Test Variant Launch tracking quality feedback on mobile

- [ ] 6. Final testing and documentation
  - Test complete AR flow: menu → AR button → AR view → model placement
  - Test on multiple mobile devices (iOS Safari, Android Chrome)
  - Add basic documentation for AR feature usage
  - Ensure all tests pass
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 6.1 **Final Testing Checkpoint - Complete Cross-Platform AR Experience**
  - Test full customer journey: scan QR → view menu → click AR → place food models
  - Verify AR works seamlessly on **both iOS (App Clip) and Android (WebXR)**
  - Test with multiple menu items and different model URLs
  - Confirm performance is acceptable on mobile devices
  - Test QR code generation and scanning flow end-to-end
