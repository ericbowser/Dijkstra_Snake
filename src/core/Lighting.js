import * as THREE from 'three';
import { PASTEL } from '../palette.js';

/**
 * Builds the scene's lighting rig. Soft hemisphere fill keeps pastels
 * readable (sky vs ground tint adds depth); a warm key light still
 * casts shadows so the snake sits on the board.
 */
export function createLighting({ target }) {
  const ambient = new THREE.AmbientLight(0xffe4ec, 0.5);

  const hemi = new THREE.HemisphereLight(PASTEL.sky, PASTEL.ground, 0.75);
  hemi.position.set(target.x, 40, target.z);

  const directional = new THREE.DirectionalLight(0xfff1d6, 0.8);
  directional.position.set(target.x + 12, 22, target.z + 8);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  directional.shadow.camera.near = 1;
  directional.shadow.camera.far = 60;
  directional.shadow.camera.left = -20;
  directional.shadow.camera.right = 20;
  directional.shadow.camera.top = 20;
  directional.shadow.camera.bottom = -20;

  return [ambient, hemi, directional];
}
