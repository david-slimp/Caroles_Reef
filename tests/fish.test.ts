import { addFish, Fish } from '../src/fish';
import * as THREE from 'three';

describe('Fish', () => {
  let scene: THREE.Scene;
  let testPosition: THREE.Vector3;

  beforeEach(() => {
    // Create a new scene and test position for each test
    scene = new THREE.Scene();
    testPosition = new THREE.Vector3(0, 0, 0);
  });

  it('should add a fish to the scene', () => {
    const fish = addFish(scene, testPosition);
    
    // Check that fish was added to the scene
    expect(fish).toBeInstanceOf(Fish);
    expect(scene.children).toContain(fish.mesh);
    
    // Check fish properties
    expect(fish.mesh).toBeInstanceOf(THREE.Mesh);
    expect(fish.mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect((fish.mesh.material as THREE.MeshStandardMaterial).color.getHex()).toBe(0xff6600); // Orange
  });

  it('should have correct geometry', () => {
    const fish = addFish(scene, testPosition);
    expect(fish.mesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    
    // Check fish dimensions (width, height, depth)
    const box = fish.mesh.geometry as THREE.BoxGeometry;
    const parameters = box.parameters;
    expect(parameters.width).toBeCloseTo(0.3);
    expect(parameters.height).toBeCloseTo(0.15);
    expect(parameters.depth).toBeCloseTo(0.1);
  });

  it('should initialize with correct position', () => {
    const testPos = new THREE.Vector3(1, 2, 3);
    const fish = addFish(scene, testPos);
    
    expect(fish.mesh.position.x).toBeCloseTo(testPos.x);
    expect(fish.mesh.position.y).toBeCloseTo(testPos.y);
    expect(fish.mesh.position.z).toBeCloseTo(testPos.z);
  });
});
