import * as THREE from 'three';

/**
 * Builds the scene's lighting rig. Pure factory — returns objects,
 * doesn't know about the scene it'll be added to.
 */
export function createLighting({ target }) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);

  const directional = new THREE.DirectionalLight(0xffffff, 1.0);
  directional.position.set(target.x + 10, 20, target.z + 10);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);

  return [ambient, directional];
}
