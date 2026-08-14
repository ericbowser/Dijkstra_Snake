import * as THREE from 'three';
import { PASTEL } from '../palette.js';

/**
 * Bright yellow pellet — MeshBasicMaterial + fog disabled so color stays
 * solid from every angle (crystal/transmission used to wash out at edges).
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
    const group = new THREE.Group();
    group.renderOrder = 2;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 20),
      // BasicMaterial ignores lights/fog wash — stays bright yellow from every angle
      new THREE.MeshBasicMaterial({
        color: PASTEL.food,
        fog: false,
        depthWrite: true
      })
    );
    sphere.castShadow = true;
    sphere.renderOrder = 2;
    group.add(sphere);

    return group;
  }

  /** Place on a specific cell when free; otherwise random free cell. */
  placeAt(pos, occupied = []) {
    const occSet = new Set(occupied.map((p) => `${p.x},${p.z}`));
    const inBounds =
      pos.x >= 0 && pos.x < this.gridSize && pos.z >= 0 && pos.z < this.gridSize;
    if (inBounds && !occSet.has(`${pos.x},${pos.z}`)) {
      this._setPosition(pos);
      return;
    }
    this.respawn(occupied);
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

    this._setPosition(pos);
  }

  _setPosition(pos) {
    this.position = pos;
    this.mesh.position.set(
      pos.x * this.cellSize,
      this.cellSize * 0.42,
      pos.z * this.cellSize
    );
  }

  update(elapsedSeconds) {
    const pulse = 1 + Math.sin(elapsedSeconds * 2.1) * 0.06;
    this.mesh.scale.setScalar(pulse);
  }
}
