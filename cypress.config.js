import { renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'cypress';

const VIDEO_RENAMES = {
  'astar-improved-hunt.cy.js': 'improved-astar-hunt.mp4',
  'astar-improved-hunt-slow.cy.js': 'improved-astar-hunt-slow.mp4'
};

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: true,
    trashAssetsBeforeRuns: false,
    supportFile: false,
    setupNodeEvents(on) {
      on('after:spec', (spec, results) => {
        if (!results?.video) return;
        const name = spec.name || spec.relative?.split(/[/\\]/).pop();
        const destName = VIDEO_RENAMES[name];
        if (!destName) return;
        const dest = join(dirname(results.video), destName);
        renameSync(results.video, dest);
      });
    }
  }
});
