import { SceneManager } from './core/SceneManager.js';
import { RendererManager } from './core/RendererManager.js';
import { createLighting } from './core/Lighting.js';
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
const TICK_RATE_HZ = 6;

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
      fogNear: 22,
      fogFar: 48
    });
    this.rendererManager = new RendererManager({ container });

    this.board = new Board({ gridSize: GRID_SIZE, cellSize: CELL_SIZE });
    this.sceneManager.add(this.board.mesh);

    this.cameraRig = new CameraRig({
      aspect: window.innerWidth / window.innerHeight,
      target: this.board.center,
      radius: GRID_SIZE * CELL_SIZE * 0.9
    });

    const lights = createLighting({ target: this.board.center });
    this.sceneManager.add(...lights);

    this.ui = new UIController({
      scoreEl: document.getElementById('score'),
      statusEl: document.getElementById('ai-status')
    });

    this.ais = {
      hunt: new SnakeAI({ gridSize: GRID_SIZE }),
      survive: new SurvivalAI({ gridSize: GRID_SIZE })
    };

    this.gameLoop = new GameLoop({
      tickRateHz: TICK_RATE_HZ,
      onTick: () => this.round.controller.tick()
    });

    this.round = new RoundManager({
      sceneManager: this.sceneManager,
      gameLoop: this.gameLoop,
      ui: this.ui,
      ais: this.ais,
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE
    });

    this.input = new InputManager();
    this.input.on('tiltUp', () => this.cameraRig.tilt(-1));
    this.input.on('tiltDown', () => this.cameraRig.tilt(1));
    this.input.on('rotateLeft', () => this.cameraRig.rotate(-1));
    this.input.on('rotateRight', () => this.cameraRig.rotate(1));
    this.input.on('moveUp', () => this.round.controller?.setDirection({ x: 0, z: -1 }));
    this.input.on('moveDown', () => this.round.controller?.setDirection({ x: 0, z: 1 }));
    this.input.on('moveLeft', () => this.round.controller?.setDirection({ x: -1, z: 0 }));
    this.input.on('moveRight', () => this.round.controller?.setDirection({ x: 1, z: 0 }));
    this.input.on('startOrRestart', () => this.round.handleStartOrRestart());
    this.input.on('toggleMode', () => this.round.controller?.toggleMode());

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

  start() {
    // Renders the scene immediately (board + camera visible), but the
    // round itself doesn't begin until the player presses space.
    this._animate();
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const elapsed = (performance.now() - this._clockStart) / 1000;

    this.cameraRig.update();
    this.round.food?.update(elapsed);
    this.rendererManager.render(this.sceneManager.scene, this.cameraRig.camera);
  }
}
