import * as THREE from 'three';
import { PASTEL } from '../palette.js';

/**
 * The game board: a pastel checkerboard plane (cell-sized squares so
 * the floor reads in perspective) plus a slightly larger rim that
 * silhouettes the edge. Exposes its own center so callers (camera,
 * lighting) don't need to know the board's internal math.
 */
export class Board {
  constructor({ gridSize, cellSize }) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.boardSize = gridSize * cellSize;
    this.center = new THREE.Vector3(
      this.boardSize / 2 - this.cellSize / 2,
      0,
      this.boardSize / 2 - this.cellSize / 2
    );

    this.mesh = this._buildMesh();
  }

  _buildMesh() {
    const group = new THREE.Group();

    const rimGeo = new THREE.PlaneGeometry(this.boardSize + 1.2, this.boardSize + 1.2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: PASTEL.boardRim,
      roughness: 1,
      metalness: 0.0
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.copy(this.center);
    rim.position.y = -0.03;
    rim.receiveShadow = true;
    group.add(rim);

    const planeGeo = new THREE.PlaneGeometry(this.boardSize, this.boardSize);
    const planeMat = new THREE.MeshStandardMaterial({
      map: this._checkerTexture(this.gridSize),
      roughness: 1,
      metalness: 0.0
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.copy(this.center);
    plane.receiveShadow = true;
    group.add(plane);

    return group;
  }

  _checkerTexture(size) {
    const data = new Uint8Array(size * size * 4);
    const a = new THREE.Color(PASTEL.boardA);
    const b = new THREE.Color(PASTEL.boardB);

    for (let z = 0; z < size; z += 1) {
      for (let x = 0; x < size; x += 1) {
        const c = (x + z) % 2 === 0 ? a : b;
        const i = (z * size + x) * 4;
        data[i] = Math.round(c.r * 255);
        data[i + 1] = Math.round(c.g * 255);
        data[i + 2] = Math.round(c.b * 255);
        data[i + 3] = 255;
      }
    }

    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
}
