import { addFish, type SwimFish } from '../src/fish';
import * as THREE from 'three';

describe('Fish', () => {
  let scene: THREE.Scene;
  let testPosition: THREE.Vector3;
  let fish: SwimFish;

  beforeEach(() => {
    // Create a new scene and test position for each test
    scene = new THREE.Scene();
    testPosition = new THREE.Vector3(0, 0, 0);
    fish = addFish(scene);
    fish.group.position.copy(testPosition);
  });

  it('should add a fish to the scene', () => {
    // Check that fish was added to the scene
    expect(fish).toHaveProperty('group');
    expect(fish).toHaveProperty('update');
    expect(scene.children).toContain(fish.group);
    
    // Check fish group properties
    expect(fish.group).toBeInstanceOf(THREE.Group);
    expect(fish.group.children.length).toBeGreaterThan(0);
  });

  it('should have correct components', () => {
    // Get named components
    const tail = fish.group.getObjectByName('tail');
    const tailRim = fish.group.getObjectByName('tailRim');
    const eyeLeft = fish.group.getObjectByName('eyeLeft');
    const eyeRight = fish.group.getObjectByName('eyeRight');
    
    // Check that all components exist
    expect(tail).toBeDefined();
    expect(tailRim).toBeDefined();
    expect(eyeLeft).toBeDefined();
    expect(eyeRight).toBeDefined();
    
    // Check that eyes are sphere geometries
    expect(eyeLeft).toBeInstanceOf(THREE.Mesh);
    expect(eyeRight).toBeInstanceOf(THREE.Mesh);
    expect((eyeLeft as THREE.Mesh).geometry).toBeInstanceOf(THREE.SphereGeometry);
    expect((eyeRight as THREE.Mesh).geometry).toBeInstanceOf(THREE.SphereGeometry);
    
    // Check that tail is a shape geometry
    expect(tail).toBeInstanceOf(THREE.Mesh);
    expect((tail as THREE.Mesh).geometry.type).toBe('ShapeGeometry');
    
    // Verify the body is present (should be the first child)
    const body = fish.group.children[0];
    expect(body).toBeInstanceOf(THREE.Mesh);
    expect((body as THREE.Mesh).geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  it('should initialize with correct position', () => {
    const testPos = new THREE.Vector3(1, 2, 3);
    fish.group.position.copy(testPos);
    
    expect(fish.group.position.x).toBeCloseTo(testPos.x);
    expect(fish.group.position.y).toBeCloseTo(testPos.y);
    expect(fish.group.position.z).toBeCloseTo(testPos.z);
  });

  it('should update position when update is called', () => {
    const initialPos = fish.group.position.clone();
    const initialRotation = fish.group.rotation.clone();
    const deltaTime = 0.1; // 100ms
    
    // Update the fish
    fish.update(deltaTime);
    
    // The position should have changed
    expect(fish.group.position).not.toEqual(initialPos);
    
    // The rotation might change due to the fish's movement
    expect(fish.group.rotation).not.toEqual(initialRotation);
  });
  
  it('should have eyes on opposite sides of the head', () => {
    const eyeLeft = fish.group.getObjectByName('eyeLeft');
    const eyeRight = fish.group.getObjectByName('eyeRight');
    
    // Eyes should be at the same height and forward position, but opposite sides
    expect(eyeLeft?.position.x).toBeCloseTo(0.06);
    expect(eyeRight?.position.x).toBeCloseTo(0.06);
    expect(eyeLeft?.position.y).toBeCloseTo(0.02);
    expect(eyeRight?.position.y).toBeCloseTo(0.02);
    expect(eyeLeft?.position.z).toBeCloseTo(-0.07);
    expect(eyeRight?.position.z).toBeCloseTo(0.07);
  });
  
  it('should have tail at the back of the fish', () => {
    const tail = fish.group.getObjectByName('tail');
    expect(tail?.position.x).toBeCloseTo(-0.16); // Tail is at negative X (back of fish)
    expect(tail?.position.y).toBeCloseTo(0);
    expect(tail?.position.z).toBeCloseTo(0);
  });
});
