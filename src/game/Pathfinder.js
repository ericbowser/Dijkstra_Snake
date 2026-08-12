import { CARDINAL_DIRECTIONS as DIRS } from './directions.js';

export class Pathfinder {
  constructor({ gridSize }) {
    this.gridSize = gridSize;
  }

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
