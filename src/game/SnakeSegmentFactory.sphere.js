import * as THREE from 'three';
import { PASTEL } from '../palette.js';

const HEAD_COLOR = PASTEL.snakeHead;
const TAIL_COLOR = PASTEL.snakeTail;
const EYE_COLOR = PASTEL.snakeEye;

function lerpColor(colorA, colorB, t) {
  const a = new THREE.Color(colorA);
  const b = new THREE.Color(colorB);
  return a.clone().lerp(b, t);
}

/**
 * All-sphere segment factory. Point Snake.js at this file to revert
 * the cobra-head / pointer-tail experiment.
 */
export class SnakeSegmentFactory {
  constructor({ segmentSize = 0.8 } = {}) {
    this.segmentSize = segmentSize;
  }

  createHead() {
    const group = new THREE.Group();
    const radius = this.segmentSize * 0.48;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: HEAD_COLOR,
      emissive: HEAD_COLOR,
      emissiveIntensity: 0.28,
      roughness: 0.45,
      metalness: 0.05
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), bodyMat);
    sphere.castShadow = true;
    group.add(sphere);

    const eyeGeo = new THREE.SphereGeometry(0.075, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: EYE_COLOR });
    const eyeX = radius * 0.72;
    const eyeZ = radius * 0.38;
    const eyeY = radius * 0.28;

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(eyeX, eyeY, eyeZ);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(eyeX, eyeY, -eyeZ);
    group.add(rightEye);

    return group;
  }

  createBody(t) {
    const radius = this.segmentSize * 0.42;
    const mat = new THREE.MeshStandardMaterial({
      color: lerpColor(HEAD_COLOR, TAIL_COLOR, t),
      roughness: 0.55,
      metalness: 0.04
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), mat);
    mesh.castShadow = true;
    return mesh;
  }

  createTail() {
    const radius = this.segmentSize * 0.32;
    const mat = new THREE.MeshStandardMaterial({
      color: TAIL_COLOR,
      roughness: 0.55,
      metalness: 0.04
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), mat);
    mesh.castShadow = true;
    return mesh;
  }
}
