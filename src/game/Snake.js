import * as THREE from 'three';
import { SnakeSegmentFactory } from './SnakeSegmentFactory.js';

/** Yaw around Y so a +X-facing mesh points from `from` toward `to`. */
function yawToward(from, to) {
  return Math.atan2(-(to.z - from.z), to.x - from.x);
}

/**
 * Owns the snake's grid positions and their corresponding meshes.
 * Delegates mesh creation to SnakeSegmentFactory (DIP) — Snake itself
 * only knows grid coordinates and which index is head/body/tail, never
 * how a segment is actually built or styled.
 */
export class Snake {
  constructor({ cellSize, positions, factory = new SnakeSegmentFactory() }) {
    this.cellSize = cellSize;
    this.positions = positions; // array of {x, z} grid coords, index 0 = head
    this.factory = factory;

    this.mesh = new THREE.Group();
    this._build();
  }

  get head() {
    return this.positions[0];
  }

  /**
   * Advances the snake to a new head position. Pass { grow: true }
   * on the tick the snake eats food to keep the tail in place.
   */
  move(newHeadPos, { grow = false } = {}) {
    this.positions = [newHeadPos, ...this.positions];
    if (!grow) this.positions.pop();
    this._build();
  }

  /**
   * Park the head on the cell that killed it (body/tail/off-board)
   * without vacating the tail, so the freeze-frame shows the overlap.
   */
  crashInto(pos) {
    this.positions = [pos, ...this.positions];
    this._build();
  }

  _build() {
    this.mesh.clear();

    this.positions.forEach((pos, i) => {
      let segment;

      if (i === 0) {
        segment = this.factory.createHead();
      } else if (i === this.positions.length - 1) {
        segment = this.factory.createTail();
      } else {
        const t = i / Math.max(1, this.positions.length - 2);
        segment = this.factory.createBody(t);
      }

      segment.position.set(
        pos.x * this.cellSize,
        this.cellSize * 0.38,
        pos.z * this.cellSize
      );

      // Factory meshes face +X; yaw head/tail to match travel so the
      // hood and pointer actually point the way the snake is going.
      if (i === 0 && this.positions[1]) {
        segment.rotation.y = yawToward(this.positions[1], pos);
      } else if (i === this.positions.length - 1 && this.positions[i - 1]) {
        segment.rotation.y = yawToward(this.positions[i - 1], pos);
      }

      this.mesh.add(segment);
    });
  }
}
