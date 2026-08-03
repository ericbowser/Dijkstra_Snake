const DIRS = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 }
];

/**
 * Pure pathfinding algorithms operating on grid coordinates. Knows
 * nothing about Snake, Food, or Three.js — obstacles are passed in as
 * plain data so this stays independently reusable and testable (SRP).
 */
export class Pathfinder {
  constructor({ gridSize }) {
    this.gridSize = gridSize;
  }

  /**
   * A* search from start to goal, avoiding cells in `obstacles`.
   * Returns an array of {x,z} steps (excluding start, including goal),
   * or null if no path exists.
   */
  findPath(start, goal, obstacles) {
    const blocked = new Set(obstacles.map((p) => `${p.x},${p.z}`));
    const heuristic = (p) => Math.abs(p.x - goal.x) + Math.abs(p.z - goal.z);

    const open = [{ pos: start, g: 0, f: heuristic(start), parent: null }];
    const bestG = new Map([[`${start.x},${start.z}`, 0]]);

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();

      if (current.pos.x === goal.x && current.pos.z === goal.z) {
        return this._reconstructPath(current);
      }

      for (const dir of DIRS) {
        const next = { x: current.pos.x + dir.x, z: current.pos.z + dir.z };
        const key = `${next.x},${next.z}`;
        if (!this._inBounds(next) || blocked.has(key)) continue;

        const g = current.g + 1;
        if (bestG.has(key) && bestG.get(key) <= g) continue;

        bestG.set(key, g);
        open.push({ pos: next, g, f: g + heuristic(next), parent: current });
      }
    }

    return null;
  }

  /**
   * Counts cells reachable from `start` avoiding `obstacles` — used to
   * verify a move doesn't trap the snake in a dead-end pocket.
   */
  floodFill(start, obstacles) {
    const blocked = new Set(obstacles.map((p) => `${p.x},${p.z}`));
    const seen = new Set([`${start.x},${start.z}`]);
    const queue = [start];

    while (queue.length > 0) {
      const current = queue.shift();
      for (const dir of DIRS) {
        const next = { x: current.x + dir.x, z: current.z + dir.z };
        const key = `${next.x},${next.z}`;
        if (!this._inBounds(next) || blocked.has(key) || seen.has(key)) continue;
        seen.add(key);
        queue.push(next);
      }
    }

    return seen.size;
  }

  _inBounds(pos) {
    return pos.x >= 0 && pos.x < this.gridSize && pos.z >= 0 && pos.z < this.gridSize;
  }

  _reconstructPath(node) {
    const path = [];
    let current = node;
    while (current.parent) {
      path.unshift(current.pos);
      current = current.parent;
    }
    return path;
  }
}
