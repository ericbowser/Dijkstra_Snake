/**
 * Watches the A* AI play a full round unattended. After start + AI
 * handoff, the camera is steered continuously:
 *
 *  - Up/down hold a near-parallel board view with a slight angle
 *    (not fully flat).
 *  - Left/right orbit so the camera sits behind the head looking
 *    along the snake → food line, keeping them roughly co-linear
 *    on screen.
 *  - A brief tilt-up only if something clips the hard viewport edge.
 *
 * Key presses use e.code (trigger / KeyboardEvent) because
 * InputManager reads e.code, not key maps from .type().
 */
const GAME_OVER_TIMEOUT_MS = 300000;

// Near board-parallel (CameraRig MAX_PHI ≈ 1.52); leave a gap so the
// view is slightly angled rather than flush with the plane.
const PREFERRED_PHI = 1.38;
const PHI_DEADZONE = 0.06;
const THETA_DEADZONE = 0.14;
const HARD_NDC = 0.9;

function pressKey(code) {
  cy.get('body').trigger('keydown', { code });
}

function gridToNdc(camera, cellSize, gx, gz) {
  const v = camera.position.clone().set(gx * cellSize, cellSize * 0.35, gz * cellSize);
  v.project(camera);
  return { x: v.x, y: v.y, z: v.z };
}

/** Shortest signed rotation from `from` to `to` in (-π, π]. */
function shortestAngleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Orbit along snake→food; keep near-parallel tilt; rescue only when
 * the action clips the viewport hard.
 */
function adjustCameraToKeepActionInView(win) {
  const game = win.__game;
  if (!game || game.state !== 'running' || !game.snake || !game.food) return;

  const { cameraRig, board, snake, food } = game;
  const camera = cameraRig.camera;
  const cs = board.cellSize;
  const head = snake.head;
  const foodPos = food.position;

  const points = snake.positions.map((p) => gridToNdc(camera, cs, p.x, p.z));
  points.push(gridToNdc(camera, cs, foodPos.x, foodPos.z));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of points) {
    if (p.z < -1 || p.z > 1) continue;
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const press = (code) => {
    win.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  };

  // Rotate: camera offset on the orbit is (cos θ, sin θ). Align that
  // with (head − food) so we sit behind the snake looking toward food.
  const dx = head.x - foodPos.x;
  const dz = head.z - foodPos.z;
  if (dx !== 0 || dz !== 0) {
    const desiredTheta = Math.atan2(dz, dx);
    const delta = shortestAngleDelta(cameraRig.targetTheta, desiredTheta);
    if (delta > THETA_DEADZONE) {
      press('ArrowRight'); // rotate(+1) → targetTheta up
    } else if (delta < -THETA_DEADZONE) {
      press('ArrowLeft');
    }
  }

  // Screen-edge rescue on yaw if orbit lag leaves a side bare
  if (Number.isFinite(minX)) {
    const midX = (minX + maxX) / 2;
    if (maxX > HARD_NDC || midX > 0.45) press('ArrowLeft');
    else if (minX < -HARD_NDC || midX < -0.45) press('ArrowRight');
  }

  // Tilt: drive toward near-parallel slight angle; only climb if clipping
  const clippingHard =
    Number.isFinite(minX) &&
    (minX < -HARD_NDC || maxX > HARD_NDC || minY < -HARD_NDC || maxY > HARD_NDC);

  if (clippingHard) {
    press('ArrowUp');
  } else if (cameraRig.targetPhi < PREFERRED_PHI - PHI_DEADZONE) {
    press('ArrowDown');
  } else if (cameraRig.targetPhi > PREFERRED_PHI + PHI_DEADZONE) {
    press('ArrowUp');
  }
}

function trackCameraUntilGameOver(startedAt = Date.now()) {
  cy.get('#ai-status').then(($status) => {
    if ($status.text().includes('Game over')) return;

    if (Date.now() - startedAt > GAME_OVER_TIMEOUT_MS) {
      throw new Error(`Timed out after ${GAME_OVER_TIMEOUT_MS}ms waiting for game over while tracking camera`);
    }

    cy.window().then((win) => {
      adjustCameraToKeepActionInView(win);
    });

    cy.wait(200).then(() => {
      trackCameraUntilGameOver(startedAt);
    });
  });
}

beforeEach(() => {
  cy.viewport(1920, 1080);
});

describe('Dijkstra Snake — A* AI gameplay', () => {
  it('starts the round, hands off to the AI, and keeps snake + food in view until game over', () => {
    const consoleErrors = [];
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((...args) => {
        consoleErrors.push(args.join(' '));
      });
    });

    cy.visit('/');

    cy.get('#scene-root canvas', { timeout: 10000 }).should('be.visible');
    cy.get('#ai-status').should('contain.text', 'Press space to start');
    cy.window().its('__game').should('exist');

    pressKey('Space');
    cy.get('#ai-status').should('contain.text', 'Manual');

    pressKey('KeyM');
    cy.get('#ai-status', { timeout: 5000 }).should('contain.text', 'A*:');

    // Kick toward near-parallel (slightly angled); tracker holds phi
    // and orbits so the view runs along the snake → food line.
    for (let i = 0; i < 11; i += 1) {
      pressKey('ArrowDown');
    }

    trackCameraUntilGameOver();
    cy.get('#ai-status').should('contain.text', 'Game over');

    cy.get('#score')
      .invoke('text')
      .then((text) => {
        expect(Number(text)).to.be.greaterThan(0);
      });

    cy.then(() => {
      expect(consoleErrors, `console.error calls during the run: ${consoleErrors.join(' | ')}`).to.have.length(0);
    });
  });
});
