# Design Document: AR Food Visualization

## Overview

The AR Food Visualization feature extends Food Lens with immersive augmented reality capabilities, allowing customers to view 3D representations of menu items on real-world surfaces through their mobile devices. This feature leverages WebXR Device API and three.js to create an engaging pre-ordering experience where customers can visualize dishes at actual scale on their table.

The implementation follows a progressive enhancement approach: customers can browse menus normally, but those with WebXR-capable devices gain access to AR visualization. The system uses hit testing to detect surfaces and allows users to place multiple 3D food models in their environment.

## Architecture

### High-Level Architecture

```
Customer Device (Mobile Browser)
    ↓
WebXR Device API
    ↓
AR Viewer Component (React + three.js)
    ↓
    ├─→ WebXR Session Manager
    ├─→ 3D Model Loader (GLTFLoader)
    ├─→ Hit Test Manager
    ├─→ Scene Renderer (three.js)
    └─→ User Interaction Handler
    ↓
Menu Item API (/api/menu/[itemId])
    ↓
Supabase Database (menu_items table with model_url)
    ↓
AWS S3 (3D Model Storage - future)
```

### Component Interaction Flow

1. **Menu Page** → Customer clicks "View in AR" button
2. **AR Viewer Page** → Initializes WebXR session
3. **WebXR Session** → Requests camera access and AR capabilities
4. **Model Loader** → Fetches GLTF model from URL (S3 or placeholder)
5. **Hit Test Manager** → Continuously detects surfaces
6. **Reticle Renderer** → Shows placement indicator
7. **User Tap** → Places model at reticle position
8. **Animation Loop** → Continuously renders scene with updated camera

## Components and Interfaces

### 1. AR Viewer Page Component

**Location:** `src/app/ar/[menuItemId]/page.tsx`

**Purpose:** Server-side rendered page that loads menu item data and initializes AR viewer

**Interface:**
```typescript
interface ARViewerPageProps {
  params: {
    menuItemId: string;
  };
}

// Fetches menu item data including model_url
// Renders ARViewerClient component with menu item data
```

### 2. AR Viewer Client Component

**Location:** `src/components/ar/ARViewer.tsx`

**Purpose:** Client-side component that manages WebXR session and 3D rendering

**Interface:**
```typescript
interface ARViewerProps {
  menuItem: {
    id: string;
    name: string;
    model_url: string | null;
  };
  onExit: () => void;
}

interface ARViewerState {
  isARSupported: boolean;
  isSessionActive: boolean;
  error: string | null;
}
```

**Key Methods:**
- `initializeAR()`: Sets up WebXR session with hit-test feature
- `setupScene()`: Creates three.js scene with lighting
- `loadModel()`: Loads GLTF model using GLTFLoader
- `startRenderLoop()`: Begins continuous animation frame rendering
- `handleSelect()`: Places model on tap/select event
- `cleanup()`: Terminates session and releases resources

### 3. WebXR Manager Utility

**Location:** `src/lib/webxr.ts`

**Purpose:** Utility functions for WebXR session management

**Interface:**
```typescript
interface WebXRManager {
  checkSupport(): Promise<boolean>;
  requestSession(features: string[]): Promise<XRSession>;
  createReferenceSpace(session: XRSession, type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
  requestHitTestSource(session: XRSession, space: XRReferenceSpace): Promise<XRHitTestSource>;
}

// Default placeholder model URL
const DEFAULT_MODEL_URL = 'https://immersive-web.github.io/webxr-samples/media/gltf/camp/camp.gltf';
const RETICLE_MODEL_URL = 'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf';
```

### 4. AR Button Component

**Location:** `src/components/ar/ARButton.tsx`

**Purpose:** Reusable button component for triggering AR view

**Interface:**
```typescript
interface ARButtonProps {
  menuItemId: string;
  disabled?: boolean;
  className?: string;
}

// Renders button that navigates to /ar/[menuItemId]
// Shows disabled state if WebXR not supported
```

### 5. Menu Item API Enhancement

**Location:** `src/app/api/menu/[itemId]/route.ts` (existing, to be enhanced)

**Purpose:** Return menu item data including model_url field

**Response Interface:**
```typescript
interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  model_url: string | null;  // New field
  restaurant_id: string;
  created_at: string;
}
```

## Data Models

### Database Schema Changes

**Table:** `menu_items`

**New Column:**
```sql
ALTER TABLE menu_items
ADD COLUMN model_url TEXT NULL;

COMMENT ON COLUMN menu_items.model_url IS 'URL to GLTF 3D model file, NULL uses default placeholder';
```

**Updated TypeScript Interface:**
```typescript
interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  model_url: string | null;  // New field
  created_at: string;
  updated_at: string;
}
```

### Three.js Scene Structure

```typescript
interface ARScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  light: THREE.DirectionalLight;
  reticle: THREE.Object3D | null;
  placedModels: THREE.Object3D[];
  modelTemplate: THREE.Object3D | null;
}
```

## Cor
rectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the requirements analysis, the following properties must hold for the AR Food Visualization feature:

