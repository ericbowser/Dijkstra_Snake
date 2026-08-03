import * as THREE from 'three';

/**
 * Owns the WebGLRenderer and its DOM mounting/resizing.
 * Nothing else touches renderer internals.
 */
export class RendererManager {
  constructor({ container, shadows = true }) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = shadows;
    this.container.appendChild(this.renderer.domElement);

    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._resizeListeners = [];
  }

  onResize(callback) {
    this._resizeListeners.push(callback);
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  _onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight;
    this._resizeListeners.forEach((cb) => cb(aspect));
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
  }
}
