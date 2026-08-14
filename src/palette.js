/**
 * Shared scene colors + quartz physical-material recipe. Board, lights,
 * snake, and food read from here so the look can't drift file-to-file.
 */
import * as THREE from 'three';

/** MeshPhysicalMaterial defaults for milky quartz / crystal. */
export const QUARTZ = {
  color: 0xffffff,
  transmission: 0.9,
  opacity: 1.0,
  transparent: true,
  roughness: 0.15,
  ior: 1.54,
  thickness: 1.2,
  envMapIntensity: 1.5,
  depthWrite: false
};

export function createQuartzMaterial(overrides = {}) {
  return new THREE.MeshPhysicalMaterial({ ...QUARTZ, ...overrides });
}

export const PASTEL = {
  background: 0xeef5fc,
  fog: 0xeef5fc,
  boardA: 0xc62828,
  boardB: 0x0a0a0a,
  boardRim: 0x1a0505,
  sky: 0xf4f9ff,
  ground: 0xd4e2f0,
  snakeHead: 0x3d9b8f,
  snakeTail: 0xb8e8de,
  snakeEye: 0x1a2430,
  food: 0xffff00
};
