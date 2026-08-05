import { Game } from './Game.js';

const container = document.getElementById('scene-root');
const game = new Game(container);
// Exposed for Cypress / DevTools — camera tracking reads live snake/food.
window.__game = game;
game.start();
