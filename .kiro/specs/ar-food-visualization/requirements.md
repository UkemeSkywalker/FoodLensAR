# Requirements Document: AR Food Visualization

## Introduction

This feature adds Augmented Reality (AR) capabilities to Food Lens, allowing customers to visualize menu items as 3D models placed on real-world surfaces before ordering. Using WebXR technology, customers can scan a restaurant's QR code, browse the menu, and tap any food item to view it in AR on their table or any surface through their mobile device camera.

## Glossary

- **WebXR**: Web-based API for creating immersive AR and VR experiences in browsers
- **AR Session**: An active augmented reality viewing session where virtual objects are overlaid on the real world
- **Hit Test**: A ray-casting technique to detect intersections between virtual rays and real-world surfaces
- **GLTF Model**: A 3D model file format (GL Transmission Format) optimized for web delivery
- **Reticle**: A visual indicator showing where a 3D object will be placed on a real-world surface
- **Customer Menu Page**: The public-facing menu page at `/menu/[restaurantId]` accessible via QR code
- **Menu Item**: A food dish entry in the restaurant's menu with name, description, price, and images
- **three.js**: A JavaScript library for creating and rendering 3D graphics in the browser
- **XRReferenceSpace**: A coordinate system used to track positions in AR/VR space

## Requirements

### Requirement 1: AR Session Initialization

**User Story:** As a customer, I want to activate AR mode when viewing a menu item, so that I can see the food in 3D on real-world surfaces.

#### Acceptance Criteria

1. WHEN a customer clicks the "View in AR" button on a menu item THEN the system SHALL request an immersive AR session using WebXR
2. WHEN the AR session is requested THEN the system SHALL include the hit-test feature for surface detection
3. IF the device does not support WebXR THEN the system SHALL display an error message indicating AR is not available
4. WHEN the AR session starts successfully THEN the system SHALL activate the device camera and display the AR view
5. WHEN the AR session initializes THEN the system SHALL create a local reference space with origin near the viewer

### Requirement 2: 3D Model Loading and Display

**User Story:** As a customer, I want to see a 3D representation of the food item in AR, so that I can visualize how it looks before ordering.

#### Acceptance Criteria

1. WHEN the AR session starts THEN the system SHALL load the GLTF model associated with the menu item
2. IF the menu item has a custom model URL THEN the system SHALL load that model from the specified URL
3. IF the menu item does not have a custom model URL THEN the system SHALL load the default placeholder model from `https://immersive-web.github.io/webxr-samples/media/gltf/camp/camp.gltf`
4. WHEN loading 3D models THEN the system SHALL use three.js GLTFLoader for model parsing
5. WHEN the model loads successfully THEN the system SHALL add it to the three.js scene with appropriate lighting

### Requirement 3: Surface Detection and Reticle Display

**User Story:** As a customer, I want to see where I can place the 3D food model, so that I know which surfaces are detected.

#### Acceptance Criteria

1. WHEN the AR session is active THEN the system SHALL perform continuous hit testing from the viewer's center
2. WHEN hit test results detect a surface THEN the system SHALL display a reticle at the intersection point
3. WHEN no surface is detected THEN the system SHALL hide the reticle
4. WHEN the reticle is displayed THEN the system SHALL update its position on every animation frame to track detected surfaces
5. WHEN displaying the reticle THEN the system SHALL load it from `https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf`

### Requirement 4: Model Placement on User Interaction

**User Story:** As a customer, I want to place the 3D food model on a surface by tapping the screen, so that I can view it from different angles.

#### Acceptance Criteria

1. WHEN the customer taps the screen during an AR session THEN the system SHALL place a copy of the 3D model at the reticle position
2. WHEN placing the model THEN the system SHALL use the current reticle position as the model's coordinates
3. WHEN a model is placed THEN the system SHALL add it to the scene and render it continuously
4. WHEN multiple taps occur THEN the system SHALL create multiple instances of the model at different positions
5. WHEN models are placed THEN the system SHALL maintain their positions relative to detected surfaces as the user moves

### Requirement 5: AR View Integration with Menu

