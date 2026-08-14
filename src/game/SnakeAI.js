import { Pathfinder } from './Pathfinder.js';
import { CARDINAL_DIRECTIONS as DIRS, cellKey } from './directions.js';

const RECENT_HEADS = 10;

/**
 * A* hunt: path to food when the first step keeps a route back to the
 * tail. Otherwise pick the tail-safe move with the most open space (not
 * blind shortest-path tail chase, which loops around boxed-in food).
 */
export class SnakeAI {
  constructor({ gridSize, pathfinder = new Pathfinder({ gridSize }) }) {
    this.gridSize = gridSize;
    this.pathfinder = pathfinder;
    this._recentHeads = [];
  }

  reset() {
    this._recentHeads = [];
  }

  decide({ snake, food }) {
    const head = snake.head;
    const bodyExcludingTail = snake.positions.slice(0, -1);

    const pathToFood = this.pathfinder.findPath(head, food.position, bodyExcludingTail);
    if (pathToFood?.length > 0) {
      const nextCell = pathToFood[0];
      const willGrow = nextCell.x === food.position.x && nextCell.z === food.position.z;
      if (this._isMoveSafe(snake, nextCell, willGrow)) {
        this._rememberHead(head);
        return { direction: this._toDirection(head, nextCell), status: 'hunting' };
      }
    }

    const survival = this._bestSafeMove(snake, food);
    if (survival) {
      this._rememberHead(head);
      return { direction: survival.dir, status: 'surviving' };
    }

    return { direction: null, status: 'trapped' };
  }

  _rememberHead(head) {
    this._recentHeads.push(cellKey(head));
    if (this._recentHeads.length > RECENT_HEADS) this._recentHeads.shift();
  }

  _simulateBody(snake, nextCell, willGrow) {
    if (willGrow) return [nextCell, ...snake.positions];
    return [nextCell, ...snake.positions.slice(0, -1)];
  }

  _isMoveSafe(snake, nextCell, willGrow) {
    const body = this._simulateBody(snake, nextCell, willGrow);
    const newHead = body[0];
    const newTail = body[body.length - 1];
    const obstacles = body.slice(1, -1);
    return this.pathfinder.findPath(newHead, newTail, obstacles) !== null;
  }

  /**
   * Score tail-safe moves by open area, then distance to food, and
   * penalize revisiting recent head cells to break tail-chase loops.
   */
  _bestSafeMove(snake, food) {
    const head = snake.head;
    const blocked = new Set(snake.positions.slice(0, -1).map((p) => `${p.x},${p.z}`));
    const recent = new Set(this._recentHeads);
    let best = null;
    let bestScore = -Infinity;

    for (const dir of DIRS) {
      const next = { x: head.x + dir.x, z: head.z + dir.z };
      if (!this._inBounds(next) || blocked.has(`${next.x},${next.z}`)) continue;

      const willGrow = next.x === food.position.x && next.z === food.position.z;
      if (!this._isMoveSafe(snake, next, willGrow)) continue;

      const body = this._simulateBody(snake, next, willGrow);
      const area = this.pathfinder.floodFill(next, body.slice(1));
      const dist = Math.abs(next.x - food.position.x) + Math.abs(next.z - food.position.z);
      const loopPenalty = recent.has(cellKey(next)) ? 1 : 0;

      // Higher area first; nudge toward food; deprioritize loop cells
      const score = area * 1000 - dist - loopPenalty * 5000;
      if (score > bestScore) {
        bestScore = score;
        best = { dir, area };
      }
    }

    return best;
  }

  _inBounds(pos) {
    return pos.x >= 0 && pos.x < this.gridSize && pos.z >= 0 && pos.z < this.gridSize;
  }

  _toDirection(from, to) {
    return { x: to.x - from.x, z: to.z - from.z };
  }
}
