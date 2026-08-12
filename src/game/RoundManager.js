import { Snake } from './Snake.js';
import { Food } from './Food.js';
import { GameController } from './GameController.js';

/**
 * Owns the round lifecycle: idle -> running -> game over -> restart.
 * Creates and tears down Snake/Food/GameController for each round and
 * tracks which state the session is in. Game.js delegates here rather
 * than mixing round bookkeeping into its own composition-root duties.
 */
export class RoundManager {
  constructor({ sceneManager, gameLoop, ui, ais = {}, gridSize, cellSize }) {
    this.sceneManager = sceneManager;
    this.gameLoop = gameLoop;
    this.ui = ui;
    this.ais = ais;
    this.gridSize = gridSize;
    this.cellSize = cellSize;

    this.state = 'idle';
    this.snake = null;
    this.food = null;
    this.controller = null;

    this.ui.setStatus('Press space to start');
  }

  handleStartOrRestart() {
    if (this.state === 'idle' || this.state === 'gameover') {
      this._beginRound();
    }
  }

  _beginRound() {
    if (this.snake) this.sceneManager.remove(this.snake.mesh);
    if (this.food) this.sceneManager.remove(this.food.mesh);

    const mid = Math.floor(this.gridSize / 2);
    this.snake = new Snake({
      cellSize: this.cellSize,
      positions: [
        { x: mid, z: mid },
        { x: mid - 1, z: mid },
        { x: mid - 2, z: mid }
      ]
    });

    this.food = new Food({
      cellSize: this.cellSize,
      gridSize: this.gridSize,
      occupied: this.snake.positions
    });

    this.sceneManager.add(this.snake.mesh, this.food.mesh);

    Object.values(this.ais).forEach((ai) => ai.reset?.());

    this.controller = new GameController({
      snake: this.snake,
      food: this.food,
      gridSize: this.gridSize,
      ais: this.ais,
      onScoreChange: (score) => this.ui.setScore(score),
      onStatusChange: (status) => this.ui.setModeStatus(status),
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
}
