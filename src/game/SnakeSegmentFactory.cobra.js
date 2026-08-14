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

function skin(color, { emissive = false } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive ? color : 0x000000,
    emissiveIntensity: emissive ? 0.28 : 0,
    roughness: 0.48,
    metalness: 0.05
  });
}

/**
 * Cobra-head backup. Point Snake.js at this file to revert the
 * triangular-head experiment.
 */
export class SnakeSegmentFactory {
  constructor({ segmentSize = 0.8 } = {}) {
    this.segmentSize = segmentSize;
  }

  createHead() {
    const group = new THREE.Group();
    const s = this.segmentSize;
    const mat = skin(HEAD_COLOR, { emissive: true });

    const skull = new THREE.Mesh(new THREE.SphereGeometry(s * 0.34, 18, 14), mat);
    skull.scale.set(1.28, 0.76, 0.82);
    skull.position.set(s * 0.1, 0.02, 0);
    skull.castShadow = true;
    group.add(skull);

    const hood = new THREE.Mesh(new THREE.SphereGeometry(s * 0.4, 18, 14), mat);
    hood.scale.set(0.4, 1.08, 1.7);
    hood.position.set(-s * 0.1, s * 0.14, 0);
    hood.castShadow = true;
    group.add(hood);

    const collar = new THREE.Mesh(new THREE.SphereGeometry(s * 0.3, 14, 12), mat);
    collar.scale.set(0.72, 0.68, 1.12);
    collar.position.set(-s * 0.16, -s * 0.02, 0);
    collar.castShadow = true;
    group.add(collar);

    const eyeGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const eyeMat = new THREE.MeshStandardMaterial({ color: EYE_COLOR });
    const eyeX = s * 0.28;
    const eyeZ = s * 0.22;
    const eyeY = s * 0.12;

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
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 16, 12),
      skin(lerpColor(HEAD_COLOR, TAIL_COLOR, t))
    );
    mesh.castShadow = true;
    return mesh;
  }

  createTail() {
    const s = this.segmentSize;
    const length = s * 1.05;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(s * 0.28, length, 10),
      skin(TAIL_COLOR)
    );
    cone.rotation.z = -Math.PI / 2;
    cone.position.x = -length * 0.2;
    cone.castShadow = true;
    return cone;
  }
}
