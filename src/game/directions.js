/**
 * The four cardinal grid directions, shared by Pathfinder (search)
 * and the AIs (safe-move / shortcut checks) so they can never drift
 * out of sync with each other.
 */
export const CARDINAL_DIRECTIONS = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 }
];

export function cellKey(pos) {
  return `${pos.x},${pos.z}`;
}

export function toDirection(from, to) {
  return { x: to.x - from.x, z: to.z - from.z };
}

export function step(pos, dir) {
  return { x: pos.x + dir.x, z: pos.z + dir.z };
}
