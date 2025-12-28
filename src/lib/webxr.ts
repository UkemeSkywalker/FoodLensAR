// WebXR utilities for AR Food Visualization
import * as THREE from 'three';

// Default model URLs
export const DEFAULT_MODEL_URL = 'https://immersive-web.github.io/webxr-samples/media/gltf/camp/camp.gltf';
export const RETICLE_MODEL_URL = 'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf';

/**
 * Check if WebXR is supported on the current device
 */
export async function checkWebXRSupport(): Promise<{
  supported: boolean;
  error?: string;
}> {
  if (!navigator.xr) {
    return {
      supported: false,
      error: 'WebXR is not supported on this device'
    };
  }
  
  try {
    const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!isSupported) {
      return {
        supported: false,
        error: 'AR mode is not supported on this device'
      };
    }
    
    return { supported: true };
  } catch (error) {
    return {
      supported: false,
      error: 'Failed to check WebXR support: ' + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Test if three.js is properly loaded and accessible
 */
export function testThreeJSAvailability(): boolean {
  try {
    // Test basic three.js functionality
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    // Clean up test objects
    renderer.dispose();
    
    return true;
  } catch (error) {
    console.error('Three.js test failed:', error);
    return false;
  }
}