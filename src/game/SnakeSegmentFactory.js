import * as THREE from 'three';

const HEAD_COLOR = 0xffb347;   // warm amber
const TAIL_COLOR = 0x0f6e56;   // deep teal
const EYE_COLOR = 0x141414;

function lerpColor(colorA, colorB, t) {
  const a = new THREE.Color(colorA);
  const b = new THREE.Color(colorB);
  return a.clone().lerp(b, t);
}

/**
 * Builds the visual mesh for each kind of snake segment. Pure factory —
 * knows nothing about snake state or grid positions, only how to build
 * a mesh for a given role. New segment styles (e.g. a "boosted" body
 * variant) can be added here without touching Snake.js (OCP).
 */
export class SnakeSegmentFactory {
  constructor({ segmentSize = 0.8, segmentHeight = 0.6 } = {}) {
    this.segmentSize = segmentSize;
    this.segmentHeight = segmentHeight;
  }

  createHead() {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(this.segmentSize, this.segmentHeight, this.segmentSize);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: HEAD_COLOR,
      emissive: HEAD_COLOR,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.1
    });
    const box = new THREE.Mesh(bodyGeo, bodyMat);
    box.castShadow = true;
    group.add(box);

    const eyeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: EYE_COLOR });

    const eyeOffsetX = this.segmentSize / 2 - 0.05;
    const eyeOffsetZ = this.segmentSize / 4;
    const eyeY = this.segmentHeight / 4;

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(eyeOffsetX, eyeY, eyeOffsetZ);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(eyeOffsetX, eyeY, -eyeOffsetZ);
    group.add(rightEye);

    return group;
  }

  createBody(t) {
    const geo = new THREE.BoxGeometry(
      this.segmentSize * 0.9,
      this.segmentHeight * 0.85,
      this.segmentSize * 0.9
    );
    const mat = new THREE.MeshStandardMaterial({
      color: lerpColor(HEAD_COLOR, TAIL_COLOR, t),
      roughness: 0.6,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  createTail() {
    const geo = new THREE.ConeGeometry(this.segmentSize * 0.45, this.segmentHeight * 1.4, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: TAIL_COLOR,
      roughness: 0.6,
      metalness: 0.05
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.z = Math.PI / 4;
    mesh.castShadow = true;
    return mesh;
  }
}
