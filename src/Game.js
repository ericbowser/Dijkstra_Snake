import { SceneManager } from './core/SceneManager.js';
import { RendererManager } from './core/RendererManager.js';
import { createLighting, createCrystalEnvironment } from './core/Lighting.js';
import { InputManager } from './core/InputManager.js';
import { GameLoop } from './core/GameLoop.js';
import { UIController } from './core/UIController.js';
import { Board } from './game/Board.js';
import { CameraRig } from './game/CameraRig.js';
import { SnakeAI } from './game/SnakeAI.js';
import { SurvivalAI } from './game/SurvivalAI.js';
import { RoundManager } from './game/RoundManager.js';
import { PASTEL } from './palette.js';

const GRID_SIZE = 25;
const CELL_SIZE = 1;
const TICK_RATES_HZ = [4, 6, 10, 16, 24, 36];
const DEFAULT_RATE_INDEX = 1;
/** Live mode tick boost on top of the user's speed setting. */
const SURVIVE_SPEED_MULT = 1.5;
const MAX_TICK_HZ = TICK_RATES_HZ[TICK_RATES_HZ.length - 1];

/**
 * Composition root: builds each single-responsibility piece and wires
 * them together. Round lifecycle (idle -> running -> game over ->
 * restart) is delegated to RoundManager — Game.js's only job is
 * wiring dependencies and driving the render loop.
 *
 * `state`, `snake`, `food`, and `controller` are exposed as read-only
 * getters delegating to `round` so external consumers (DevTools, the
 * Cypress test's window.__game) keep working unchanged even though
 * round bookkeeping now lives in a separate class.
 */
export class Game {
  constructor(container) {
    this.sceneManager = new SceneManager({
      backgroundColor: PASTEL.background,
      fogColor: PASTEL.fog,
      fogNear: 36,
      fogFar: 65
    });
    this.rendererManager = new RendererManager({ container });
    this.sceneManager.scene.environment = createCrystalEnvironment(
      this.rendererManager.renderer
    );

    this.board = new Board({ gridSize: GRID_SIZE, cellSize: CELL_SIZE });
    this.sceneManager.add(this.board.mesh);

    this.cameraRig = new CameraRig({
      aspect: window.innerWidth / window.innerHeight,
      target: this.board.center,
      radius: GRID_SIZE * CELL_SIZE * 1.22
    });

    const lights = createLighting({ target: this.board.center });
    this.sceneManager.add(...lights);

    this.ui = new UIController({
      scoreEl: document.getElementById('score'),
      statusEl: document.getElementById('ai-status'),
      speedEl: document.getElementById('speed'),
      lengthEl: document.getElementById('length')
    });

    this._rateIndex = DEFAULT_RATE_INDEX;

    this.ais = {
      hunt: new SnakeAI({ gridSize: GRID_SIZE }),
      survive: new SurvivalAI({ gridSize: GRID_SIZE })
    };

    this.gameLoop = new GameLoop({
      tickRateHz: TICK_RATES_HZ[this._rateIndex],
      onTick: () => this.round.controller.tick()
    });

    this.round = new RoundManager({
      sceneManager: this.sceneManager,
      gameLoop: this.gameLoop,
      ui: this.ui,
      ais: this.ais,
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE,
      onStateChange: () => this._syncPauseButton()
    });

    this.input = new InputManager();
    this.input.on('tiltUp', () => this.cameraRig.tilt(-1));
    this.input.on('tiltDown', () => this.cameraRig.tilt(1));
    this.input.on('rotateLeft', () => this.cameraRig.rotate(-1));
    this.input.on('rotateRight', () => this.cameraRig.rotate(1));
    this.input.on('tiltZLeft', () => this.cameraRig.tiltZ(-1));
    this.input.on('tiltZRight', () => this.cameraRig.tiltZ(1));
    this.input.on('moveUp', () => this.round.controller?.setDirection({ x: 0, z: -1 }));
    this.input.on('moveDown', () => this.round.controller?.setDirection({ x: 0, z: 1 }));
    this.input.on('moveLeft', () => this.round.controller?.setDirection({ x: -1, z: 0 }));
    this.input.on('moveRight', () => this.round.controller?.setDirection({ x: 1, z: 0 }));
    this.input.on('startOrRestart', () => {
      this.round.handleStartOrRestart();
      this._applySpeed();
    });
    this.input.on('toggleMode', () => {
      this.round.controller?.toggleMode();
      this._applySpeed();
    });
    this.input.on('faster', () => this._nudgeSpeed(1));
    this.input.on('slower', () => this._nudgeSpeed(-1));
    this.input.on('togglePause', () => this._togglePause());

    this._pauseBtn = document.getElementById('pause-btn');
    this._pauseBtn?.addEventListener('click', () => this._togglePause());

    this._applySpeed();

    this.rendererManager.onResize((aspect) => this.cameraRig.setAspect(aspect));

    this._clockStart = performance.now();
    this._animate = this._animate.bind(this);
  }

  get state() {
    return this.round.state;
  }

  get snake() {
    return this.round.snake;
  }

  get food() {
    return this.round.food;
  }

  get controller() {
    return this.round.controller;
  }

  _togglePause() {
    if (this.round.togglePause()) this._syncPauseButton();
  }

  _syncPauseButton() {
    if (!this._pauseBtn) return;
    const running = this.round.state === 'running';
    this._pauseBtn.disabled = !running;
    this._pauseBtn.textContent = this.round.paused ? 'Resume' : 'Pause';
  }

  _nudgeSpeed(delta) {
    const next = this._rateIndex + delta;
    if (next < 0 || next >= TICK_RATES_HZ.length) return;
    this._rateIndex = next;
    this._applySpeed();
  }

  _applySpeed() {
    let hz = TICK_RATES_HZ[this._rateIndex];
    if (this.round.controller?.mode === 'survive') {
      hz = Math.min(MAX_TICK_HZ, hz * SURVIVE_SPEED_MULT);
    }
    this.gameLoop.setTickRate(hz);
    this.ui.setSpeed(hz / TICK_RATES_HZ[DEFAULT_RATE_INDEX]);
  }

  start() {
    // Renders the scene immediately (board + camera visible), but the
    // round itself doesn't begin until the player presses space.
    this._animate();
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const elapsed = (performance.now() - this._clockStart) / 1000;

    this.cameraRig.update();
    this.board.setCameraHeight(this.cameraRig.camera.position.y);
    this.board.update();
    if (this.round.state === 'running' && !this.round.paused) {
      this.round.food?.update(elapsed);
    }
    this.rendererManager.render(this.sceneManager.scene, this.cameraRig.camera);
  }
}
