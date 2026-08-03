import * as THREE from 'three';

/**
 * Owns the Three.js Scene graph. Nothing else creates or configures
 * the scene directly — consumers just call add()/remove().
 */
export class SceneManager {
  constructor({ backgroundColor = 0x0a0a0a } = {}) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);
  }

  add(...objects) {
    objects.forEach((obj) => this.scene.add(obj));
  }

  remove(...objects) {
    objects.forEach((obj) => this.scene.remove(obj));
  }
}
