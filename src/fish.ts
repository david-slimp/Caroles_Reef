// src/fish.ts
import * as THREE from "three";

/** Keep a tiny school registry so the scene can update all fish each frame. */
export interface SwimFish {
  group: THREE.Group;
  update(dt: number): void;
}
const SCHOOL: SwimFish[] = [];

/** Tank bounds (meters) - matches the sand base dimensions exactly */
const BOUNDS = {
  minX: -3, maxX: 3,     // Matches floor X bounds (-3 to 3)
  minY: -1, maxY: 2,     // Keep some height for swimming
  minZ: -3, maxZ: 3      // Matches floor Z bounds (-3 to 3)
};

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function angleDiff(a: number, b: number) { return Math.atan2(Math.sin(b - a), Math.cos(b - a)); }
function lerpAngleShortest(a: number, b: number, t: number) { return a + angleDiff(a, b) * t; }

/** Build a simple clownfish with +X forward, +Y up, +Z right. */
function buildClownfish(): THREE.Group {
  const fish = new THREE.Group();

  // Materials
  const orange = new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.6, metalness: 0.0 });
  const white  = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const black  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

  // Body: ellipsoid (X length, Y height, Z thickness)
  const bodyGeo = new THREE.SphereGeometry(0.12, 20, 20);
  const body = new THREE.Mesh(bodyGeo, orange);
  body.scale.set(1.8, 1.2, 0.55);
  fish.add(body);

  // White bands wrapping the body (axis along X)
  const bandGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.022, 24, 1, true);
  bandGeo.rotateZ(Math.PI / 2);
  const band1 = new THREE.Mesh(bandGeo, white);
  const band2 = band1.clone();
  band1.scale.set(1.75, 1, 0.54);
  band2.scale.copy(band1.scale);
  band1.position.x = -0.02; // near head
  band2.position.x =  0.10; // mid body
  fish.add(band1, band2);

  // --- Tail fin: solid (extruded) fin in the YZ plane at the REAR (-X) ---
  // Build a 2D fin profile in the XY plane, then extrude (depth) and rotate so depth aligns with +X.
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0.00,  0.00);
  tailShape.quadraticCurveTo(0.08, 0.12, 0.00, 0.24);
  tailShape.lineTo(-0.02, 0.24);
  tailShape.lineTo(-0.02, 0.00);

  // Extrude settings: give the tail some thickness so it isn't razor thin.
  const tailDepth = 0.06; // ~6 cm thickness, similar to body thickness
  const tailExtrude = new THREE.ExtrudeGeometry(tailShape, {
    depth: tailDepth,
    bevelEnabled: false,
    curveSegments: 16,
    steps: 1,
  });

  // Center the extruded depth so the hinge axis runs through the middle
  tailExtrude.translate(0, 0, -tailDepth * 0.5);

  // Tail hinge: sits at the back of the body, local axis Y for swish.
  const tailHinge = new THREE.Group();
  tailHinge.name = "tailHinge";
  tailHinge.position.set(-0.16, 0, 0); // back of fish (remember +X is forward)

  // Tail mesh: rotate so the fin's plane is the YZ plane (depth now runs along +X)
  const tail = new THREE.Mesh(tailExtrude, orange);
  tail.name = "tail";
  tail.rotation.y = Math.PI / 2; // put the fin into the YZ plane
  tail.castShadow = false;
  tail.receiveShadow = false;

  // Optional thin black rim: slightly scale Y/Z (not X) to avoid z‑fighting
  const tailRim = new THREE.Mesh(tailExtrude.clone(), black);
  tailRim.name = "tailRim";
  tailRim.rotation.copy(tail.rotation);
  tailRim.scale.set(1.03, 1.03, 1.0); // puff the silhouette a hair in Y/Z

  tailHinge.add(tailRim, tail);
  fish.add(tailHinge);

  // Eyes on BOTH sides (±Z), slightly forward (+X) and above (+Y)
  const eyeGeo = new THREE.SphereGeometry(0.025, 16, 16);
  const eyeMat = black;
  const eyeX =  0.06;
  const eyeY =  0.02;
  const eyeZ =  0.07;

  const eyeRight = new THREE.Mesh(eyeGeo, eyeMat); // +Z
  eyeRight.position.set(eyeX, eyeY, +eyeZ);
  eyeRight.name = "eyeRight";

  const eyeLeft  = new THREE.Mesh(eyeGeo, eyeMat); // -Z
  eyeLeft.position.set(eyeX, eyeY, -eyeZ);
  eyeLeft.name = "eyeLeft";

  fish.add(eyeRight, eyeLeft);

  return fish;
}

