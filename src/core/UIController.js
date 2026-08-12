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
export class UIController {
  constructor({ scoreEl, statusEl }) {
    this.scoreEl = scoreEl;
    this.statusEl = statusEl;
  }

  setScore(score) {
    if (this.scoreEl) this.scoreEl.textContent = String(score);
  }

  setStatus(status) {
    if (this.statusEl) this.statusEl.textContent = status;
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
}
