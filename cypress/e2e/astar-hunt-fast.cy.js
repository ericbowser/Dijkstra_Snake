/**
 * Brief A* hunt recording: max tick rate, fixed camera, minimal Cypress
 * polling overhead so the round finishes quickly.
 */
const GAME_OVER_TIMEOUT_MS = 1800000;
const POST_DEATH_HOLD_MS = 1500;
const TEST_TICK_HZ = 140;

/** Grid edges axis-aligned on screen; shallow look down onto the board. */
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

function waitForAStarGameOver() {
  cy.window().then({ timeout: GAME_OVER_TIMEOUT_MS }, (win) =>
    new Cypress.Promise((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        const game = win.__game;
        if (game?.state === 'gameover' || game?.controller?.gameOver) {
          resolve();
          return;
        }
        if (Date.now() - started > GAME_OVER_TIMEOUT_MS) {
          reject(new Error(`Timed out after ${GAME_OVER_TIMEOUT_MS}ms waiting for A* game over`));
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
  Cypress.config('defaultCommandTimeout', GAME_OVER_TIMEOUT_MS);
});

describe('Dijkstra Snake — A* hunt (full)', () => {
  it('plays hunt mode to death with board-parallel camera', () => {
    const consoleErrors = [];
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((...args) => {
        consoleErrors.push(args.join(' '));
      });
    });

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

    waitForAStarGameOver();

    cy.get('#ai-status').should('contain.text', 'Game over');
    cy.wait(POST_DEATH_HOLD_MS);

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