**User Story:** As a customer, I want to easily access AR view from the menu page, so that I can quickly visualize any food item.

#### Acceptance Criteria

1. WHEN viewing the customer menu page THEN the system SHALL display a "View in AR" button on each menu item card
2. WHEN the "View in AR" button is clicked THEN the system SHALL navigate to the AR viewer for that specific menu item
3. WHEN navigating to AR view THEN the system SHALL pass the menu item ID to load the correct 3D model
4. WHEN the AR session ends THEN the system SHALL provide a way to return to the menu page
5. WHEN returning from AR view THEN the system SHALL preserve the customer's position on the menu page

### Requirement 6: Continuous Rendering and Camera Updates

**User Story:** As a customer, I want the AR view to update smoothly as I move my device, so that the experience feels natural and responsive.

#### Acceptance Criteria

1. WHEN the AR session is active THEN the system SHALL request animation frames continuously using XRSession.requestAnimationFrame
2. WHEN each animation frame is rendered THEN the system SHALL retrieve the viewer's pose relative to the reference space
3. WHEN the viewer's pose is retrieved THEN the system SHALL update the three.js camera matrix and projection matrix
4. WHEN the camera is updated THEN the system SHALL render the scene with the new camera position
5. WHEN rendering the scene THEN the system SHALL bind to the WebXR framebuffer for proper AR display

### Requirement 7: Scene Lighting and Visual Quality

**User Story:** As a customer, I want the 3D food models to be well-lit and visually clear, so that I can see details of the dish.

#### Acceptance Criteria

1. WHEN the three.js scene is created THEN the system SHALL add directional lighting to illuminate models
2. WHEN adding directional light THEN the system SHALL position it at coordinates that provide good visibility
3. WHEN rendering models THEN the system SHALL use appropriate light intensity to avoid over-exposure or darkness
4. WHEN the AR session starts THEN the system SHALL configure the renderer with alpha transparency for proper AR blending
5. WHEN rendering THEN the system SHALL preserve the drawing buffer to maintain visual consistency

### Requirement 8: Error Handling and Fallbacks

**User Story:** As a customer, I want clear feedback when AR features are unavailable, so that I understand why I cannot use AR.

#### Acceptance Criteria

1. IF navigator.xr is undefined THEN the system SHALL display a message that WebXR is not supported on this device
2. IF the AR session request fails THEN the system SHALL catch the error and display a user-friendly message
3. IF a 3D model fails to load THEN the system SHALL log the error and attempt to load the fallback placeholder model
4. IF the hit-test feature is not available THEN the system SHALL inform the user that surface detection is unavailable
5. WHEN errors occur THEN the system SHALL provide an option to return to the regular menu view

### Requirement 9: Database Schema for 3D Models

**User Story:** As a system administrator, I want menu items to store references to 3D models, so that custom models can be associated with specific dishes.

#### Acceptance Criteria

1. WHEN the menu_items table is queried THEN the system SHALL include a model_url column of type TEXT
2. WHEN a menu item is created without a model URL THEN the system SHALL allow the model_url to be NULL
3. WHEN retrieving a menu item for AR display THEN the system SHALL check if model_url is NULL or contains a valid URL
4. WHEN model_url is NULL THEN the system SHALL use the default placeholder model URL
5. WHEN model_url contains a value THEN the system SHALL use that URL to load the custom 3D model

### Requirement 10: Mobile Device Compatibility

**User Story:** As a customer using a mobile device, I want AR to work on my phone, so that I can use the feature while at the restaurant.

#### Acceptance Criteria

1. WHEN accessing AR features on mobile devices THEN the system SHALL support both iOS and Android platforms with WebXR capability
2. WHEN the AR session starts on mobile THEN the system SHALL handle single-view rendering for mobile AR
3. WHEN rendering on mobile THEN the system SHALL set the viewport size based on the XR session's base layer
4. WHEN the user interacts on mobile THEN the system SHALL handle touch events as select actions for model placement
5. WHEN the device orientation changes THEN the system SHALL maintain proper AR tracking and rendering
