import * as THREE from 'three';
import { PASTEL } from '../palette.js';

/**
 * Checkerboard table with a glass underside. From above it reads as a
 * solid floor; when the camera ducks under (Z-tilt), the surface
 * turns transmissive so the snake and food show through like a pane.
 * Surface sits at ~50% opacity from every angle.
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

    this._glassBlend = 0;
    this._wantGlass = false;
    this.mesh = this._buildMesh();
  }

  setCameraHeight(y) {
    this._wantGlass = y < this.center.y - 0.45;
  }

  update() {
    const target = this._wantGlass ? 1 : 0;
    this._glassBlend = THREE.MathUtils.lerp(this._glassBlend, target, 0.1);
    const t = this._glassBlend;

    this._surfaceMat.transmission = 0.08 + t * 0.65;
    this._surfaceMat.thickness = 0.2 + t * 0.55;
    this._surfaceMat.roughness = THREE.MathUtils.lerp(0.55, 0.1, t);
    this._surfaceMat.metalness = 0;
    this._surfaceMat.ior = THREE.MathUtils.lerp(1.4, 1.54, t);
    this._surfaceMat.envMapIntensity = THREE.MathUtils.lerp(0.2, 1.1, t);
    this._surfaceMat.opacity = THREE.MathUtils.lerp(0.88, 0.55, t);
    this._surfaceMat.transparent = true;
    this._surfaceMat.needsUpdate = true;
  }

  _buildMesh() {
    const group = new THREE.Group();
    const checker = this._checkerTexture(this.gridSize);

    const rimMat = new THREE.MeshStandardMaterial({
      color: PASTEL.boardRim,
      roughness: 0.72,
      metalness: 0.08,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const rim = new THREE.Mesh(
      new THREE.PlaneGeometry(this.boardSize + 1.2, this.boardSize + 1.2),
      rimMat
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.copy(this.center);
    rim.position.y = -0.04;
    rim.receiveShadow = true;
    group.add(rim);

    this._surfaceMat = new THREE.MeshPhysicalMaterial({
      map: checker,
      color: 0xffffff,
      roughness: 0.55,
      metalness: 0.0,
      transmission: 0.08,
      thickness: 0.2,
      ior: 1.4,
      attenuationColor: new THREE.Color(PASTEL.boardA),
      attenuationDistance: 2.5,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      envMapIntensity: 0.2
    });
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(this.boardSize, this.boardSize),
      this._surfaceMat
    );
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
