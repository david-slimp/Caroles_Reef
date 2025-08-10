// src/fish.ts — Fish movement with perfect target alignment
import * as THREE from "three";

// Constants for movement
const TARGET_RADIUS = 2.0;
const EDGE_BUFFER = 0.5;
const MIN_SPEED = 0.1;
const MAX_SPEED = 0.5;
const ACCEL = 1.0;
const DRAG = 0.5;

export interface SwimFish {
  group: THREE.Group;
  update(dt: number): void;
  debug: {
    targetBall: THREE.Mesh;
    targetLine: THREE.Line;
    showDebug: boolean;
  };
}

const SCHOOL: SwimFish[] = [];

function buildClownfish(): THREE.Group {
  const fish = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.6 });
  const white  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const black  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

  const bodyGeo = new THREE.SphereGeometry(0.12, 20, 20);
  const body = new THREE.Mesh(bodyGeo, orange);
  body.scale.set(1.8, 1.2, 0.55);
  fish.add(body);

  const ringGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.022, 24, 1, true);
  ringGeo.rotateZ(Math.PI / 2);
  const band1 = new THREE.Mesh(ringGeo, white); band1.scale.set(1.75, 1, 0.54); band1.position.x = -0.02;
  const band2 = band1.clone(); band2.position.x = 0.10;
  fish.add(band1, band2);

  const tailShape = new THREE.Shape();
  tailShape.moveTo(0.00, 0.00);
  tailShape.quadraticCurveTo(0.08, 0.12, 0.00, 0.24);
  tailShape.lineTo(-0.02, 0.24);
  tailShape.lineTo(-0.02, 0.00);
  const tailDepth = 0.07;
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: tailDepth, bevelEnabled: false, steps: 1, curveSegments: 16 });
  tailGeo.translate(0, 0, -tailDepth * 0.5);
  const tailHinge = new THREE.Group(); tailHinge.name = "tailHinge"; tailHinge.position.set(-0.16, 0, 0);
  const tail = new THREE.Mesh(tailGeo, orange); tail.name = "tail"; tail.rotation.y = Math.PI / 2;
  const tailRim = new THREE.Mesh(tailGeo.clone(), black); tailRim.rotation.copy(tail.rotation); tailRim.scale.set(1.03, 1.03, 1);
  tailHinge.add(tailRim, tail);
  fish.add(tailHinge);

  const eyeGeo = new THREE.SphereGeometry(0.022, 16, 16);
  const eyeR = new THREE.Mesh(eyeGeo, black); eyeR.position.set(0.06, 0.02, +0.085);
  const eyeL = new THREE.Mesh(eyeGeo, black); eyeL.position.set(0.06, 0.02, -0.085);
  fish.add(eyeR, eyeL);

  // Yellow dot at the NOSE (local +X) for debugging "front"
  const noseMarker = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
  noseMarker.position.set(0.24, 0, 0);
  fish.add(noseMarker);
  
  // The fish model is built with its nose along +X
  // No need for additional rotation here

  return fish;
}

// ---------- helpers ----------
const tmp = new THREE.Vector3();
// Tank boundaries (aligned with scene.ts)
const TANK_BOUNDS = {
  minX: -3, maxX: 3,
  minY: -1,  maxY: 2,  // Slightly above floor to prevent getting stuck
  minZ: -3, maxZ: 3,
  radius: 2.5  // Maximum distance from center for targets
};

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function randomPointNear(center: THREE.Vector3, radius: number, out = new THREE.Vector3()) {
  // Generate a point in a cylinder (not sphere) to keep fish swimming more horizontally
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * Math.min(radius, TANK_BOUNDS.radius);
  
  // Calculate position relative to center
  const x = center.x + Math.cos(angle) * distance;
  const z = center.z + Math.sin(angle) * distance;
  
  // Keep fish within tank bounds
  out.set(
    THREE.MathUtils.clamp(x, TANK_BOUNDS.minX, TANK_BOUNDS.maxX),
    THREE.MathUtils.clamp(center.y + (Math.random() - 0.5) * 0.5, TANK_BOUNDS.minY, TANK_BOUNDS.maxY),
    THREE.MathUtils.clamp(z, TANK_BOUNDS.minZ, TANK_BOUNDS.maxZ)
  );
  
  return out;
}

function keepInBounds(position: THREE.Vector3) {
  position.x = THREE.MathUtils.clamp(position.x, TANK_BOUNDS.minX, TANK_BOUNDS.maxX);
  position.y = THREE.MathUtils.clamp(position.y, TANK_BOUNDS.minY, TANK_BOUNDS.maxY);
  position.z = THREE.MathUtils.clamp(position.z, TANK_BOUNDS.minZ, TANK_BOUNDS.maxZ);
  return position;
}

