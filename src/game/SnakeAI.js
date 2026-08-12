import { Pathfinder } from './Pathfinder.js';
import { CARDINAL_DIRECTIONS as DIRS } from './directions.js';

const SAFETY_MARGIN = 0.5; // require at least 50% of body length reachable after the move

/**
 * Decides the snake's next direction each tick. Delegates all
 * searching to Pathfinder (DIP) — this class only encodes strategy:
 * hunt food when it's safe to, chase the tail to buy space when it's
 * not, and fall back to any safe adjacent cell as a last resort.
 */
export class SnakeAI {
  constructor({ gridSize, pathfinder = new Pathfinder({ gridSize }) }) {
    this.gridSize = gridSize;
    this.pathfinder = pathfinder;
  }

  decide({ snake, food }) {
    const head = snake.head;
    const bodyExcludingTail = snake.positions.slice(0, -1); // tail vacates this tick
    const tail = snake.positions[snake.positions.length - 1];

    const pathToFood = this.pathfinder.findPath(head, food.position, bodyExcludingTail);
    if (pathToFood && pathToFood.length > 0) {
      const nextCell = pathToFood[0];
      const simulatedBody = [nextCell, ...snake.positions.slice(0, -1)];
      const reachable = this.pathfinder.floodFill(nextCell, simulatedBody.slice(1));

      if (reachable >= snake.positions.length * SAFETY_MARGIN) {
        return { direction: this._toDirection(head, nextCell), status: 'hunting' };
      }
    }

    const pathToTail = this.pathfinder.findPath(head, tail, bodyExcludingTail);
    if (pathToTail && pathToTail.length > 0) {
      return { direction: this._toDirection(head, pathToTail[0]), status: 'surviving' };
    }

    const fallback = this._anySafeMove(head, snake.positions);
    if (fallback) return { direction: fallback, status: 'surviving' };

    return { direction: null, status: 'trapped' };
  }

  _anySafeMove(head, obstacles) {
    const blocked = new Set(obstacles.map((p) => `${p.x},${p.z}`));
    for (const dir of DIRS) {
      const next = { x: head.x + dir.x, z: head.z + dir.z };
      const inBounds = next.x >= 0 && next.x < this.gridSize && next.z >= 0 && next.z < this.gridSize;
      if (inBounds && !blocked.has(`${next.x},${next.z}`)) return dir;
    }
    return null;
  }

  _toDirection(from, to) {
    return { x: to.x - from.x, z: to.z - from.z };
  }
}
