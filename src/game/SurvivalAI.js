import { CARDINAL_DIRECTIONS as DIRS, cellKey, toDirection, step } from './directions.js';
import { buildHamiltonianCycle, indexCycle, onForwardArc } from './HamiltonianCycle.js';

/**
 * Endurance strategy: follow a Hamiltonian cycle forever. On-cycle food
 * is eaten when the path reaches it. Each lap also sweeps the omitted
 * last row (z = gridSize - 1 on odd×odd boards) before rejoining.
 */
export class SurvivalAI {
  constructor({ gridSize }) {
    this.gridSize = gridSize;
    const { cycle, height, width } = buildHamiltonianCycle(gridSize);
    this.cycle = cycle;
    this.cycleHeight = height;
    this.cycleWidth = width;
    this.index = indexCycle(cycle);
    this._detour = [];
  }

  reset() {
    this._detour = [];
  }

  decide({ snake, food }) {
    if (this._detour.length > 0) {
      const next = this._detour[0];
      if (this._isFree(next, snake.positions)) {
        this._detour.shift();
        return { direction: toDirection(snake.head, next), status: 'shortcut' };
      }
      // Path blocked — wait for the tail instead of abandoning onto the food row
      const tail = snake.positions[snake.positions.length - 1];
      for (const dir of DIRS) {
        const stepPos = step(snake.head, dir);
        if (stepPos.x === tail.x && stepPos.z === tail.z) {
          return { direction: dir, status: 'cycling' };
        }
      }
      this._detour = [];
      if (this._idx(snake.head) < 0) return this._recoverToCycle(snake);
    }

    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    const L = this.cycle.length;
    const h = this._idx(head);
    const t = this._idx(tail);
    const f = this._idx(food.position);

    if (h < 0) return this._recoverToCycle(snake);

    const planned = this._planOffCycleDetour(head, food, snake);
    if (planned) {
      const [first, ...rest] = planned;
      this._detour = rest;
      return { direction: toDirection(head, first), status: 'shortcut' };
    }

    const sweep = this._planBottomRowSweep(head, snake, food);
    if (sweep) {
      const [first, ...rest] = sweep;
      this._detour = rest;
      return { direction: toDirection(head, first), status: 'cycling' };
    }

    // Food sitting on the very next cycle cell — take it
    const nextCycle = this.cycle[(h + 1) % L];
    if (
      f >= 0 &&
      f === (h + 1) % L &&
      this._isFree(nextCycle, snake.positions)
    ) {
      return { direction: toDirection(head, nextCycle), status: 'cycling' };
    }

    let goal = f;
    const offCycle = f < 0 && this._isOffCycleFood(food.position);
    if (goal < 0) {
      const entry = this._entryForOffCycle(food.position);
      goal = entry ? this._idx(entry) : -1;
    }

    // Off-cycle food: shortcut along the cycle toward the entry cell
    if (offCycle && goal >= 0 && goal !== h) {
      let bestDir = null;
      let bestDist = 0;
      for (const dir of DIRS) {
        const next = step(head, dir);
        const ni = this._idx(next);
        if (ni < 0) continue;
        if (!this._isFree(next, snake.positions)) continue;
        if (t >= 0 && !onForwardArc(h, ni, t, L)) continue;
        if (ni !== (h + 1) % L && !this._isShortcutClear(h, ni, snake.positions)) continue;

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

      if (h === goal) {
        for (const dir of DIRS) {
          const next = step(head, dir);
          if (next.x === tail.x && next.z === tail.z) {
            return { direction: dir, status: 'cycling' };
          }
        }
      }
    }

    // Default: one step forward on the Hamiltonian cycle — safe indefinitely
    if (this._isFree(nextCycle, snake.positions)) {
      return { direction: toDirection(head, nextCycle), status: 'cycling' };
    }

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (next.x === tail.x && next.z === tail.z) {
        return { direction: dir, status: 'cycling' };
      }
    }

    return this._safeFallback(snake);
  }

  /**
   * Border row (z = height-1) is odd in our construction, so the cycle
   * runs right→left. Prefer entering one cell to the right of the food
   * when possible so the exit can step left (forward) back onto the cycle.
   */
  _isOffCycleFood(foodPos) {
    return foodPos.z >= this.cycleHeight;
  }

  _entryForOffCycle(foodPos) {
    if (foodPos.z < this.cycleHeight) return null;
    const z = this.cycleHeight - 1;
    if (foodPos.x + 1 < this.cycleWidth) {
      return { x: foodPos.x + 1, z };
    }
    return { x: foodPos.x, z };
  }

  /**
   * Odd×odd boards omit z = cycleHeight from the cycle. Each lap, when the
   * head hits the east end of the border row (24,23), sweep the bottom row
   * right → left and rejoin at (0,23).
   */
  _planBottomRowSweep(head, snake, food) {
    const zBot = this.cycleHeight - 1;
    const zLast = this.cycleHeight;
    if (head.x !== this.cycleWidth - 1 || head.z !== zBot) return null;

    const path = [{ x: this.cycleWidth - 1, z: zLast }];
    for (let x = this.cycleWidth - 2; x >= 0; x -= 1) {
      path.push({ x, z: zLast });
    }
    path.push({ x: 0, z: zBot });

    const L = this.cycle.length;
    const h = this._idx(head);
    const t = this._idx(snake.positions[snake.positions.length - 1]);
    if (h < 0) return null;

    if (this._pathIsSafe(path, food.position, snake, h, t, L)) return path;
    return null;
  }

