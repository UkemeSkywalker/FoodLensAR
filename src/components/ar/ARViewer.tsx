'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { checkWebXRSupport } from '@/lib/webxr';

interface ARViewerProps {
  menuItem?: {
    id: string;
    name: string;
    model_url?: string | null;
  };
  onExit?: () => void;
}

interface ARViewerState {
  isARSupported: boolean;
  isSessionActive: boolean;
  error: string | null;
  isLoading: boolean;
}

export default function ARViewer({ menuItem, onExit }: ARViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ARViewerState>({
    isARSupported: false,
    isSessionActive: false,
    error: null,
    isLoading: true,
  });

  // Three.js and WebXR references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sessionRef = useRef<XRSession | null>(null);
  const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
  const reticleRef = useRef<THREE.Object3D | null>(null);
  const modelTemplateRef = useRef<THREE.Object3D | null>(null);
  const placedModelsRef = useRef<THREE.Object3D[]>([]);

  useEffect(() => {
    checkSupport();
    return cleanup;
  }, []);

  const checkSupport = async () => {
    try {
      const support = await checkWebXRSupport();
      setState(prev => ({
        ...prev,
        isARSupported: support.supported,
        error: support.error || null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isARSupported: false,
        error: 'Failed to check WebXR support',
        isLoading: false,
      }));
    }
  };

  const initializeAR = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request AR session with hit-test feature
      const session = await navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test']
      });

      sessionRef.current = session;

      // Setup three.js scene
      setupScene();

      // Create reference space
      const referenceSpace = await session.requestReferenceSpace('local');
      referenceSpaceRef.current = referenceSpace;

      // Setup hit test source
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      hitTestSourceRef.current = hitTestSource;

      // Load models
      await loadModels();

      // Setup event listeners
      session.addEventListener('select', onSelect);
      session.addEventListener('end', onSessionEnd);

      // Start render loop
      session.requestAnimationFrame(onXRFrame);

      setState(prev => ({
        ...prev,
        isSessionActive: true,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to initialize AR:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to start AR session. Please ensure camera permissions are granted.',
        isLoading: false,
      }));
    }
  };

  const setupScene = () => {
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
      canvas: undefined,
      context: undefined,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;

    // Add directional lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    // Append renderer to container
    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }
  };

  const loadModels = async () => {
    const loader = new GLTFLoader();

    try {
      // Load sunflower model (as specified in the task)
      const sunflowerUrl = 'https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf';
      const sunflowerGltf = await new Promise<any>((resolve, reject) => {
        loader.load(sunflowerUrl, resolve, undefined, reject);
      });

      modelTemplateRef.current = sunflowerGltf.scene;
      modelTemplateRef.current.visible = false;
      sceneRef.current!.add(modelTemplateRef.current);

      // Load reticle model
      const reticleUrl = 'https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf';
      const reticleGltf = await new Promise<any>((resolve, reject) => {
        loader.load(reticleUrl, resolve, undefined, reject);
      });

      reticleRef.current = reticleGltf.scene;
      reticleRef.current.visible = false;
      sceneRef.current!.add(reticleRef.current);

    } catch (error) {
      console.error('Failed to load models:', error);
      throw new Error('Failed to load 3D models');
    }
  };

  const onXRFrame = (time: number, frame: XRFrame) => {
    const session = sessionRef.current;
    const referenceSpace = referenceSpaceRef.current;
    const hitTestSource = hitTestSourceRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const reticle = reticleRef.current;

    if (!session || !referenceSpace || !renderer || !camera) {
      return;
    }

    // Get viewer pose
    const pose = frame.getViewerPose(referenceSpace);
    if (!pose) {
      session.requestAnimationFrame(onXRFrame);
      return;
    }

    // Handle hit testing for reticle positioning
    if (hitTestSource && reticle) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const hitPose = hit.getPose(referenceSpace);
        if (hitPose) {
          reticle.visible = true;
          reticle.position.setFromMatrixPosition(hitPose.transform.matrix as any);
        }
      } else {
        reticle.visible = false;
      }
    }

    // Update camera for each view (mobile AR typically has one view)
    const view = pose.views[0];
    const viewport = session.renderState.baseLayer!.getViewport(view)!;
    
    renderer.setSize(viewport.width, viewport.height);
    
    // Update camera matrices
    camera.matrix.fromArray(view.transform.matrix as any);
    camera.projectionMatrix.fromArray(view.projectionMatrix as any);
    camera.updateMatrixWorld(true);

    // Bind framebuffer and render
    const gl = renderer.getContext() as WebGLRenderingContext;
    gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer!.framebuffer);
    
    renderer.render(sceneRef.current!, camera);

    // Request next frame
    session.requestAnimationFrame(onXRFrame);
  };

  const onSelect = () => {
    const reticle = reticleRef.current;
    const modelTemplate = modelTemplateRef.current;
    const scene = sceneRef.current;

    if (!reticle || !modelTemplate || !scene || !reticle.visible) {
      return;
    }

    // Clone the model and place it at reticle position
    const modelClone = modelTemplate.clone();
    modelClone.position.copy(reticle.position);
    modelClone.visible = true;
    
    scene.add(modelClone);
    placedModelsRef.current.push(modelClone);
  };

  const onSessionEnd = () => {
    cleanup();
    setState(prev => ({
      ...prev,
      isSessionActive: false,
    }));
  };

  const exitAR = () => {
    if (sessionRef.current) {
      sessionRef.current.end();
    }
  };

  const cleanup = () => {
    // Clean up WebXR session
    if (sessionRef.current) {
      sessionRef.current.removeEventListener('select', onSelect);
      sessionRef.current.removeEventListener('end', onSessionEnd);
      sessionRef.current = null;
    }

    // Clean up three.js objects
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current && rendererRef.current.domElement.parentNode) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
    }

    // Clear references
    referenceSpaceRef.current = null;
    hitTestSourceRef.current = null;
    reticleRef.current = null;
    modelTemplateRef.current = null;
    placedModelsRef.current = [];
    sceneRef.current = null;
    cameraRef.current = null;
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking AR support...</p>
        </div>
      </div>
    );
  }

  if (!state.isARSupported || state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-4">AR Not Available</h2>
          <p className="text-gray-300 mb-6">
            {state.error || 'Augmented Reality is not supported on this device.'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            AR features work best on mobile devices with WebXR support.
          </p>
          <button
            onClick={onExit}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (!state.isSessionActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🥽</div>
          <h2 className="text-xl font-bold mb-4">
            {menuItem ? `View ${menuItem.name} in AR` : 'AR Food Viewer'}
          </h2>
          <p className="text-gray-300 mb-6">
            Place 3D food models on real-world surfaces using your camera.
          </p>
          <div className="space-y-4">
            <button
              onClick={initializeAR}
              disabled={state.isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              {state.isLoading ? 'Starting AR...' : 'Start AR Experience'}
            </button>
            <button
              onClick={onExit}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black">
      {/* AR session is active, three.js renderer will be appended here */}
      
      {/* Exit button overlay */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={exitAR}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
        >
          Exit AR
        </button>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black bg-opacity-70 text-white p-4 rounded-lg">
          <p className="text-sm text-center">
            Move your device to scan surfaces. Tap to place {menuItem?.name || 'food models'}.
          </p>
        </div>
      </div>
    </div>
  );
}