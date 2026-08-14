const MODE_PREFIX = { hunt: 'A*', survive: 'Live' };
const AI_STATUS_LABELS = {
  hunting: 'Hunting',
  surviving: 'Surviving',
  trapped: 'Trapped',
  cycling: 'Cycling',
  shortcut: 'Shortcut',
  recovering: 'Recovering'
};

/**
 * Owns updates to the DOM overlay (score, status). The only place
 * that touches these specific DOM nodes — game logic never reaches
 * into the DOM directly (SRP/DIP): it calls these methods instead.
 * Also the only place that knows how game state maps to display
 * copy — GameController reports structured state, this class decides
 * what it reads like.
 */
const CRASH_LABELS = { wall: 'hit wall', self: 'hit self' };

export class UIController {
  constructor({ scoreEl, statusEl, speedEl, lengthEl }) {
    this.scoreEl = scoreEl;
    this.statusEl = statusEl;
    this.speedEl = speedEl;
    this.lengthEl = lengthEl;
  }

  setScore(score) {
    if (this.scoreEl) this.scoreEl.textContent = String(score);
  }

  setLength(length) {
    if (this.lengthEl) this.lengthEl.textContent = String(length);
  }

  setStatus(status) {
    if (this.statusEl) this.statusEl.textContent = status;
  }

  setSpeed(multiplier) {
    if (!this.speedEl) return;
    const rounded = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(1);
    this.speedEl.textContent = `${rounded}×`;
  }

  /**
   * Converts GameController's structured { mode, aiStatus } into the
   * display label ("Manual" / "A*: Hunting" / "Live: Cycling" / etc.).
   * Adding a mode or status only means editing the maps above (OCP).
   */
  setModeStatus({ mode, aiStatus }) {
    if (mode === 'manual') {
      this.setStatus('Manual');
      return;
    }
    const prefix = MODE_PREFIX[mode] || 'AI';
    const fallback = mode === 'survive' ? 'Cycling' : 'Hunting';
    this.setStatus(`${prefix}: ${AI_STATUS_LABELS[aiStatus] || fallback}`);
  }

  /**
   * Freeze-frame copy after a crash. Score/length stay on the HUD;
   * status names the hit so the paused board can be read against it.
   */
  setGameOver({ reason, score, length }) {
    this.setScore(score);
    this.setLength(length);
    const hit = CRASH_LABELS[reason] || 'crashed';
    this.setStatus(`Game over — ${hit} — space to restart`);
  }
}
