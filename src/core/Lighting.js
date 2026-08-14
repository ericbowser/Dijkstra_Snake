import * as THREE from 'three';
import { PASTEL } from '../palette.js';

/**
 * Cool, high-key light so glass (the crystal food) can catch highlights
 * and the ice board stays readable.
 */
export function createLighting({ target }) {
  const ambient = new THREE.AmbientLight(0xf4f8ff, 0.42);

  const hemi = new THREE.HemisphereLight(PASTEL.sky, PASTEL.ground, 0.65);
  hemi.position.set(target.x, 40, target.z);

  const directional = new THREE.DirectionalLight(0xffffff, 1.15);
  directional.position.set(target.x + 12, 22, target.z + 8);
  directional.castShadow = true;
  directional.shadow.mapSize.set(1024, 1024);
  directional.shadow.camera.near = 1;
  directional.shadow.camera.far = 60;
  directional.shadow.camera.left = -20;
  directional.shadow.camera.right = 20;
  directional.shadow.camera.top = 20;
  directional.shadow.camera.bottom = -20;

  const fill = new THREE.DirectionalLight(0xc8dcff, 0.35);
  fill.position.set(target.x - 10, 12, target.z - 6);

  return [ambient, hemi, directional, fill];
}

/**
 * PMREM baked from a small light stage. MeshPhysicalMaterial
 * transmission (the crystal ball) looks like empty glass without one.
 */
export function createCrystalEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xeef5fc);
  envScene.add(new THREE.HemisphereLight(0xffffff, 0x9bb4cc, 1.3));

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(6, 12, 5);
  envScene.add(key);

  const cool = new THREE.DirectionalLight(0xb8d4ff, 0.9);
  cool.position.set(-8, 5, -4);
  envScene.add(cool);

  const warm = new THREE.DirectionalLight(0xfff4e0, 0.45);
  warm.position.set(2, 3, -9);
  envScene.add(warm);

  const tex = pmrem.fromScene(envScene, 0.03).texture;
  pmrem.dispose();
  return tex;
}