**Property 1: WebXR Session Request Includes Hit-Test**
*For any* AR session initialization, when requestSession is called, the requiredFeatures array must include 'hit-test'
**Validates: Requirements 1.2**

**Property 2: Local Reference Space Creation**
*For any* successful AR session, requestReferenceSpace must be called with 'local' as the space type
**Validates: Requirements 1.5**

**Property 3: Model URL Selection Logic**
*For any* menu item with a non-null model_url, the system must load the model from that URL; for any menu item with null model_url, the system must load the default placeholder URL
**Validates: Requirements 2.2, 2.3, 9.3, 9.4, 9.5**

**Property 4: Model Addition to Scene**
*For any* successfully loaded 3D model, the model must be added to the three.js scene
**Validates: Requirements 2.5**

**Property 5: Hit Test Source Uses Viewer Space**
*For any* AR session with hit-test capability, requestHitTestSource must be called with a viewer reference space
**Validates: Requirements 3.1**

**Property 6: Reticle Visibility Based on Hit Results**
*For any* animation frame, if hit test results are non-empty, the reticle must be visible; if hit test results are empty, the reticle must be hidden
**Validates: Requirements 3.2, 3.3**

**Property 7: Reticle Position Updates**
*For any* animation frame with valid hit test results, the reticle position must be updated to match the hit pose position
**Validates: Requirements 3.4**

**Property 8: Model Placement on Select Event**
*For any* select event during an active AR session, a new model instance must be added to the scene at the current reticle position
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 9: Multiple Model Instances**
*For any* sequence of N select events, the scene must contain N placed model instances (excluding the reticle and template model)
**Validates: Requirements 4.4**

**Property 10: AR Navigation Includes Menu Item ID**
*For any* "View in AR" button click, the navigation path must include the menu item ID in the format /ar/[menuItemId]
**Validates: Requirements 5.2, 5.3**

**Property 11: Animation Loop Calls GetViewerPose**
*For any* animation frame callback, getViewerPose must be called with the local reference space
**Validates: Requirements 6.2**

**Property 12: Camera Matrix Updates from Pose**
*For any* valid viewer pose, the camera's matrix and projectionMatrix must be updated from the pose's transform and projection matrices
**Validates: Requirements 6.3**

**Property 13: Render After Camera Update**
*For any* animation frame with a valid pose, renderer.render must be called after camera matrix updates
**Validates: Requirements 6.4**

**Property 14: Framebuffer Binding**
*For any* animation frame, gl.bindFramebuffer must be called with the session's base layer framebuffer before rendering
**Validates: Requirements 6.5**

**Property 15: Scene Contains Directional Light**
*For any* initialized AR scene, the scene must contain at least one DirectionalLight instance
**Validates: Requirements 7.1**

**Property 16: Renderer Alpha Configuration**
*For any* WebGLRenderer created for AR, the alpha property must be set to true
**Validates: Requirements 7.4**

**Property 17: Renderer Preserve Drawing Buffer**
*For any* WebGLRenderer created for AR, the preserveDrawingBuffer property must be set to true
**Validates: Requirements 7.5**

**Property 18: Null Model URL Handling**
*For any* database operation creating a menu item without specifying model_url, the value must be stored as NULL without error
**Validates: Requirements 9.2**

**Property 19: Mobile Single-View Rendering**
*For any* viewer pose on mobile devices, the system must access the first view from pose.views array (views[0])
**Validates: Requirements 10.2**

**Property 20: Viewport Size Configuration**
*For any* animation frame, the renderer size must be set to match the viewport dimensions from getViewport
**Validates: Requirements 10.3**

## Error Handling

### WebXR Support Detection

```typescript
async function checkWebXRSupport(): Promise<{
  supported: boolean;
  error?: string;
}> {
  if (!navigator.xr) {
    return {
      supported: false,
      error: 'WebXR is not supported on this device'
    };
  }
  
  const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
  if (!isSupported) {
    return {
      supported: false,
      error: 'AR mode is not supported on this device'
    };
  }
  
  return { supported: true };
}
```

### Session Request Error Handling

```typescript
try {
  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['hit-test']
  });
  return session;
} catch (error) {
  console.error('Failed to create AR session:', error);
  throw new Error('Could not start AR session. Please ensure camera permissions are granted.');
}
```

### Model Loading Error Handling

```typescript
function loadModel(url: string): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (error) => {
        console.error('Model loading failed:', error);
        
        // Attempt fallback to default model
        if (url !== DEFAULT_MODEL_URL) {
          console.log('Attempting to load fallback model');
          loadModel(DEFAULT_MODEL_URL)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('Failed to load 3D model'));
        }
      }
    );
  });
}
```

### Hit Test Feature Error Handling

```typescript
try {
  const hitTestSource = await session.requestHitTestSource({
    space: viewerSpace
  });
  return hitTestSource;
} catch (error) {
  console.error('Hit test not available:', error);
  // Continue without hit testing, but inform user
  showWarning('Surface detection unavailable. Models may not align with real-world surfaces.');
  return null;
}
```

### General Error Recovery

All AR components should implement:
1. Try-catch blocks around WebXR API calls
2. User-friendly error messages (no technical jargon)
3. Fallback to menu view with "Exit AR" button
4. Logging of errors for debugging
5. Graceful degradation when features unavailable

