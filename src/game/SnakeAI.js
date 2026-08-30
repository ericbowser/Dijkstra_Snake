import { Pathfinder } from './Pathfinder.js';
import { CARDINAL_DIRECTIONS as DIRS, cellKey } from './directions.js';

/**
 * A* hunt: route to food through empty cells (body and tail both block)
 * so last-row / last-column pellets on every side are reached by going
 * *around* the snake, not by chasing the tail. A committed path is
 * followed until it is blocked so A* cannot reverse every tick.
 */
export class SnakeAI {
  constructor({ gridSize, pathfinder = new Pathfinder({ gridSize }) }) {
    this.gridSize = gridSize;
    this.pathfinder = pathfinder;
    this._path = [];
    this._pathFood = null;
  }

  reset() {
    this._path = [];
    this._pathFood = null;
  }

  decide({ snake, food }) {
    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    const bodyAndTail = snake.positions.slice(1);
    const foodKey = cellKey(food.position);

    if (foodKey !== this._pathFood) {
      this._path = [];
      this._pathFood = foodKey;
    }

    if (!this._pathIsUsable(head, bodyAndTail)) {
      this._path = this.pathfinder.findPath(head, food.position, bodyAndTail) || [];
    }

    const directDist =
      Math.abs(head.x - food.position.x) + Math.abs(head.z - food.position.z);
    const rimFood = this._isRimFood(food.position);
    const longDetour = this._path.length > directDist + 6;

    // Rim pellet blocked by body — don't commit to a world-spanning detour;
    // follow the tail until a short route opens (bottom-left corner case).
    if (rimFood && longDetour) {
      const midBody = snake.positions.slice(1, -1);
      const pathToTail = this.pathfinder.findPath(head, tail, midBody);
      if (pathToTail?.length > 0 && this._isMoveSafe(snake, pathToTail[0], false)) {
        this._path = [];
        return { direction: this._toDirection(head, pathToTail[0]), status: 'surviving' };
      }
    }

    if (this._path.length > 0) {
      const nextCell = this._path[0];
      const willGrow = nextCell.x === food.position.x && nextCell.z === food.position.z;
      if (this._isMoveSafe(snake, nextCell, willGrow)) {
        this._path.shift();
        return { direction: this._toDirection(head, nextCell), status: 'hunting' };
      }
      this._path = [];
    }

    const midBody = snake.positions.slice(1, -1);
    const pathToTail = this.pathfinder.findPath(head, tail, midBody);
    if (pathToTail?.length > 0 && this._isMoveSafe(snake, pathToTail[0], false)) {
      return { direction: this._toDirection(head, pathToTail[0]), status: 'surviving' };
    }

    const survival = this._bestSafeMove(snake, food);
    if (survival) return { direction: survival.dir, status: 'surviving' };

    return { direction: null, status: 'trapped' };
  }

  _pathIsUsable(head, bodyAndTail) {
    if (this._path.length === 0) return false;
    const next = this._path[0];
    if (Math.abs(next.x - head.x) + Math.abs(next.z - head.z) !== 1) return false;
    const occupied = new Set(bodyAndTail.map((p) => cellKey(p)));
    return !occupied.has(cellKey(next));
  }

  _isRimFood(pos) {
    const last = this.gridSize - 1;
    return pos.x === 0 || pos.x === last || pos.z === 0 || pos.z === last;
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

  _bestSafeMove(snake, food) {
    const head = snake.head;
    const blocked = new Set(snake.positions.slice(0, -1).map((p) => `${p.x},${p.z}`));
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
      const score = area * 1000 - dist;

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