// ---------- movement: forward‑only heading + scalar speed ----------
function createSwimmer(scene: THREE.Scene, spawn?: THREE.Vector3): SwimFish {
  const group = buildClownfish();
  group.rotation.order = "YXZ"; // yaw → pitch → roll
  if (spawn) group.position.copy(spawn);

  // --- Single source of truth for heading ---
  let yaw = rand(-Math.PI, Math.PI);   // radians, our ONLY heading value
  let speed = 0.15;                    // m/s scalar speed

  // Initial random target near the fish's spawn position
  let target = randomPointNear(spawn || group.position, 1.5);
  let retargetTimer = rand(1.2, 2.2);
  let lastTargetChange = 0;

  // Tunables
  const MAX_SPEED = 0.45;
  const MIN_SPEED = 0.05;
  const ACCEL = 0.50;                 // m/s^2 baseline thrust
  const DRAG = 0.35;                  // per‑second drag on speed
  const MAX_TURN_RATE = THREE.MathUtils.degToRad(360); // yaw turn cap
  const TARGET_RADIUS = 1.0;          // local hop distance
  const EDGE_BUFFER = 1.0;            // early avoid walls
  let isTurning = false;              // state flag

  const tailHinge = group.getObjectByName("tailHinge") as THREE.Group | null;
  let t = 0;
  
  // Create debug visualization
  // Debug markers
  const debugMarkers = {
    nose: (() => {
      const geometry = new THREE.SphereGeometry(0.03, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const marker = new THREE.Mesh(geometry, material);
      scene.add(marker);
      return marker;
    })(),
    tail: (() => {
      const geometry = new THREE.SphereGeometry(0.03, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const marker = new THREE.Mesh(geometry, material);
      scene.add(marker);
      return marker;
    })()
  };

  const debug = {
    showDebug: true,
    targetBall: (() => {
      const geometry = new THREE.SphereGeometry(0.05, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.visible = false;
      scene.add(sphere);
      return sphere;
    })(),
    targetLine: (() => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      scene.add(line);
      return line;
    })(),
    noseLine: (() => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const line = new THREE.Line(geometry, material);
      line.visible = false;
      scene.add(line);
      return line;
    })()
  };

  function update(dt: number) {
    const h = Math.min(dt, 0.05);
    t += h;

      // --- Debug visuals ---
    if (debug.showDebug) {
      // Green target ball
      debug.targetBall.position.copy(target);
      debug.targetBall.visible = true;
      
      // Get the world position of the fish's center
      const centerPosition = group.position.clone();
      
      // Calculate the fish's forward direction in world space
      const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(group.quaternion);
      
      // Calculate nose and tail positions in world space
      const nosePosition = centerPosition.clone().add(forward.clone().multiplyScalar(0.24));
      const tailPosition = centerPosition.clone().sub(forward.clone().multiplyScalar(0.16));
      
      // Update debug markers
      debugMarkers.nose.position.copy(nosePosition);
      debugMarkers.tail.position.copy(tailPosition);
      
      // Calculate vectors for alignment
      const targetToNose = new THREE.Vector3().subVectors(nosePosition, target);
      const targetToTail = new THREE.Vector3().subVectors(tailPosition, target);
      
      // Draw green line from target to nose
      const targetLinePositions = new Float32Array([
        target.x, target.y, target.z,
        nosePosition.x, nosePosition.y, nosePosition.z
      ]);
      debug.targetLine.geometry.setAttribute('position', 
        new THREE.BufferAttribute(targetLinePositions, 3));
      debug.targetLine.geometry.computeBoundingSphere();
      debug.targetLine.visible = true;
      
      // Draw red line from target to tail
      const tailLinePositions = new Float32Array([
        target.x, target.y, target.z,
        tailPosition.x, tailPosition.y, tailPosition.z
      ]);
      debug.noseLine.geometry.setAttribute('position',
        new THREE.BufferAttribute(tailLinePositions, 3));
      debug.noseLine.geometry.computeBoundingSphere();
      debug.noseLine.visible = true;
    } else {
      debug.targetBall.visible = false;
      debug.targetLine.visible = false;
      debug.noseLine.visible = false;
    }
    
    // --- Retarget logic ---
    retargetTimer -= h;
    lastTargetChange += h;
    const distanceToTarget = group.position.distanceTo(target);
    const nearTarget = distanceToTarget < 0.3;
    const shouldRetarget = retargetTimer <= 0 || nearTarget || lastTargetChange > 5;

    const nearEdgeX = group.position.x > (TANK_BOUNDS.maxX - EDGE_BUFFER) || group.position.x < (TANK_BOUNDS.minX + EDGE_BUFFER);
    const nearEdgeZ = group.position.z > (TANK_BOUNDS.maxZ - EDGE_BUFFER) || group.position.z < (TANK_BOUNDS.minZ + EDGE_BUFFER);

    if (shouldRetarget || nearEdgeX || nearEdgeZ) {
      const centerBias = new THREE.Vector3(-group.position.x, 0, -group.position.z).normalize();
      const biasStrength = 0.3 + (nearEdgeX || nearEdgeZ ? 0.5 : 0);
      const forwardDir = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
      const newDirection = new THREE.Vector3()
        .addVectors(forwardDir.multiplyScalar(1 - biasStrength), centerBias.multiplyScalar(biasStrength))
        .normalize();
      target.copy(group.position).add(newDirection.multiplyScalar(TARGET_RADIUS));
      const padding = 0.5;
      target.x = THREE.MathUtils.clamp(target.x, TANK_BOUNDS.minX + padding, TANK_BOUNDS.maxX - padding);
      target.z = THREE.MathUtils.clamp(target.z, TANK_BOUNDS.minZ + padding, TANK_BOUNDS.maxZ - padding);
      target.y = THREE.MathUtils.clamp(group.position.y + (Math.random() - 0.5) * 0.5, TANK_BOUNDS.minY + 0.1, TANK_BOUNDS.maxY - 0.1);
      retargetTimer = rand(1.5, 3.0);
      lastTargetChange = 0;
      isTurning = true;
    }

      // --- Movement and Rotation ---
    const toTarget = new THREE.Vector3().subVectors(target, group.position);
    
    if (toTarget.lengthSq() > 0.01) {
      // Get current fish forward vector in world space
      const fishForward = new THREE.Vector3(1, 0, 0).applyQuaternion(group.quaternion);
      const fishRight = new THREE.Vector3(0, 1, 0).applyQuaternion(group.quaternion);
      
      // Calculate nose and tail positions in world space
      const nosePosition = group.position.clone().add(fishForward.clone().multiplyScalar(0.24));
      const tailPosition = group.position.clone().sub(fishForward.clone().multiplyScalar(0.16));
      
      // Calculate vectors from target to nose and tail
      const targetToNose = new THREE.Vector3().subVectors(nosePosition, target);
      const targetToTail = new THREE.Vector3().subVectors(tailPosition, target);
      
      // Normalize the vectors
      targetToNose.normalize();
      targetToTail.normalize();
      
      // Calculate the angle between the two vectors
      let angle = Math.atan2(
        targetToNose.x * targetToTail.z - targetToNose.z * targetToTail.x,
        targetToNose.x * targetToTail.x + targetToNose.z * targetToTail.z
      );
      
      // Check if we're pointing the wrong way (180° off)
      const dot = toTarget.normalize().dot(fishForward);
      if (dot < -0.5) { // If more than 120° off
        // Flip the angle to point the other way
        angle = (angle + Math.PI) % (Math.PI * 2);
      }
      
      // Adjust yaw based on the angle between the vectors
      yaw += angle * 0.1; // Dampen the rotation for smooth movement
      
      // Update fish rotation
      group.rotation.set(0, yaw, 0);
      
      // Move fish forward along its current heading (always forward)
      // Use the fish's forward vector to ensure consistent movement direction
      const forward = new THREE.Vector3(1, 0, 0).applyQuaternion(group.quaternion);
      group.position.x += forward.x * speed * h;
      group.position.z += forward.z * speed * h;
      
      // Simple speed control
      const distanceToTarget = toTarget.length();
      const targetSpeed = Math.min(MAX_SPEED, distanceToTarget * 0.5);
      speed = THREE.MathUtils.lerp(speed, targetSpeed, 0.1);
    }

    // --- Keep in bounds ---
    keepInBounds(group.position);

    // --- Tail wag ---
    if (tailHinge) {
      const tailSpeed = 10 * (0.5 + 0.5 * speed / MAX_SPEED);
      tailHinge.rotation.z = 0.15 * Math.sin(tailSpeed * t);
    }
  }

  return { group, update, debug };
}

export function addFish(scene: THREE.Scene, spawn?: THREE.Vector3): SwimFish {
  const f = createSwimmer(scene, spawn);
  scene.add(f.group);
  SCHOOL.push(f);
  return f;
}

export function updateFishes(dt: number) {
  for (const f of SCHOOL) f.update(dt);
}
