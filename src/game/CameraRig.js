import * as THREE from 'three';

const MIN_PHI = 0.05;   // near-straight-down
const MAX_PHI = 1.52;   // near-parallel to the board (~87deg from vertical)
const TILT_STEP = 0.12;
const ROTATE_STEP = 0.12;
const LERP_SPEED = 0.08;

export class CameraRig {
  constructor({ aspect, target, radius }) {
    this.target = target.clone();
    this.radius = radius;

    this.phi = MIN_PHI;        // current tilt, smoothed
    this.targetPhi = MIN_PHI;  // where tilt() input is pushing us

    this.theta = Math.PI / 4;       // current rotation, smoothed
    this.targetTheta = Math.PI / 4; // where rotate() input is pushing us

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

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.phi = THREE.MathUtils.lerp(this.phi, this.targetPhi, LERP_SPEED);
    this.theta = THREE.MathUtils.lerp(this.theta, this.targetTheta, LERP_SPEED);
    this._applyPosition();
  }

  _applyPosition() {
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }
}
