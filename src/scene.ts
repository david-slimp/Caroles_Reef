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
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1;
  scene.add(floor);

  // Add coral first and get its position
  const coral = addCoral(scene);
  
  // Create fish with coral position as home
  const start = addFish(scene, coral.position.clone());

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

export function animate() {
  requestAnimationFrame(animate);

  // --- integrate fish movement ---
  const now = performance.now();
  const dt = (now - lastTime) / 1000; // seconds
  lastTime = now;
  updateFishes(dt);

  controls.update();
  renderer.render(scene, camera);
}
