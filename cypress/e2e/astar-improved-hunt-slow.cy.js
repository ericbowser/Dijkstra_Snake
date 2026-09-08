/**
 * Slower A* hunt recording (~half the full-run tick rate).
 * Ends on game over or at 14.80 minutes, whichever comes first.
 * Video: cypress/videos/improved-astar-hunt-slow.mp4
 */
const RECORD_MS = Math.round(14.8 * 60 * 1000);
const POST_DEATH_HOLD_MS = 1000;
/** Half of the full-run 96 Hz — about half as fast. */
const TEST_TICK_HZ = 48;

function setBoardParallelCamera(win) {
  const rig = win.__game.cameraRig;
  const phi = 0.45;
  const theta = 0;
  rig.phi = phi;
  rig.targetPhi = phi;
  rig.theta = theta;
  rig.targetTheta = theta;
  rig.psi = 0;
  rig.targetPsi = 0;
  rig._applyPosition();
}

function pressKey(code) {
  cy.get('body').trigger('keydown', { code });
}

function waitForDeathOrRecordCap() {
  cy.window().then({ timeout: RECORD_MS + 30000 }, (win) =>
    new Cypress.Promise((resolve) => {
      const started = Date.now();
      const poll = () => {
        const over =
          win.__game?.state === 'gameover' || win.__game?.controller?.gameOver;
        if (over || Date.now() - started >= RECORD_MS) {
          resolve();
          return;
        }
        requestAnimationFrame(poll);
      };
      poll();
    })
  );
}

beforeEach(() => {
  cy.viewport(1920, 1080);
  Cypress.config('defaultCommandTimeout', RECORD_MS + 60000);
});

describe('Dijkstra Snake — improved A* hunt (slow)', () => {
  it('records hunt gameplay at half speed, capped at 14.80 minutes', () => {
    cy.visit('/');

    cy.get('#scene-root canvas', { timeout: 10000 }).should('be.visible');
    cy.window().its('__game').should('exist');

    pressKey('Space');
    pressKey('KeyM');
    cy.get('#ai-status', { timeout: 5000 }).should('contain.text', 'A*:');

    cy.window().then((win) => {
      expect(win.__game.controller.mode).to.eq('hunt');
      win.__game.gameLoop.setTickRate(TEST_TICK_HZ);
      win.__game.ui.setSpeed(TEST_TICK_HZ / 6);
      setBoardParallelCamera(win);
    });

    cy.get('#ai-status', { timeout: 10000 })
      .invoke('text')
      .should('match', /A\*: (Hunting|Surviving)/);

    waitForDeathOrRecordCap();

    cy.wait(POST_DEATH_HOLD_MS);

    cy.get('#score')
      .invoke('text')
      .then((text) => {
        expect(Number(text)).to.be.greaterThan(0);
      });
  });
});
