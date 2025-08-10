// src/scene.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { addFish, updateFishes } from "./fish";
import { addCoral } from "./coral";

interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

let lastTime = performance.now();

export function initScene(): SceneContext {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x002b36);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById("reefCanvas") as HTMLCanvasElement,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  hemiLight.position.set(0, 5, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(-3, 10, -10);
  scene.add(dirLight);

  // Tank floor (smaller test tank)
  const floorGeo = new THREE.PlaneGeometry(6, 6);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x553311,
    roughness: 0.8,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  scene.add(floor);

  // Add axis markers
  function createAxisLine(color: number, start: THREE.Vector3, end: THREE.Vector3) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ 
      color: color,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    return new THREE.Line(geometry, material);
  }

  // Create axis lines (slightly above the floor to prevent z-fighting)
  const axisY = 0.01; // Slightly above the floor
  const axisLength = 2.8; // Length of the axis lines
  
  // X-axis (red)
  const xAxis = createAxisLine(
    0xff0000,
    new THREE.Vector3(-axisLength, axisY, 0),
    new THREE.Vector3(axisLength, axisY, 0)
  );
  
  // Z-axis (blue)
  const zAxis = createAxisLine(
    0x0000ff,
    new THREE.Vector3(0, axisY, -axisLength),
    new THREE.Vector3(0, axisY, axisLength)
  );
  
  // Add axis lines to the scene
  scene.add(xAxis, zAxis);
  
  // Add labels
  function createAxisLabel(text: string, position: THREE.Vector3, color: number) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Group();
    
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.8
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.25, 1);
    return sprite;
  }
  
  // Add labels at the ends of the axes
  scene.add(createAxisLabel('+X', new THREE.Vector3(axisLength + 0.3, 0.1, 0), 0xff0000));
  scene.add(createAxisLabel('-X', new THREE.Vector3(-axisLength - 0.3, 0.1, 0), 0xff0000));
  scene.add(createAxisLabel('+Z', new THREE.Vector3(0, 0.1, axisLength + 0.3), 0x0000ff));
  scene.add(createAxisLabel('-Z', new THREE.Vector3(0, 0.1, -axisLength - 0.3), 0x0000ff));

  // Add coral
  addCoral(scene);
  
  // Add initial fish at the center
  addFish(scene);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  window.addEventListener("resize", onWindowResize);

  return { scene, camera, renderer, controls };
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function startAnimationLoop() {
  lastTime = performance.now();
  const animate = (timestamp: number) => {
    requestAnimationFrame(animate);
    
    // Calculate delta time (capped to prevent large jumps)
    const now = performance.now();
    const delta = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    
    // Update fish movement
    updateFishes(delta);
    
    // Update controls and render
    controls.update();
    renderer.render(scene, camera);
  };
  
  // Start the loop
  requestAnimationFrame(animate);
}
