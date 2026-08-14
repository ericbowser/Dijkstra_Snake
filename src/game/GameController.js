const MODE_ORDER = ['manual', 'hunt', 'survive'];

/**
 * Owns the actual rules of the game: direction, collision detection,
 * eating, scoring, and game-over state. Also owns the mode cycle
 * (manual → A* hunt → live/survive). Concrete AIs are injected by
 * id (`ais.hunt`, `ais.survive`) so GameController never constructs
 * or names an algorithm (DIP). Reports structured { mode, aiStatus }
 * and leaves label formatting to UIController.
 */
export class GameController {
  constructor({
    snake,
    food,
    gridSize,
    ais = {},
    onScoreChange = () => {},
    onLengthChange = () => {},
    onGameOver = () => {},
    onStatusChange = () => {}
  }) {
    this.snake = snake;
    this.food = food;
    this.gridSize = gridSize;
    this.ais = ais;
    this.onScoreChange = onScoreChange;
    this.onLengthChange = onLengthChange;
    this.onGameOver = onGameOver;
    this.onStatusChange = onStatusChange;

    this.mode = 'manual';
    this._lastAIStatus = null;
    this.direction = { x: 1, z: 0 };
    this.pendingDirection = { x: 1, z: 0 };
    this.score = 0;
    this.gameOver = false;

    this._emitStatus();
  }

  setDirection(dir) {
    if (this.mode !== 'manual') return;
    const isReversal = dir.x === -this.direction.x && dir.z === -this.direction.z;
    if (!isReversal) this.pendingDirection = dir;
  }

  toggleMode() {
    if (this.gameOver) return;
    const hasAnyAI = MODE_ORDER.some((id) => id !== 'manual' && this.ais[id]);
    if (!hasAnyAI) return;

    let i = MODE_ORDER.indexOf(this.mode);
    if (i < 0) i = 0;
    do {
      i = (i + 1) % MODE_ORDER.length;
    } while (MODE_ORDER[i] !== 'manual' && !this.ais[MODE_ORDER[i]]);

    this.mode = MODE_ORDER[i];
    this._lastAIStatus = null;
    this._emitStatus();
  }

  refreshStatus() {
    this._emitStatus();
  }

  tick() {
    if (this.gameOver) return;

    const ai = this.ais[this.mode];
    if (ai) {
      const result = ai.decide({ snake: this.snake, food: this.food });
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
      const length = this.snake.positions.length;
      this.snake.crashInto(next);
      this.gameOver = true;
      this.onGameOver({
        reason: this._hitsWall(next) ? 'wall' : 'self',
        score: this.score,
        length
      });
      return;
    }

    const ateFood = next.x === this.food.position.x && next.z === this.food.position.z;
    this.snake.move(next, { grow: ateFood });

    if (ateFood) {
      this.score += 1;
      this.onScoreChange(this.score);
      this.food.respawn(this.snake.positions);
    }

    this.onLengthChange(this.snake.positions.length);
    this._emitStatus();
  }

  _emitStatus() {
    this.onStatusChange({ mode: this.mode, aiStatus: this._lastAIStatus });
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