  /**
   * Detours for food on the omitted last row (z = cycleHeight).
   */
  _planOffCycleDetour(head, food, snake) {
    const foodPos = food.position;
    if (!this._isOffCycleFood(foodPos) || foodPos.z !== this.cycleHeight) return null;

    const zBot = this.cycleHeight - 1;
    const fx = foodPos.x;
    const L = this.cycle.length;
    const h = this._idx(head);
    const t = this._idx(snake.positions[snake.positions.length - 1]);
    if (h < 0) return null;

    const candidates = [];

    // A) approach from (fx+1, zBot): up → eat → exit left
    if (head.x === fx + 1 && head.z === zBot && fx + 1 < this.cycleWidth) {
      candidates.push([
        { x: fx + 1, z: foodPos.z },
        foodPos,
        { x: fx, z: zBot }
      ]);
    }

    // B) right-edge food: from (fx, zBot): eat → left along food row → exit
    if (head.x === fx && head.z === zBot && fx - 1 >= 0) {
      candidates.push([
        foodPos,
        { x: fx - 1, z: foodPos.z },
        { x: fx - 1, z: zBot }
      ]);
    }

    // C) already on food row one cell east of food
    if (head.x === fx + 1 && head.z === foodPos.z) {
      candidates.push([foodPos, { x: fx, z: zBot }]);
    }

    // D) already on food at right column — slide left off the row
    if (head.x === fx && head.z === foodPos.z && fx - 1 >= 0) {
      candidates.push([
        { x: fx - 1, z: foodPos.z },
        { x: fx - 1, z: zBot }
      ]);
    }

    for (const path of candidates) {
      if (this._pathIsSafe(path, foodPos, snake, h, t, L)) return path;
    }
    return null;
  }

  _pathIsSafe(path, foodPos, snake, h, t, L) {
    const exit = path[path.length - 1];
    const exitIdx = this._idx(exit);
    if (exitIdx < 0) return false;

    if (t >= 0 && !onForwardArc(h, exitIdx, t, L) && exitIdx !== (h + 1) % L) {
      return false;
    }

    let body = snake.positions.map((p) => ({ ...p }));
    for (const cell of path) {
      const growing =
        foodPos && cell.x === foodPos.x && cell.z === foodPos.z;
      const tail = body[body.length - 1];
      const occupied = body.some((p) => p.x === cell.x && p.z === cell.z);
      if (occupied && (growing || !(tail.x === cell.x && tail.z === cell.z))) {
        return false;
      }
      body = [cell, ...body];
      if (!growing) body.pop();
    }

    const nextIdx = (exitIdx + 1) % L;
    const nextCell = this.cycle[nextIdx];
    const newTail = body[body.length - 1];
    const nextBlocked = body.some((p) => p.x === nextCell.x && p.z === nextCell.z);
    if (nextBlocked && !(newTail.x === nextCell.x && newTail.z === nextCell.z)) {
      return false;
    }

    return true;
  }

  _recoverToCycle(snake) {
    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    const zBot = this.cycleHeight - 1;
    let best = null;
    let bestScore = -Infinity;

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (!this._inGrid(next) || !this._isFree(next, snake.positions)) continue;
      const onCycle = this._idx(next) >= 0;
      const towardTail = next.x === tail.x && next.z === tail.z;
      const backToBorder = head.z >= this.cycleHeight && next.z === zBot ? 80 : 0;
      const score = backToBorder + (onCycle ? 100 : 0) + (towardTail ? 10 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = dir;
      }
    }

    if (best) return { direction: best, status: 'recovering' };
    return this._safeFallback(snake, 'trapped');
  }

  /**
   * Skipping ahead on the cycle is only safe if no body segment still
   * sits on a cell we'd leap over (shortcuts break cycle contiguity).
   */
  _isShortcutClear(fromIdx, toIdx, body) {
    const L = this.cycle.length;
    const tail = body[body.length - 1];
    let i = (fromIdx + 1) % L;
    while (i !== toIdx) {
      const cell = this.cycle[i];
      const occupied = body.some((p) => p.x === cell.x && p.z === cell.z);
      if (occupied && !(tail.x === cell.x && tail.z === cell.z)) return false;
      i = (i + 1) % L;
    }
    return true;
  }

  /** Last resort — never return null while any safe move exists. */
  _safeFallback(snake, status = 'recovering') {
    const head = snake.head;
    const tail = snake.positions[snake.positions.length - 1];
    const h = this._idx(head);
    const L = this.cycle.length;

    if (h >= 0) {
      const nxt = this.cycle[(h + 1) % L];
      if (this._isFree(nxt, snake.positions)) {
        return { direction: toDirection(head, nxt), status: 'cycling' };
      }
    }

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (!this._inGrid(next) || !this._isFree(next, snake.positions)) continue;
      if (next.x === tail.x && next.z === tail.z) {
        return { direction: dir, status: 'cycling' };
      }
    }

    for (const dir of DIRS) {
      const next = step(head, dir);
      if (this._inGrid(next) && this._isFree(next, snake.positions)) {
        return { direction: dir, status };
      }
    }

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
