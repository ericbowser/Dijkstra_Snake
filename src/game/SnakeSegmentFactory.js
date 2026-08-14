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
 * Whimsical cartoon head (chubby skull, big eyes, snout, forked tongue)
 * + pointer tail, circular body. Built facing +X; Snake.js yaws to travel.
 *
 * Backups: SnakeSegmentFactory.cobra.js, .sphere.js, .box.js
 */
export class SnakeSegmentFactory {
  constructor({ segmentSize = 0.8 } = {}) {
    this.segmentSize = segmentSize;
  }

  createHead() {
    const group = new THREE.Group();
    const s = this.segmentSize;
    const mat = skin(HEAD_COLOR, { emissive: true });

    // Oversize chubby skull — clearly larger than body spheres
    const skull = new THREE.Mesh(new THREE.SphereGeometry(s * 0.58, 22, 18), mat);
    skull.scale.set(1.05, 0.92, 1.12);
    skull.position.set(s * 0.08, s * 0.1, 0);
    skull.castShadow = true;
    group.add(skull);

    // Rosy cheek blushes — sit proud of the skull so they silhouette
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xff8fab,
      emissive: 0xff8fab,
      emissiveIntensity: 0.25,
      roughness: 0.55
    });
    for (const side of [1, -1]) {
      const cheek = new THREE.Mesh(new THREE.SphereGeometry(s * 0.16, 12, 10), cheekMat);
      cheek.position.set(s * 0.1, -s * 0.02, side * s * 0.52);
      cheek.scale.set(0.65, 0.5, 0.75);
      group.add(cheek);
    }

    // Rounded snout / muzzle
    const snout = new THREE.Mesh(new THREE.SphereGeometry(s * 0.28, 16, 14), mat);
    snout.scale.set(1.2, 0.7, 0.95);
    snout.position.set(s * 0.55, 0, 0);
    snout.castShadow = true;
    group.add(snout);

    // Nostrils
    const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.75 });
    for (const side of [1, -1]) {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(s * 0.045, 8, 6), nostrilMat);
      nostril.position.set(s * 0.78, s * 0.04, side * s * 0.09);
      group.add(nostril);
    }

    // Oversized googly eyes — sit high so they read from bird’s-eye
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
      roughness: 0.3
    });
    const pupilMat = new THREE.MeshStandardMaterial({
      color: EYE_COLOR,
      emissive: 0x0a1020,
      emissiveIntensity: 0.15,
      roughness: 0.35
    });
    const sparkMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.55,
      roughness: 0.15
    });

    for (const side of [1, -1]) {
      const sclera = new THREE.Mesh(new THREE.SphereGeometry(s * 0.22, 16, 14), scleraMat);
      sclera.position.set(s * 0.22, s * 0.38, side * s * 0.34);
      group.add(sclera);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(s * 0.11, 12, 10), pupilMat);
      pupil.position.set(s * 0.34, s * 0.4, side * s * 0.34);
      group.add(pupil);

      const spark = new THREE.Mesh(new THREE.SphereGeometry(s * 0.04, 8, 6), sparkMat);
      spark.position.set(s * 0.4, s * 0.48, side * s * 0.28);
      group.add(spark);
    }

    // Bold forked tongue — pops against red/black board
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xff3d6e,
      emissive: 0xff3d6e,
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    const tongue = new THREE.Mesh(
      new THREE.CylinderGeometry(s * 0.04, s * 0.05, s * 0.42, 8),
      tongueMat
    );
    tongue.rotation.z = -Math.PI / 2;
    tongue.position.set(s * 0.88, -s * 0.1, 0);
    group.add(tongue);

    for (const side of [1, -1]) {
      const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(s * 0.018, s * 0.035, s * 0.22, 6),
        tongueMat
      );
      tip.rotation.z = -Math.PI / 2 + side * 0.55;
      tip.position.set(s * 1.12, -s * 0.1, side * s * 0.09);
      group.add(tip);
    }

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
    // Default cone points +Y; yaw it so the tip trails behind (-X).
    cone.rotation.z = -Math.PI / 2;
    cone.position.x = -length * 0.2;
    cone.castShadow = true;
    return cone;
  }
}
