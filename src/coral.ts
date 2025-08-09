import * as THREE from "three";

export function addCoral(scene: THREE.Scene): THREE.Mesh {
  // Create coral with a cone shape and pink color
  const coralGeo = new THREE.ConeGeometry(0.5, 1.5, 8); // Larger coral
  const coralMat = new THREE.MeshStandardMaterial({ 
    color: 0xff69b4, // Pink color
    roughness: 0.7,
    metalness: 0.1,
    flatShading: true // Add some faceting for better visibility
  });
  
  const coral = new THREE.Mesh(coralGeo, coralMat);
  // Position above the floor but still within tank bounds
  coral.position.set(1, -0.5, 1); // Move from center for better visibility
  coral.rotation.y = Math.PI / 4; // Rotate for better viewing angle
  coral.castShadow = true;
  coral.receiveShadow = true;
  
  // Add a subtle emissive effect to make it stand out
  coralMat.emissive.set(0x330022);
  coralMat.emissiveIntensity = 0.1;
  
  scene.add(coral);
  return coral;
}
