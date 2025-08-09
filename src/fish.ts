import * as THREE from "three";

export class Fish {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: number;
  speed: number;
  turnSpeed: number;
  targetDirection: THREE.Vector3;
  nextTurnTime: number;
  tankBounds: { min: THREE.Vector3; max: THREE.Vector3 };

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    // Create fish mesh
    const fishGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const fishMat = new THREE.MeshStandardMaterial({ 
      color: 0xff6600, // Orange color
      roughness: 0.5,
      metalness: 0.1
    });
    
    this.mesh = new THREE.Mesh(fishGeo, fishMat);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
    
    // Movement properties
    this.speed = 0.005; // Slower movement (reduced from 0.02)
    this.turnSpeed = 0.02; // Slower, smoother turns
    
    // Start with mostly horizontal movement
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02, // X
      (Math.random() - 0.5) * 0.005, // Reduced Y movement
      (Math.random() - 0.5) * 0.02  // Z
    ).normalize().multiplyScalar(this.speed);
    
    // Tank boundaries (adjust as needed)
    this.tankBounds = {
      min: new THREE.Vector3(-4, -0.8, -4), // Slightly reduced vertical bounds
      max: new THREE.Vector3(4, 0.8, 4)     // to keep fish more horizontal
    };
    
    // Set initial target direction with preference for horizontal movement
    this.targetDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,  // X: full range
      (Math.random() - 0.5) * 0.2, // Y: reduced vertical component
      (Math.random() - 0.5) * 2   // Z: full range
    ).normalize();
    
    // Set initial rotation to face movement direction
    this.mesh.lookAt(this.mesh.position.clone().add(this.velocity));
    this.nextTurnTime = 0;
  }
  
  update(deltaTime: number) {
    // Update direction occasionally
    this.nextTurnTime -= deltaTime;
    if (this.nextTurnTime <= 0) {
      this.nextTurnTime = 2 + Math.random() * 5; // 2-7 seconds until next turn (longer periods)
      
      // Calculate new target direction with preference for horizontal movement
      const randomDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,  // X: full range
        (Math.random() - 0.5) * 0.4, // Y: reduced vertical component
        (Math.random() - 0.5) * 2   // Z: full range
      ).normalize();
      
      // Smoother direction changes
      this.targetDirection.lerp(randomDirection, 0.2).normalize();
      
      // Ensure the fish mostly stays horizontal
      this.targetDirection.y *= 0.5;
      this.targetDirection.normalize();
    }
    
    // Smoothly adjust velocity toward target direction
    const targetVelocity = this.targetDirection.clone().multiplyScalar(this.speed);
    this.velocity.lerp(targetVelocity, 0.05);
    
    // Apply boundary avoidance
    this.avoidBoundaries();
    
    // Ensure vertical movement is limited
    this.velocity.y = this.velocity.y * 0.5;
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
    
    // Rotate fish to face direction of movement
    if (this.velocity.lengthSq() > 0.0001) {
      // Create a slightly smoothed forward vector for more natural turns
      const forward = this.velocity.clone().normalize();
      
      // Create a target quaternion for the fish to face its direction of movement
      const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1), // Default forward for the fish model
        forward
      );
      
      // Add a slight banking effect when turning
      const turnAmount = this.velocity.x * 0.5;
      this.mesh.rotateZ(turnAmount * deltaTime);
      
      // Smoothly interpolate to the target rotation
      this.mesh.quaternion.slerp(targetQuaternion, this.turnSpeed);
      
      // Add a subtle up/down movement for more natural swimming
      const swimBob = Math.sin(Date.now() * 0.003) * 0.0005;
      this.mesh.position.y += swimBob;
    }
  }
  
  private avoidBoundaries() {
    const margin = 0.5; // Distance from boundary to start turning
    const turnForce = 0.1;
    
    // Check each boundary and adjust direction if too close
    if (this.mesh.position.x < this.tankBounds.min.x + margin) {
      this.targetDirection.x += turnForce;
    } else if (this.mesh.position.x > this.tankBounds.max.x - margin) {
      this.targetDirection.x -= turnForce;
    }
    
    if (this.mesh.position.y < this.tankBounds.min.y + margin) {
      this.targetDirection.y += turnForce;
    } else if (this.mesh.position.y > this.tankBounds.max.y - margin) {
      this.targetDirection.y -= turnForce;
    }
    
    if (this.mesh.position.z < this.tankBounds.min.z + margin) {
      this.targetDirection.z += turnForce;
    } else if (this.mesh.position.z > this.tankBounds.max.z - margin) {
      this.targetDirection.z -= turnForce;
    }
    
    // Normalize to maintain consistent speed
    this.targetDirection.normalize();
  }
}

export function addFish(scene: THREE.Scene, position: THREE.Vector3): Fish {
  return new Fish(scene, position);
}
