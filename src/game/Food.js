import * as THREE from 'three';
import { PASTEL } from '../palette.js';

const FOOD_COLOR = PASTEL.food;

/**
 * The food pickup: a small glowing sphere that gently pulses. Owns its
 * own grid position and mesh, and knows how to relocate itself to a
 * free cell — it takes the occupied cells as input rather than
 * reaching into Snake directly (DIP).
 */
export class Food {
  constructor({ cellSize, gridSize, occupied = [] }) {
    this.cellSize = cellSize;
    this.gridSize = gridSize;
    this.position = { x: 0, z: 0 };

    this.mesh = this._buildMesh();
    this.respawn(occupied);
  }

  _buildMesh() {
    const geo = new THREE.SphereGeometry(0.28, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: FOOD_COLOR,
      emissive: FOOD_COLOR,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  respawn(occupied = []) {
    const occSet = new Set(occupied.map((p) => `${p.x},${p.z}`));
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.gridSize),
        z: Math.floor(Math.random() * this.gridSize)
      };
    } while (occSet.has(`${pos.x},${pos.z}`));

    this.position = pos;
    this.mesh.position.set(
      pos.x * this.cellSize,
      this.cellSize * 0.3,
      pos.z * this.cellSize
    );
  }

  update(elapsedSeconds) {
    const pulse = 1 + Math.sin(elapsedSeconds * 4) * 0.12;
    this.mesh.scale.setScalar(pulse);
  }
}