## Testing Strategy

### Unit Testing

Unit tests will verify specific behaviors and edge cases:

**WebXR Manager Tests:**
- Test checkSupport returns false when navigator.xr is undefined
- Test checkSupport returns false when isSessionSupported returns false
- Test requestSession is called with correct parameters
- Test createReferenceSpace is called with correct space type

**Model Loading Tests:**
- Test loadModel uses custom URL when model_url is provided
- Test loadModel uses default URL when model_url is null
- Test loadModel falls back to default on loading error
- Test model is added to scene after successful load

**AR Viewer Component Tests:**
- Test "View in AR" button navigates to correct path
- Test AR session initialization sequence
- Test cleanup releases resources on unmount
- Test error states display appropriate messages

**Hit Test Tests:**
- Test reticle visibility toggles based on hit results
- Test reticle position updates from hit pose
- Test hit test source uses viewer space

**Model Placement Tests:**
- Test select event adds model to scene
- Test placed model position matches reticle position
- Test multiple select events create multiple models

### Property-Based Testing

Property-based tests will verify universal behaviors across many inputs using **fast-check** library for TypeScript:

**Property Test 1: Model URL Selection**
- Generate random menu items with null and non-null model_url values
- Verify correct URL is selected for loading
- **Validates: Property 3**

**Property Test 2: Reticle Visibility**
- Generate random hit test result arrays (empty and non-empty)
- Verify reticle visibility matches result presence
- **Validates: Property 6**

**Property Test 3: Model Instance Count**
- Generate random number of select events (0-20)
- Verify scene contains exactly that many placed models
- **Validates: Property 9**

**Property Test 4: Camera Matrix Updates**
- Generate random pose matrices
- Verify camera matrices are updated correctly
- **Validates: Property 12**

**Property Test 5: Navigation Path Format**
- Generate random menu item IDs
- Verify navigation path includes ID in correct format
- **Validates: Property 10**

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Menu to AR Flow:**
   - Load menu page
   - Click "View in AR" button
   - Verify AR page loads with correct menu item
   - Verify WebXR session initialization

2. **Model Placement Flow:**
   - Initialize AR session
   - Wait for hit test results
   - Simulate select event
   - Verify model appears in scene

3. **Error Recovery Flow:**
   - Simulate WebXR not supported
   - Verify error message displays
   - Verify exit button returns to menu

4. **Database Integration:**
   - Create menu item with model_url
   - Load in AR viewer
   - Verify correct model loads
   - Create menu item without model_url
   - Verify placeholder model loads

### Manual Testing Checklist

Due to hardware requirements, some testing must be manual:

- [ ] Test on iOS device with WebXR support
- [ ] Test on Android device with WebXR support
- [ ] Verify camera activates correctly
- [ ] Verify surface detection works on various surfaces
- [ ] Verify models appear at correct scale
- [ ] Verify models stay anchored when moving device
- [ ] Verify multiple models can be placed
- [ ] Verify lighting makes models visible
- [ ] Test in various lighting conditions
- [ ] Verify performance is smooth (60fps target)

## Implementation Notes

### WebXR Browser Support

As of 2024, WebXR support varies:
- **Chrome/Edge (Android)**: Full support for immersive-ar
- **Safari (iOS 15.4+)**: Support via WebXR Device API
- **Firefox**: Limited AR support

The implementation should detect support and gracefully degrade.

### Performance Considerations

1. **Model Complexity**: GLTF models should be optimized for mobile
   - Target: < 5MB file size
   - Target: < 50k polygons
   - Use texture compression

2. **Render Loop**: Maintain 60fps for smooth AR
   - Minimize work in animation frame callback
   - Use object pooling for placed models
   - Limit number of placed models (e.g., max 10)

3. **Memory Management**: Clean up resources on exit
   - Dispose three.js geometries and materials
   - End XR session properly
   - Remove event listeners

### Security Considerations

1. **Camera Permissions**: WebXR requires user permission for camera access
2. **HTTPS Required**: WebXR only works on secure contexts
3. **Model URLs**: Validate and sanitize model URLs from database
4. **CORS**: Ensure 3D model files have proper CORS headers

### Accessibility

While AR is inherently visual, provide alternatives:
- Clear error messages for unsupported devices
- Text descriptions of 3D models
- Alternative 2D image view always available
- Keyboard navigation for AR button

## Future Enhancements

1. **Custom 3D Model Upload**: Allow restaurants to upload custom GLTF models
2. **Model Scaling**: Allow users to resize models in AR
3. **Model Rotation**: Allow users to rotate models before placement
4. **Multiple Models**: Show multiple menu items simultaneously
5. **Animations**: Add animations to 3D models (e.g., steam rising)
6. **Occlusion**: Use depth sensing for realistic occlusion
7. **Lighting Estimation**: Match virtual lighting to real-world lighting
8. **Social Sharing**: Capture AR screenshots to share
9. **Analytics**: Track AR usage and engagement metrics
10. **AI-Generated 3D Models**: Generate 3D models from 2D food images
