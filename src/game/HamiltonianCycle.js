import { cellKey } from './directions.js';

/**
 * Builds a Hamiltonian cycle on a W × H rectangle where H is even.
 * A cycle exists on a grid graph iff at least one side is even — and
 * 25×25 is odd×odd, so the leftover last row is omitted. SurvivalAI
 * treats those cells as off-cycle detours.
 *
 * Construction (H even, W ≥ 2):
 *   1. Row 0 left → right, including x = 0
 *   2. Rows 1..H-1 snake on x = 1..W-1 (odd rows right → left)
 *   3. Column 0 back up from (0, H-1) to (0, 1), which is adjacent
 *      to the start (0, 0)
 */
export function buildHamiltonianCycle(gridSize) {
  const width = gridSize;
  const height = gridSize % 2 === 0 ? gridSize : gridSize - 1;
  const cycle = [];

  for (let x = 0; x < width; x += 1) cycle.push({ x, z: 0 });

  for (let z = 1; z < height; z += 1) {
    if (z % 2 === 1) {
      for (let x = width - 1; x >= 1; x -= 1) cycle.push({ x, z });
    } else {
      for (let x = 1; x < width; x += 1) cycle.push({ x, z });
    }
  }

  for (let z = height - 1; z >= 1; z -= 1) cycle.push({ x: 0, z });

  if (cycle.length !== width * height) {
    throw new Error(`Hamiltonian cycle length ${cycle.length} != ${width * height}`);
  }

  return { cycle, width, height };
}

export function indexCycle(cycle) {
  const index = new Map();
  cycle.forEach((pos, i) => index.set(cellKey(pos), i));
  return index;
}

/** True if walking forward from `from` hits `cell` before (or at) `to`. */
export function onForwardArc(from, cell, to, length) {
  const distToTo = (to - from + length) % length;
  const distToCell = (cell - from + length) % length;
  return distToCell > 0 && distToCell <= distToTo;
}
