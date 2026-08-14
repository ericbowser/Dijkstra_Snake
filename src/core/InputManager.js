/**
 * Translates raw keyboard events into named actions. Consumers
 * subscribe to actions (`on('tiltUp', ...)`) and never see key codes —
 * new bindings can be added here without touching consumer code (OCP).
 *
 * Movement uses WASD since arrow up/down are reserved for camera tilt.
 * Space starts/restarts the game; M cycles manual → A* hunt → live.
 * P pauses / resumes an active round.
 * Minus / equals change tick speed so A* games can be watched faster.
 * Q / E bank the camera around world Z.
 */
export class InputManager {
  constructor() {
    this._listeners = new Map();

    this._keyMap = {
      ArrowUp: 'tiltUp',
      ArrowDown: 'tiltDown',
      ArrowLeft: 'rotateLeft',
      ArrowRight: 'rotateRight',
      Space: 'startOrRestart',
      KeyM: 'toggleMode',
      KeyW: 'moveUp',
      KeyS: 'moveDown',
      KeyA: 'moveLeft',
      KeyD: 'moveRight',
      Minus: 'slower',
      NumpadSubtract: 'slower',
      Equal: 'faster',
      NumpadAdd: 'faster',
      KeyQ: 'tiltZLeft',
      KeyE: 'tiltZRight',
      KeyP: 'togglePause'
    };

    this._onKeyDown = this._onKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
  }

  on(action, callback) {
    if (!this._listeners.has(action)) this._listeners.set(action, []);
    this._listeners.get(action).push(callback);
  }

  _onKeyDown(e) {
    const action = this._keyMap[e.code];
    if (!action) return;

    e.preventDefault();
    const callbacks = this._listeners.get(action) || [];
    callbacks.forEach((cb) => cb());
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
  }
}
