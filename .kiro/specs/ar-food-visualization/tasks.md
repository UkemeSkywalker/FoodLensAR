# Implementation Plan: AR Food Visualization

- [ ] 0. Setup mobile testing environment (Optional - do early for continuous mobile testing)
  - Install ngrok: `brew install ngrok` or `npm install -g ngrok`
  - Start ngrok tunnel: `ngrok http 3000` (in separate terminal)
  - Save the HTTPS URL for mobile testing
  - Keep ngrok running throughout development for instant mobile testing
  - See MOBILE_TESTING_GUIDE.md for detailed instructions
  - _This allows you to test on mobile after every task!_

- [ ] 1. Database schema update for 3D model storage
  - Add model_url column to menu_items table
  - Create database migration script
  - Update TypeScript MenuItem interface to include model_url field
  - _Requirements: 9.1, 9.2_

- [ ] 1.1 Write property test for null model_url handling
  - **Property 18: Null Model URL Handling**
  - **Validates: Requirements 9.2**

- [ ] 2. Create WebXR utility library
  - Implement checkWebXRSupport function to detect AR capability
  - Implement requestARSession function with hit-test feature
  - Implement createReferenceSpace function for local and viewer spaces
  - Implement requestHitTestSource function for surface detection
  - Define constants for default model URLs (placeholder and reticle)
  - Add error handling for unsupported devices
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 8.1_

- [ ] 2.1 Write property test for WebXR session configuration
  - **Property 1: WebXR Session Request Includes Hit-Test**
  - **Validates: Requirements 1.2**

- [ ] 2.2 Write property test for reference space creation
  - **Property 2: Local Reference Space Creation**
  - **Validates: Requirements 1.5**

- [ ] 2.3 Write property test for hit test source configuration
  - **Property 5: Hit Test Source Uses Viewer Space**
  - **Validates: Requirements 3.1**

- [ ] 3. Implement 3D model loading utilities
  - Create model loader function using GLTFLoader from three.js
  - Implement model URL selection logic (custom vs default placeholder)
  - Add error handling with fallback to default model
  - Implement reticle model loading
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5, 8.3_

- [ ] 3.1 Write property test for model URL selection
  - **Property 3: Model URL Selection Logic**
  - **Validates: Requirements 2.2, 2.3, 9.3, 9.4, 9.5**

- [ ] 3.2 Write unit tests for model loading error handling
  - Test fallback to default model on load failure
  - Test error logging for failed loads
  - _Requirements: 8.3_

- [ ] 4. Create AR Viewer client component
  - Create ARViewer.tsx component with state management
  - Implement WebXR session initialization on component mount
  - Set up three.js scene with camera and renderer
  - Configure renderer with alpha transparency and preserveDrawingBuffer
  - Add directional lighting to scene
  - Implement cleanup function to release resources on unmount
  - _Requirements: 1.1, 1.4, 1.5, 7.1, 7.4, 7.5_

- [ ] 4.1 Write property test for renderer configuration
  - **Property 16: Renderer Alpha Configuration**
  - **Property 17: Renderer Preserve Drawing Buffer**
  - **Validates: Requirements 7.4, 7.5**

- [ ] 4.2 Write property test for scene lighting
  - **Property 15: Scene Contains Directional Light**
  - **Validates: Requirements 7.1**

- [ ] 5. Implement hit testing and reticle display
  - Create hit test source using viewer reference space
  - Load reticle GLTF model
  - Implement reticle visibility logic based on hit test results
  - Update reticle position on each animation frame
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5.1 Write property test for reticle visibility
  - **Property 6: Reticle Visibility Based on Hit Results**
  - **Validates: Requirements 3.2, 3.3**

- [ ] 5.2 Write property test for reticle position updates
  - **Property 7: Reticle Position Updates**
  - **Validates: Requirements 3.4**

- [ ] 6. Implement model placement on user interaction
  - Add select event listener to XR session
  - Implement model cloning and placement at reticle position
  - Add placed models to scene
  - Track placed models in component state
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6.1 Write property test for model placement
  - **Property 8: Model Placement on Select Event**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6.2 Write property test for multiple model instances
  - **Property 9: Multiple Model Instances**
  - **Validates: Requirements 4.4**

- [ ] 7. Implement continuous rendering loop
  - Set up XRSession.requestAnimationFrame loop
  - Bind WebXR framebuffer on each frame
  - Retrieve viewer pose using getViewerPose
  - Update camera matrices from pose
  - Perform hit testing and update reticle
  - Render scene with three.js renderer
  - Handle mobile single-view rendering
  - Set viewport size from XR base layer
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 10.2, 10.3_

- [ ] 7.1 Write property test for animation loop behavior
  - **Property 11: Animation Loop Calls GetViewerPose**
  - **Property 12: Camera Matrix Updates from Pose**
  - **Property 13: Render After Camera Update**
  - **Property 14: Framebuffer Binding**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

