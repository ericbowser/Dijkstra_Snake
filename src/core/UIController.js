/**
 * Owns updates to the DOM overlay (score, status). The only place
 * that touches these specific DOM nodes — game logic never reaches
 * into the DOM directly (SRP/DIP): it calls these methods instead.
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
}
