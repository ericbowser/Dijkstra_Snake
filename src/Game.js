import { SceneManager } from './core/SceneManager.js';
import { RendererManager } from './core/RendererManager.js';
import { createLighting } from './core/Lighting.js';
import { InputManager } from './core/InputManager.js';
import { GameLoop } from './core/GameLoop.js';
import { UIController } from './core/UIController.js';
import { Board } from './game/Board.js';
import { CameraRig } from './game/CameraRig.js';
import { Snake } from './game/Snake.js';
import { Food } from './game/Food.js';
import { GameController } from './game/GameController.js';
import { SnakeAI } from './game/SnakeAI.js';

const GRID_SIZE = 25;
const CELL_SIZE = 1;
const TICK_RATE_HZ = 6;

/**
 * Composition root: builds each single-responsibility piece and wires
 * them together. Also owns the round lifecycle (idle -> running ->
 * game over -> restart) since that's orchestration, not a rule any
 * single piece should own itself.
 */
export class Game {
  constructor(container) {
    this.sceneManager = new SceneManager({ backgroundColor: 0x0a0a0a });
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

    this.ai = new SnakeAI({ gridSize: GRID_SIZE });

    this.gameLoop = new GameLoop({
      tickRateHz: TICK_RATE_HZ,
      onTick: () => this.controller.tick()
    });

    this.input = new InputManager();
    this.input.on('tiltUp', () => this.cameraRig.tilt(-1));
    this.input.on('tiltDown', () => this.cameraRig.tilt(1));
    this.input.on('rotateLeft', () => this.cameraRig.rotate(-1));
    this.input.on('rotateRight', () => this.cameraRig.rotate(1));
    this.input.on('moveUp', () => this.controller?.setDirection({ x: 0, z: -1 }));
    this.input.on('moveDown', () => this.controller?.setDirection({ x: 0, z: 1 }));
    this.input.on('moveLeft', () => this.controller?.setDirection({ x: -1, z: 0 }));
    this.input.on('moveRight', () => this.controller?.setDirection({ x: 1, z: 0 }));
    this.input.on('startOrRestart', () => this._handleStartOrRestart());
    this.input.on('toggleMode', () => this.controller?.toggleMode());

    this.rendererManager.onResize((aspect) => this.cameraRig.setAspect(aspect));

    this.state = 'idle';
    this.ui.setStatus('Press space to start');
    this._clockStart = performance.now();
    this._animate = this._animate.bind(this);
  }

  start() {
    // Renders the scene immediately (board + camera visible), but the
    // round itself doesn't begin until the player presses space.
    this._animate();
  }

  _handleStartOrRestart() {
    if (this.state === 'idle' || this.state === 'gameover') {
      this._beginRound();
    }
  }

  _beginRound() {
    if (this.snake) this.sceneManager.remove(this.snake.mesh);
    if (this.food) this.sceneManager.remove(this.food.mesh);

    const mid = Math.floor(GRID_SIZE / 2);
    this.snake = new Snake({
      cellSize: CELL_SIZE,
      positions: [
        { x: mid, z: mid },
        { x: mid - 1, z: mid },
        { x: mid - 2, z: mid }
      ]
    });

    this.food = new Food({
      cellSize: CELL_SIZE,
      gridSize: GRID_SIZE,
      occupied: this.snake.positions
    });

    this.sceneManager.add(this.snake.mesh, this.food.mesh);

    this.controller = new GameController({
      snake: this.snake,
      food: this.food,
      gridSize: GRID_SIZE,
      ai: this.ai,
      onScoreChange: (score) => this.ui.setScore(score),
      onStatusChange: (label) => this.ui.setStatus(label),
      onGameOver: () => {
        this.state = 'gameover';
        this.gameLoop.stop();
        this.ui.setStatus('Game over — space to restart');
      }
    });

    this.ui.setScore(0);
    this.state = 'running';
    this.gameLoop.start();
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const elapsed = (performance.now() - this._clockStart) / 1000;

    this.cameraRig.update();
    this.food?.update(elapsed);
    this.rendererManager.render(this.sceneManager.scene, this.cameraRig.camera);
  }
}