- [ ] 7.2 Write property test for mobile rendering
  - **Property 19: Mobile Single-View Rendering**
  - **Property 20: Viewport Size Configuration**
  - **Validates: Requirements 10.2, 10.3**

- [ ] 8. Create AR viewer page route
  - Create /ar/[menuItemId]/page.tsx server component
  - Fetch menu item data including model_url from database
  - Pass menu item data to ARViewer client component
  - Handle invalid menu item IDs with error page
  - _Requirements: 5.3_

- [ ] 8.1 Write unit test for menu item data fetching
  - Test valid menu item ID returns data
  - Test invalid menu item ID returns error
  - _Requirements: 5.3_

- [ ] 9. Create AR Button component
  - Create ARButton.tsx component
  - Implement navigation to /ar/[menuItemId] on click
  - Add disabled state for unsupported devices
  - Style button to match app design system
  - _Requirements: 5.1, 5.2_

- [ ] 9.1 Write property test for AR navigation
  - **Property 10: AR Navigation Includes Menu Item ID**
  - **Validates: Requirements 5.2, 5.3**

- [ ] 10. Integrate AR button into menu page
  - Add ARButton to CustomerMenuItemCard component
  - Position button prominently on each menu item
  - Ensure button is visible and accessible
  - _Requirements: 5.1_

- [ ] 10.1 Manual Testing Checkpoint - Test AR button in browser
  - Run `npm run dev` and navigate to `/menu/[restaurantId]`
  - Verify "View in AR" button appears on each menu item
  - Click button and verify navigation to `/ar/[menuItemId]`
  - Check that menu item ID is correctly passed in URL
  - Test with multiple menu items
  - _Browser testing before mobile setup_

- [ ] 11. Update menu item API to include model_url
  - Modify GET /api/menu/[itemId]/route.ts to return model_url field
  - Update response TypeScript interface
  - Ensure backward compatibility for existing clients
  - _Requirements: 2.1, 9.3_

- [ ] 11.1 Write unit test for API response format
  - Test response includes model_url field
  - Test null and non-null model_url values
  - _Requirements: 9.3_

- [ ] 12. Implement error handling and user feedback
  - Add error state display in ARViewer component
  - Implement "Exit AR" button for error recovery
  - Add user-friendly error messages for common failures
  - Implement warning display for missing hit-test support
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.1 Write unit tests for error scenarios
  - Test WebXR not supported error display
  - Test session request failure handling
  - Test model loading failure recovery
  - Test hit-test unavailable warning
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 13. Add three.js and WebXR dependencies
  - Install three.js package (version 0.126.0 or higher)
  - Install @types/three for TypeScript support
  - Add three.js GLTFLoader to project
  - Update package.json with new dependencies
  - _Requirements: 2.4_

- [ ] 13.1 Manual Testing Checkpoint - Verify dependencies installed
  - Run `npm run dev` to ensure no build errors
  - Check that three.js is accessible in browser console
  - Verify TypeScript types are working (no type errors)
  - _Quick verification before continuing_

- [ ] 14. Create AR types and interfaces
  - Define TypeScript interfaces for AR viewer props and state
  - Define types for WebXR session management
  - Define types for three.js scene objects
  - Export types from src/types/index.ts
  - _Requirements: All_

- [ ] 15. Manual Testing Checkpoint - Test AR basics in browser
  - Run `npm run dev` and navigate to a menu page
  - Verify "View in AR" button appears on menu items
  - Click button and verify navigation to AR page
  - Check browser console for WebXR support detection
  - Verify appropriate error message if WebXR not supported
  - Test on desktop Chrome/Edge (may show "not supported" - this is expected)
  - _Manual verification before proceeding to mobile testing_

- [ ] 16. Verify mobile testing setup
  - If you haven't already, setup ngrok (see Task 0)
  - Verify you can access the app via HTTPS on mobile
  - Test basic navigation from mobile browser
  - Confirm WebXR support detection works on mobile
  - _Requirements: 10.1_

- [ ] 17. Manual Testing Checkpoint - Test AR on mobile device
  - Access app from mobile device (iOS Safari or Android Chrome)
  - Navigate to menu page and click "View in AR"
  - Verify camera permission request appears
  - Verify AR session starts and camera view displays
  - Test surface detection - move phone to scan surfaces
  - Verify reticle appears on detected surfaces
  - Tap screen to place 3D model
  - Verify model appears and stays anchored
  - Place multiple models by tapping different locations
  - Test from different angles and distances
  - _Manual verification of core AR functionality_

- [ ] 18. Add AR feature documentation
  - Update README with AR feature description
  - Document WebXR browser compatibility
  - Add mobile testing setup instructions
  - Document how to access localhost from mobile (network IP, ngrok, etc.)
  - Add usage instructions for customers
  - Document model_url database field
  - Include troubleshooting section for common AR issues
  - _Requirements: All_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
