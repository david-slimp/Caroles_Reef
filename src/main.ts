import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { addFish, Fish } from './fish';
import { addCoral } from './coral';
import { VERSION_DISPLAY } from './config/version';

console.log('Initializing Three.js scene...');

// Track all fish in the scene
const fishes: Fish[] = [];

// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
console.log('Scene created');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera created');

const canvas = document.querySelector('#reefCanvas') as HTMLCanvasElement;
if (!canvas) {
    console.error('Could not find canvas element with id "reefCanvas"');
} else {
    console.log('Canvas found:', canvas);
}

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
console.log('Renderer created');

// Set renderer size and color
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Sky blue background

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Add tank bottom (light golden sandy floor)
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf9e4b3, // Lighter, more golden sand color
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0.1,
    emissive: 0x333311, // Slight golden tint
    emissiveIntensity: 0.1
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
floor.position.y = -1; // Position at the bottom
scene.add(floor);

// Add coral
console.log('Adding coral...');
addCoral(scene);
console.log('Coral added to scene');

// Add initial fish
console.log('Adding initial fish...');
addInitialFish();
console.log('Initial fish added to scene');

// Position camera
camera.position.set(0, 2, 5);
camera.lookAt(0, 0, 0);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 2;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI / 1.5; // Prevent going below the floor

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add initial fish
function addInitialFish() {
    // Add 3 fish to start with
    for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * 4;  // X range: -2 to 2
        const z = (Math.random() - 0.5) * 4;  // Z range: -2 to 2
        const y = (Math.random() * 2) - 1;    // Y range: -1 to 1
        const position = new THREE.Vector3(x, y, z);
        
        const fish = addFish(scene, position);
        fishes.push(fish);
    }
}

// Modified addFish that prevents overlap
function addFishToTank() {
    const maxAttempts = 50;
    let fishAdded = false;
    
    for (let i = 0; i < maxAttempts && !fishAdded; i++) {
        // Try to find a non-overlapping position
        const x = (Math.random() - 0.5) * 4;  // X range: -2 to 2
        const z = (Math.random() - 0.5) * 4;  // Z range: -2 to 2
        const y = (Math.random() * 2) - 1;    // Y range: -1 to 1 (increased vertical range)
        const newPos = new THREE.Vector3(x, y, z);
        
        // Check distance from other fish
        const minDistance = 0.5; // Minimum distance between fish
        const tooClose = fishes.some(fish => fish.mesh.position.distanceTo(newPos) < minDistance);
        
        if (!tooClose) {
            // Add fish at this position
            const fish = addFish(scene, newPos);
            fishes.push(fish);
            fishAdded = true;
        }
    }
    
    if (!fishAdded) {
        console.warn('Could not find a good position for the fish');
    }
}

// Animation loop
function animate(time: number) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth animation
    const deltaTime = Math.min(0.1, (time - lastTime) / 1000); // Cap delta time to prevent large jumps
    lastTime = time;
    
    // Update all fish
    fishes.forEach(fish => fish.update(deltaTime));
    
    // Update controls and render
    controls.update();
    renderer.render(scene, camera);
}

// Initialize lastTime for the first frame
let lastTime = 0;

// Start the animation loop
requestAnimationFrame((time) => {
    lastTime = time;
    animate(time);
});

// Add event listener for Add Fish button
const addFishBtn = document.getElementById('addFishBtn');
if (addFishBtn) {
    addFishBtn.addEventListener('click', () => {
        addFishToTank();
    });
} else {
    console.error('Could not find Add Fish button');
}

// Add version display
const versionElement = document.createElement('div');
versionElement.style.position = 'absolute';
versionElement.style.top = '10px';
versionElement.style.right = '10px';
versionElement.style.color = 'white';
versionElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
versionElement.style.padding = '5px 10px';
versionElement.style.borderRadius = '5px';
versionElement.style.fontFamily = 'Arial, sans-serif';
versionElement.style.fontSize = '12px';
versionElement.style.zIndex = '1000';
versionElement.textContent = VERSION_DISPLAY;
document.body.appendChild(versionElement);

// Add fish button functionality
document.getElementById('addFishBtn')?.addEventListener('click', () => {
    addFishToTank();
});
