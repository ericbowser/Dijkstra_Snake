import * as THREE from 'three';

/**
 * The game board: a flat plane sized to the grid plus a wireframe
 * overlay marking cells. Exposes its own center so callers (camera,
 * lighting) don't need to know the board's internal math.
 */
export class Board {
  constructor({ gridSize, cellSize }) {
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.boardSize = gridSize * cellSize;

    this.mesh = this._buildMesh();
    this.center = new THREE.Vector3(
      this.boardSize / 2 - this.cellSize / 2,
      0,
      this.boardSize / 2 - this.cellSize / 2
    );
  }

  _buildMesh() {
    const group = new THREE.Group();

    const planeGeo = new THREE.PlaneGeometry(this.boardSize, this.boardSize);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.9,
      metalness: 0.0
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(this.boardSize / 2 - this.cellSize / 2, 0, this.boardSize / 2 - this.cellSize / 2);
    plane.receiveShadow = true;
    group.add(plane);

    const gridHelper = new THREE.GridHelper(this.boardSize, this.gridSize, 0x3a3a3a, 0x222222);
    gridHelper.position.set(this.boardSize / 2 - this.cellSize / 2, 0.01, this.boardSize / 2 - this.cellSize / 2);
    group.add(gridHelper);

    return group;
  }
}
