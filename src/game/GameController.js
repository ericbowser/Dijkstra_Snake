/**
 * Owns the actual rules of the game: direction, collision detection,
 * eating, scoring, and game-over state. Also owns the manual/AI mode
 * switch — the AI itself is injected (SnakeAI), so GameController
 * doesn't know how a direction gets decided, only which source to ask
 * (DIP). Reports outcomes through callbacks; knows nothing about
 * rendering or the DOM.
 */
export class GameController {
  constructor({
    snake,
    food,
    gridSize,
    ai = null,
    onScoreChange = () => {},
    onGameOver = () => {},
    onStatusChange = () => {}
  }) {
    this.snake = snake;
    this.food = food;
    this.gridSize = gridSize;
    this.ai = ai;
    this.onScoreChange = onScoreChange;
    this.onGameOver = onGameOver;
    this.onStatusChange = onStatusChange;

    this.mode = 'manual';
    this._lastAIStatus = null;
    this.direction = { x: 1, z: 0 };
    this.pendingDirection = { x: 1, z: 0 };
    this.score = 0;
    this.gameOver = false;

    this.onStatusChange(this._statusLabel());
  }

  setDirection(dir) {
    if (this.mode !== 'manual') return;
    const isReversal = dir.x === -this.direction.x && dir.z === -this.direction.z;
    if (!isReversal) this.pendingDirection = dir;
  }

  toggleMode() {
    if (!this.ai) return;
    this.mode = this.mode === 'manual' ? 'ai' : 'manual';
    this._lastAIStatus = null;
    this.onStatusChange(this._statusLabel());
  }

  tick() {
    if (this.gameOver) return;

    if (this.mode === 'ai' && this.ai) {
      const result = this.ai.decide({ snake: this.snake, food: this.food });
      this._lastAIStatus = result.status;
      // A null direction means truly trapped — keep the last direction
      // rather than freezing; it'll end the game on collision naturally.
      if (result.direction) this.direction = result.direction;
    } else {
      this.direction = this.pendingDirection;
    }

    const head = this.snake.head;
    const next = { x: head.x + this.direction.x, z: head.z + this.direction.z };

    if (this._hitsWall(next) || this._hitsSelf(next)) {
      this.gameOver = true;
      this.onGameOver();
      return;
    }

    const ateFood = next.x === this.food.position.x && next.z === this.food.position.z;
    this.snake.move(next, { grow: ateFood });

    if (ateFood) {
      this.score += 1;
      this.onScoreChange(this.score);
      this.food.respawn(this.snake.positions);
    }

    this.onStatusChange(this._statusLabel());
  }

  _statusLabel() {
    if (this.mode === 'manual') return 'Manual';
    const labels = { hunting: 'Hunting', surviving: 'Surviving', trapped: 'Trapped' };
    return `AI: ${labels[this._lastAIStatus] || 'Hunting'}`;
  }

  _hitsWall(pos) {
    return pos.x < 0 || pos.x >= this.gridSize || pos.z < 0 || pos.z >= this.gridSize;
  }

  _hitsSelf(pos) {
    // The current tail cell will vacate this tick (unless growing),
    // so it's safe to move into — exclude it from the check.
    const body = this.snake.positions.slice(0, -1);
    return body.some((seg) => seg.x === pos.x && seg.z === pos.z);
  }
}
