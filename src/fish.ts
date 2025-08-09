import * as THREE from "three";

export function addFish(scene: THREE.Scene) {
  // Placeholder fish = orange box
  const fishGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
  const fishMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
  const fish = new THREE.Mesh(fishGeo, fishMat);

  // Random position in smaller tank
  fish.position.set(
    (Math.random() - 0.5) * 4,
    -0.5 + Math.random() * 1.0,
    (Math.random() - 0.5) * 4
  );

  scene.add(fish);
}
