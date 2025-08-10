import * as THREE from 'three';
import { initScene } from './scene';
import { addFish, updateFishes, type SwimFish } from './fish';
import { addCoral } from './coral';
import { VERSION_DISPLAY } from './config/version';

console.log('Initializing Three.js scene...');

// Initialize the scene
const sceneContext = initScene();
const { scene, camera, renderer } = sceneContext;

// Track all fish in the scene
const fishes: SwimFish[] = [];

// Store camera reference in scene for later use
(scene.userData as { camera: THREE.PerspectiveCamera }).camera = camera;

// Add coral
console.log('Adding coral...');
addCoral(scene);
console.log('Coral added to scene');

// Add initial fish
function addInitialFish() {
    for (let i = 0; i < 3; i++) {
        const x = (Math.random() - 0.5) * 4;  // X range: -2 to 2
        const z = (Math.random() - 0.5) * 4;  // Z range: -2 to 2
        const y = (Math.random() * 2) - 1;    // Y range: -1 to 1
        
        const fish = addFish(scene);
        fish.group.position.set(x, y, z);
        fishes.push(fish);
    }
}

addInitialFish();

// Add fish in front of the camera with collision detection
function addFishToTank() {
    const maxAttempts = 20; // Reduced since we're targeting a specific area
    let fishAdded = false;
    
    // Get camera position and direction
    const camera = (scene.userData as { camera: THREE.PerspectiveCamera }).camera;
    const cameraPos = camera.position.clone();
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);
    
    // Calculate spawn distance in front of camera
    const spawnDistance = 2; // Distance in front of camera to spawn
    const spawnVariance = 1.5; // How much to vary the spawn position
    
    for (let i = 0; i < maxAttempts && !fishAdded; i++) {
        // Calculate base position in front of camera
        const basePos = cameraPos.clone().add(
            cameraDir.clone().multiplyScalar(spawnDistance)
        );
        
        // Add some randomness to the spawn position
        const randomOffset = new THREE.Vector3(
            (Math.random() - 0.5) * spawnVariance, // X variation
            (Math.random() - 0.3) * spawnVariance, // Slightly less Y variation
            (Math.random() - 0.5) * spawnVariance  // Z variation
        );
        
        const newPos = basePos.add(randomOffset);
        
        // Ensure position is within tank bounds
        const tankBounds = {
            minX: -2.5, maxX: 2.5,
            minY: -0.9, maxY: 1.0,
            minZ: -2.5, maxZ: 2.5
        };
        
        newPos.x = Math.max(tankBounds.minX, Math.min(tankBounds.maxX, newPos.x));
        newPos.y = Math.max(tankBounds.minY, Math.min(tankBounds.maxY, newPos.y));
        newPos.z = Math.max(tankBounds.minZ, Math.min(tankBounds.maxZ, newPos.z));
        
        // Check distance from other fish
        const minDistance = 0.5; // Minimum distance between fish
        const tooClose = fishes.some(fish => {
            const fishPos = fish.group.position;
            return fishPos.distanceTo(newPos) < minDistance;
        });
        
        if (!tooClose) {
            // Add fish at this position
            const fish = addFish(scene);
            fish.group.position.copy(newPos);
            fishes.push(fish);
            fishAdded = true;
        }
    }
    
    if (!fishAdded) {
        console.warn('Could not find a good position for the fish near the camera');
    }
}

// Animation loop
function animationLoop(time: number) {
    requestAnimationFrame(animationLoop);
    
    // Calculate delta time for smooth animation
    const delta = Math.min(0.1, (time - lastTime) / 1000); // Cap delta time to prevent large jumps
    lastTime = time;
    
    // Update all fish using the centralized update function
    updateFishes(delta);
    
    // Update controls and render
    sceneContext.controls?.update();
    renderer.render(scene, camera);
}

// Initialize lastTime for the first frame
let lastTime = 0;

// Start the animation loop
requestAnimationFrame((time) => {
    lastTime = time;
    animationLoop(time);
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
