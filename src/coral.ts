import * as THREE from "three";

export function addCoral(scene: THREE.Scene) {
  const coralGeo = new THREE.ConeGeometry(0.2, 0.5, 6);
  const coralMat = new THREE.MeshStandardMaterial({ color: 0xff00aa });
  const coral = new THREE.Mesh(coralGeo, coralMat);

  coral.position.set(0, -0.75, 0);
  scene.add(coral);
}
