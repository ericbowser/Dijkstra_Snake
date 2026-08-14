import * as THREE from 'three';

const MIN_PHI = 0.05;   // near-straight-down
const MAX_PHI = 1.52;   // near-parallel to the board (~87deg from vertical)
const MAX_PSI = 2.15;   // past 90° so Q/E can look up through the board
const TILT_STEP = 0.12;
const ROTATE_STEP = 0.12;
const LERP_SPEED = 0.08;

/**
 * Orbits a perspective camera around a fixed target.
 *   phi   — polar tilt (↑/↓), Y-up
 *   theta — yaw around Y (←/→)
 *   psi   — bank around world Z (Q/E)
 */
export class CameraRig {
  constructor({ aspect, target, radius }) {
    this.target = target.clone();
    this.radius = radius;

    this.phi = MIN_PHI;
    this.targetPhi = MIN_PHI;

    this.theta = Math.PI / 4;
    this.targetTheta = Math.PI / 4;

    this.psi = 0;
    this.targetPsi = 0;

    this._offset = new THREE.Vector3();
    this._zAxis = new THREE.Vector3(0, 0, 1);

    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 500);
    this._applyPosition();
  }

  tilt(direction) {
    this.targetPhi = THREE.MathUtils.clamp(
      this.targetPhi + direction * TILT_STEP,
      MIN_PHI,
      MAX_PHI
    );
  }

  rotate(direction) {
    this.targetTheta += direction * ROTATE_STEP;
  }

  tiltZ(direction) {
    this.targetPsi = THREE.MathUtils.clamp(
      this.targetPsi + direction * TILT_STEP,
      -MAX_PSI,
      MAX_PSI
    );
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.phi = THREE.MathUtils.lerp(this.phi, this.targetPhi, LERP_SPEED);
    this.theta = THREE.MathUtils.lerp(this.theta, this.targetTheta, LERP_SPEED);
    this.psi = THREE.MathUtils.lerp(this.psi, this.targetPsi, LERP_SPEED);
    this._applyPosition();
  }

  _applyPosition() {
    this._offset.set(
      this.radius * Math.sin(this.phi) * Math.cos(this.theta),
      this.radius * Math.cos(this.phi),
      this.radius * Math.sin(this.phi) * Math.sin(this.theta)
    );
    this._offset.applyAxisAngle(this._zAxis, this.psi);

    this.camera.position.copy(this.target).add(this._offset);
    this.camera.lookAt(this.target);
  }
}
