/**
 * Starts Vite (or reuses one already on PORT), then runs the A* hunt
 * Cypress spec in headed Chrome. Avoids start-server-and-test/wmic.
 */
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';

const PORT = 5188;
const BASE = `http://localhost:${PORT}`;
const SPEC = 'cypress/e2e/astar-improved-hunt.cy.js';

function portOpen(port) {
  return new Promise((resolve) => {
    const sock = createConnection({ port, host: '127.0.0.1' });
    sock.once('connect', () => {
      sock.end();
      resolve(true);
    });
    sock.once('error', () => resolve(false));
  });
}

function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { redirect: 'manual' });
        if (res.ok || res.status === 304) {
          resolve();
          return;
        }
      } catch {
        /* not up yet */
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

function run(cmd, args) {
  return spawn(cmd, args, { stdio: 'inherit', shell: true });
}

let vite = null;
const alreadyUp = await portOpen(PORT);

if (alreadyUp) {
  console.log(`Reusing dev server on ${BASE}`);
} else {
  vite = run('npx', ['vite', '--port', String(PORT), '--strictPort']);
}

try {
  await waitForServer(BASE);

  const cypress = run('npx', [
    'cypress',
    'run',
    '--headed',
    '--browser',
    'chrome',
    '--config',
    `baseUrl=${BASE},viewportWidth=1920,viewportHeight=1080`,
    '--spec',
    SPEC
  ]);

  const code = await new Promise((resolve) => {
    cypress.on('exit', (c) => resolve(c ?? 1));
  });

  if (vite) vite.kill('SIGTERM');
  process.exit(code);
} catch (err) {
  console.error(err.message);
  if (vite) vite.kill('SIGTERM');
  process.exit(1);
}
