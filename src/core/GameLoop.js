/**
 * Fixed-tick game clock, decoupled from the render loop. Rendering
 * happens every frame (60fps) regardless of game speed; this drives
 * game logic (snake movement) at its own, independently tunable rate.
 */
export class GameLoop {
  constructor({ tickRateHz = 6, onTick }) {
    this.interval = 1000 / tickRateHz;
    this.onTick = onTick;
    this._accumulator = 0;
    this._lastTime = null;
    this._running = false;
    this._raf = this._raf.bind(this);
  }

  start() {
    this._running = true;
    this._lastTime = performance.now();
    requestAnimationFrame(this._raf);
  }

  stop() {
    this._running = false;
  }

  setTickRate(hz) {
    this.interval = 1000 / hz;
  }

  _raf(now) {
    if (!this._running) return;
    requestAnimationFrame(this._raf);

    const delta = now - this._lastTime;
    this._lastTime = now;
    this._accumulator += delta;

    // Cap catch-up so a slow A* tick at high Hz cannot spiral
    // (one expensive frame would otherwise queue unbounded ticks).
    const maxTicks = 8;
    let ticks = 0;
    while (this._accumulator >= this.interval && ticks < maxTicks) {
      this.onTick();
      this._accumulator -= this.interval;
      ticks += 1;
    }
    if (this._accumulator > this.interval * maxTicks) {
      this._accumulator = 0;
    }
  }
}
