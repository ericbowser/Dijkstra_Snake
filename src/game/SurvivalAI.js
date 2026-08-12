import { CARDINAL_DIRECTIONS as DIRS, cellKey, toDirection, step } from './directions.js';
import { buildHamiltonianCycle, indexCycle, onForwardArc } from './HamiltonianCycle.js';

/**
 * Endurance strategy: stay on a Hamiltonian cycle so the snake can
 * crawl indefinitely (always stepping onto the cell the tail is about
 * to leave once the body fills the cycle). Safe shortcuts along the
 * empty forward arc grab on-cycle food without leaving that guarantee.
 *
 * Never steps onto the leftover odd-grid row — food there is ignored
 * (documented limitation) rather than risking a trap off-cycle.
 */
export class SurvivalAI {
  constructor({ gridSize }) {
    this.gridSize = gridSize;
    const { cycle } = buildHamiltonianCycle(gridSize);
    this.cycle = cycle;
    this.index = indexCycle(cycle);
  }

  reset() {}

  decide({ snake, food }) {
    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    const L = this.cycle.length;
    const h = this._idx(head);
    const t = this._idx(tail);
    const f = this._idx(food.position);

    if (h < 0) return this._recoverToCycle(snake);

    // Off-cycle food: just follow the cycle. On-cycle: shortcut toward it
    // but never past it, and never past the tail (empty-arc invariant).
    const goal = f >= 0 ? f : (h + 1) % L;

    let bestDir = null;
    let bestDist = 0;

    for (const dir of DIRS) {
      const next = step(head, dir);
      const ni = this._idx(next);
      if (ni < 0) continue;
      if (!this._isFree(next, snake.positions)) continue;
      if (t >= 0 && !onForwardArc(h, ni, t, L)) continue;

      const dist = (ni - h + L) % L;
      const goalDist = (goal - h + L) % L;
      if (dist > 0 && dist <= goalDist && dist >= bestDist) {
        bestDist = dist;
        bestDir = dir;
      }
    }

    if (bestDir) {
      return { direction: bestDir, status: bestDist > 1 ? 'shortcut' : 'cycling' };
    }

    const nxt = this.cycle[(h + 1) % L];
    if (this._isFree(nxt, snake.positions)) {
      return { direction: toDirection(head, nxt), status: 'cycling' };
    }

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (next.x === tail.x && next.z === tail.z) {
        return { direction: dir, status: 'cycling' };
      }
    }

    return { direction: null, status: 'trapped' };
  }

  _recoverToCycle(snake) {
    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    let best = null;
    let bestScore = -Infinity;

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (!this._inGrid(next) || !this._isFree(next, snake.positions)) continue;
      const onCycle = this._idx(next) >= 0;
      const towardTail = next.x === tail.x && next.z === tail.z;
      const score = (onCycle ? 100 : 0) + (towardTail ? 10 : 0) - next.z;
      if (score > bestScore) {
        bestScore = score;
        best = dir;
      }
    }

    if (best) return { direction: best, status: 'recovering' };
    return { direction: null, status: 'trapped' };
  }

  _idx(pos) {
    const i = this.index.get(cellKey(pos));
    return i === undefined ? -1 : i;
  }

  _isFree(pos, body) {
    const tail = body[body.length - 1];
    const occupied = body.some((p) => p.x === pos.x && p.z === pos.z);
    return !occupied || (tail.x === pos.x && tail.z === pos.z);
  }

  _inGrid(pos) {
    return pos.x >= 0 && pos.x < this.gridSize && pos.z >= 0 && pos.z < this.gridSize;
  }
}
