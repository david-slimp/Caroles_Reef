import { addFish, type SwimFish } from '../src/fish';
import * as THREE from 'three';

describe('Fish Movement', () => {
  let scene: THREE.Scene;
  let fish: SwimFish;
  const TANK_BOUNDS = {
    minX: -2.5, maxX: 2.5,
    minY: -1, maxY: 2,
    minZ: -2.5, maxZ: 2.5
  };
  const TEST_DELTA = 1/60; // Approx 60fps

  beforeEach(() => {
    scene = new THREE.Scene();
    fish = addFish(scene);
    // Start fish in the center of the tank
    fish.group.position.set(0, 0, 0);
  });

  function simulateMovement(steps: number): void {
    for (let i = 0; i < steps; i++) {
      fish.update(TEST_DELTA);
    }
  }

  it('should not try to reassign constant variables', () => {
    // This test will fail if there are any const reassignment errors
    expect(() => {
      // Move fish to boundary to trigger nudgeFromBounds
      fish.group.position.set(TANK_BOUNDS.maxX * 0.9, 0, 0);
      simulateMovement(10);
    }).not.toThrow();
  });

  it('should stay within tank boundaries', () => {
    // Move fish close to boundary
    fish.group.position.set(TANK_BOUNDS.maxX * 0.8, 0, 0);
    
    // Simulate movement for 2 seconds to ensure boundary detection triggers
    simulateMovement(120);
    
    // Fish should not have moved beyond the tank boundary
    expect(fish.group.position.x).toBeLessThan(TANK_BOUNDS.maxX);
    
    // Fish should have changed direction (not moving directly toward wall)
    const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(fish.group.quaternion);
    expect(forward.x).toBeLessThan(0.8); // Not pointing directly at wall
  });

  it('should change direction over time', () => {
    const initialForward = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(fish.group.quaternion);
    
    // Simulate movement for 3 seconds to ensure direction change
    simulateMovement(180);
    
    const newForward = new THREE.Vector3(1, 0, 0)
      .applyQuaternion(fish.group.quaternion);
    
    // Direction should have changed (dot product < 0.95 allows for slight variations)
    const directionChange = initialForward.dot(newForward);
    expect(directionChange).toBeLessThan(0.95);
    
    // Make sure we're not comparing with opposite direction
    expect(directionChange).toBeGreaterThan(-0.8);
  });

  it('should maintain reasonable speed', () => {
    const initialPos = fish.group.position.clone();
    
    // Simulate movement for 1 second
    simulateMovement(60);
    
    const distanceMoved = fish.group.position.distanceTo(initialPos);
    const speed = distanceMoved / 1.0; // meters per second
    
    // Speed should be within reasonable bounds (adjust these values based on your min/max speed)
    expect(speed).toBeGreaterThan(0.1);
    expect(speed).toBeLessThan(1.0);
  });

  it('should handle boundary conditions without errors', () => {
    // Test all boundaries
    const testPositions = [
      new THREE.Vector3(TANK_BOUNDS.maxX * 0.9, 0, 0),  // Right wall
      new THREE.Vector3(TANK_BOUNDS.minX * 0.9, 0, 0),  // Left wall
      new THREE.Vector3(0, TANK_BOUNDS.maxY * 0.9, 0),  // Top
      new THREE.Vector3(0, TANK_BOUNDS.minY * 0.9, 0),  // Bottom
      new THREE.Vector3(0, 0, TANK_BOUNDS.maxZ * 0.9),  // Front
      new THREE.Vector3(0, 0, TANK_BOUNDS.minZ * 0.9)   // Back
    ];

    testPositions.forEach(pos => {
      fish.group.position.copy(pos);
      expect(() => {
        simulateMovement(5);
      }).not.toThrow();
    });
  });

  it('should move in the direction it is facing', () => {
    // Point fish along positive X
    fish.group.rotation.set(0, 0, 0);
    const initialPos = fish.group.position.clone();
    
    // Simulate movement for a short time
    simulateMovement(10);
    
    // Fish should have moved mostly in the X direction
    const movement = new THREE.Vector3().subVectors(fish.group.position, initialPos);
    expect(movement.x).toBeGreaterThan(0);
    expect(Math.abs(movement.y)).toBeLessThan(0.1);
    expect(Math.abs(movement.z)).toBeLessThan(0.1);
  });
});