/** Create a swimmer with a HOME anchor so it patrols around its spawn point. */
function createSwimmer(homeOverride?: THREE.Vector3): SwimFish {
  const group = buildClownfish();

  // Initial transform
  if (homeOverride) {
    group.position.copy(homeOverride);
  } else {
    group.position.set(
      rand(BOUNDS.minX * 0.7, BOUNDS.maxX * 0.7),
      rand(BOUNDS.minY * 0.7, BOUNDS.maxY * 0.6),
      rand(BOUNDS.minZ * 0.7, BOUNDS.maxZ * 0.7)
    );
  }
  group.rotation.y = rand(-Math.PI, Math.PI); // heading (yaw)
  group.rotation.x = rand(-0.06, 0.06);       // small pitch

  // --- HOME TETHER ---
  const home = group.position.clone(); // anchor
  const HOME_RADIUS = 0.9;             // comfortable patrol radius
  const LEASH_RADIUS = 1.6;            // must-come-back radius
  const HOME_PULL_SOFT = 0.15;         // blend factor toward home when outside HOME_RADIUS
  const HOME_PULL_HARD = 0.35;         // stronger pull when beyond LEASH_RADIUS

  // Swim parameters
  let speed = rand(0.22, 0.38);           // m/s
  const minSpeed = 0.18, maxSpeed = 0.55;
  const maxYawRate   = THREE.MathUtils.degToRad(55);
  const maxPitchRate = THREE.MathUtils.degToRad(25);
  let wanderTimer = 0;
  let targetYaw = group.rotation.y;
  let targetPitch = group.rotation.x;

  // Smoothed rotations
  let currentYaw = group.rotation.y;
  let currentPitch = group.rotation.x;
  let currentRoll = 0;

  // Tail anim
  const tail = group.getObjectByName("tail") as THREE.Mesh | null;
  const tailHinge = group.getObjectByName("tailHinge") as THREE.Group | null;
  let swimTime = 0;

  const tmpDir = new THREE.Vector3(); // forward vector in world space

  function steerToward(yawGoal: number, pitchGoal: number, dt: number) {
    const dy = angleDiff(currentYaw, yawGoal);
    const dp = pitchGoal - currentPitch;

    currentYaw += THREE.MathUtils.clamp(dy, -maxYawRate * dt,   maxYawRate * dt);
    currentPitch += THREE.MathUtils.clamp(dp, -maxPitchRate * dt, maxPitchRate * dt);
    currentPitch = clamp(currentPitch, -0.35, 0.35);

    // roll into turns
    const targetRoll = -dy * 0.18;
    currentRoll = THREE.MathUtils.lerp(currentRoll, targetRoll, 0.12);

    group.rotation.set(currentPitch, currentYaw, currentRoll, "YXZ");
  }

  function pickWanderTargetAroundHome() {
    // Calculate max radius that keeps us within bounds
    const maxRadiusX = Math.min(
      HOME_RADIUS,
      BOUNDS.maxX - home.x,
      home.x - BOUNDS.minX
    );
    const maxRadiusZ = Math.min(
      HOME_RADIUS,
      BOUNDS.maxZ - home.z,
      home.z - BOUNDS.minZ
    );
    const maxRadius = Math.min(maxRadiusX, maxRadiusZ, HOME_RADIUS) * 0.8; // 80% of max to keep some margin
    
    // Pick a point within the safe radius
    const r = rand(0.3, maxRadius); // Use at least 30% of max radius
    const az = rand(-Math.PI, Math.PI);
    const yOff = rand(-0.25, 0.25); // modest vertical variation

    // Calculate target position, ensuring it stays within bounds
    let targetX = home.x + Math.cos(az) * r;
    let targetZ = home.z + Math.sin(az) * r;
    
    // Ensure we don't get too close to walls
    targetX = THREE.MathUtils.clamp(targetX, BOUNDS.minX + 0.5, BOUNDS.maxX - 0.5);
    targetZ = THREE.MathUtils.clamp(targetZ, BOUNDS.minZ + 0.5, BOUNDS.maxZ - 0.5);
    
    const target = new THREE.Vector3(
      targetX,
      clamp(home.y + yOff, BOUNDS.minY + 0.1, BOUNDS.maxY - 0.1),
      targetZ
    );

    // Aim at that point
    const dir = target.clone().sub(group.position);
    const yaw = Math.atan2(dir.z, dir.x);
    const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));

    // Blend toward this new local target
    targetYaw = lerpAngleShortest(targetYaw, yaw, 0.35); // Slower turn rate for more natural movement
    targetPitch = clamp(THREE.MathUtils.lerp(targetPitch, pitch, 0.35), -0.25, 0.25);
  }

  function homeTether(dt: number) {
    const d = group.position.distanceTo(home);
    
    // Calculate how close we are to boundaries
    const nearBoundaryX = group.position.x <= BOUNDS.minX + 0.5 || group.position.x >= BOUNDS.maxX - 0.5;
    const nearBoundaryZ = group.position.z <= BOUNDS.minZ + 0.5 || group.position.z >= BOUNDS.maxZ - 0.5;
    const nearBoundary = nearBoundaryX || nearBoundaryZ;
    
    // Only apply home tether if we're not near a boundary
    if (!nearBoundary) {
      if (d > LEASH_RADIUS) {
        // hard pull back to home
        const dir = home.clone().sub(group.position).normalize();
        const yawHome = Math.atan2(dir.z, dir.x);
        const pitchHome = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
        targetYaw = lerpAngleShortest(targetYaw, yawHome, HOME_PULL_HARD * 0.5); // Reduced pull strength
        targetPitch = THREE.MathUtils.lerp(targetPitch, pitchHome, HOME_PULL_HARD * 0.5);
        speed = THREE.MathUtils.lerp(speed, maxSpeed * 0.7, 0.1); // Reduced speed boost
      } else if (d > HOME_RADIUS) {
        // soft pull back - only apply if not already turning from boundary
        const dir = home.clone().sub(group.position).normalize();
        const yawHome = Math.atan2(dir.z, dir.x);
        const pitchHome = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
        targetYaw = lerpAngleShortest(targetYaw, yawHome, HOME_PULL_SOFT * 0.3); // Much softer pull
        targetPitch = THREE.MathUtils.lerp(targetPitch, pitchHome, HOME_PULL_SOFT * 0.3);
        speed = THREE.MathUtils.lerp(speed, (minSpeed + maxSpeed) * 0.5, 0.05);
      }
    }
    
    // Always maintain a minimum speed to prevent getting stuck
    if (speed < minSpeed * 0.8) {
      speed = minSpeed * 0.8;
    }
  }

  // Track how long we've been near a boundary
  let boundaryTimer = 0;
  const MAX_BOUNDARY_TIME = 1.0; // seconds
  let escapeDirection = new THREE.Vector3();
  
  function keepInsideBounds(dt: number) {
    // First, clamp position to stay within bounds
    const wasClampedX = group.position.x <= BOUNDS.minX || group.position.x >= BOUNDS.maxX;
    const wasClampedZ = group.position.z <= BOUNDS.minZ || group.position.z >= BOUNDS.maxZ;
    
    // Apply a small push away from boundaries
    const boundaryPush = 0.1;
    if (group.position.x <= BOUNDS.minX + 0.1) group.position.x = BOUNDS.minX + 0.1;
    if (group.position.x >= BOUNDS.maxX - 0.1) group.position.x = BOUNDS.maxX - 0.1;
    if (group.position.z <= BOUNDS.minZ + 0.1) group.position.z = BOUNDS.minZ + 0.1;
    if (group.position.z >= BOUNDS.maxZ - 0.1) group.position.z = BOUNDS.maxZ - 0.1;
    
    // Check if we're near any boundary
    const margin = 0.75; // Increased margin for earlier detection
    const nearLeft = group.position.x <= BOUNDS.minX + margin;
    const nearRight = group.position.x >= BOUNDS.maxX - margin;
    const nearFront = group.position.z <= BOUNDS.minZ + margin;
    const nearBack = group.position.z >= BOUNDS.maxZ - margin;
    const nearBoundary = nearLeft || nearRight || nearFront || nearBack;
    
    if (nearBoundary) {
      boundaryTimer += dt;
      
      // If we've been near a boundary too long, pick a new escape direction
      if (boundaryTimer > MAX_BOUNDARY_TIME * 0.5) {
        // Calculate escape direction based on which boundaries we're near
        escapeDirection.set(0, 0, 0);
        
        if (nearLeft) escapeDirection.x += 1;
        if (nearRight) escapeDirection.x -= 1;
        if (nearFront) escapeDirection.z += 1;
        if (nearBack) escapeDirection.z -= 1;
        
        // If in a corner, add some randomness to escape
        const inCorner = (nearLeft || nearRight) && (nearFront || nearBack);
        if (inCorner) {
          escapeDirection.x += (Math.random() - 0.5) * 2;
          escapeDirection.z += (Math.random() - 0.5) * 2;
        }
        
        escapeDirection.normalize();
        
        // Calculate target yaw based on escape direction
        targetYaw = Math.atan2(escapeDirection.z, escapeDirection.x);
        targetPitch = (Math.random() - 0.5) * 0.2; // Slight vertical movement
        
        // If we've been stuck too long, try a more aggressive escape
        if (boundaryTimer > MAX_BOUNDARY_TIME * 2) {
          // Pick a completely random direction
          targetYaw = Math.random() * Math.PI * 2;
          targetPitch = (Math.random() - 0.5) * 0.5;
          boundaryTimer = 0; // Reset timer to prevent rapid direction changes
        }
      }
      
      // Apply boundary push force
      const pushForce = 0.05;
      if (nearLeft) group.position.x += pushForce;
      if (nearRight) group.position.x -= pushForce;
      if (nearFront) group.position.z += pushForce;
      if (nearBack) group.position.z -= pushForce;
    } else {
      // Reset the timer and escape direction when not near a boundary
      boundaryTimer = 0;
      escapeDirection.set(0, 0, 0);
    }
  }

  function update(dt: number) {
    const deltaTime = Math.min(dt, 0.05); // avoid big jumps
    swimTime += deltaTime;

    // Periodically choose a new wander direction around HOME
    wanderTimer -= deltaTime;
    if (wanderTimer <= 0) {
      wanderTimer = rand(0.7, 1.5);
      pickWanderTargetAroundHome();
    }

    // Apply home tether + bounds bias
    homeTether(deltaTime);
    keepInsideBounds();

    // Steer and move forward along local +X
    steerToward(targetYaw, targetPitch, deltaTime);

    const forward = tmpDir.set(1, 0, 0).applyEuler(group.rotation).normalize();
    group.position.addScaledVector(forward, speed * deltaTime);

    // Vertical clamp (soft)
    group.position.y = clamp(group.position.y, BOUNDS.minY, BOUNDS.maxY);

    // Tail wag (swish by rotating the HINGE around local Y)
    if (tailHinge) {
      tailHinge.rotation.y = Math.sin(swimTime * (3.5 + speed * 4.0)) * 0.25;
    }
  }

  return { group, update };
}

/** Public API: add a new fish to the scene and register it for updates.
 *  Optionally provide a home position so the fish patrols that area.
 */
export function addFish(scene: THREE.Scene, homePos?: THREE.Vector3): SwimFish {
  const f = createSwimmer(homePos);
  scene.add(f.group);
  SCHOOL.push(f);
  return f;
}

/** Call once per frame from your animate loop. dt = seconds since last frame. */
export function updateFishes(dt: number) {
  for (const f of SCHOOL) f.update(dt);
}
