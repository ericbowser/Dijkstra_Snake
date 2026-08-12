# Dijkstra Snake

A 3D Snake game with A* hunt and Hamiltonian live AIs, built directly on Three.js.

## Stack

- **Three.js** — 3D scene, rendering, camera (game engine layer)
- **Vite** — dev server and bundler
- **Tailwind CSS** — UI overlay only (score, controls) — the game canvas itself is vanilla JS + Three.js

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Testing

An end-to-end Cypress test watches the A* AI play a full round
unattended: it starts the game, demonstrates camera tilt/rotate, hands
control to the AI, and lets it play until it actually dies (no fixed
timer — it waits on the "Game over" status, capped at 5 minutes as a
safety net for the test runner). It then asserts the AI scored during
the run.

```bash
npm run test:e2e
```

Boots the dev server and runs headlessly. Cypress records video of
every run to `cypress/videos/` — that clip is the AI playing itself
end-to-end, camera moves and all, ready to share.

To watch the browser while it runs:

```bash
npm run test:e2e:headed
```

To run interactively step-by-step instead:

```bash
npm run cypress:open
```

## Controls

- **W A S D** — move the snake (manual mode only)
- **↑ / ↓** — tilt camera from bird's-eye toward an angled perspective view
- **← / →** — rotate camera around the board
- **space** — start the round; restarts after game over
- **M** — cycle modes: manual → A* hunt → live (Hamiltonian)

## Project structure

Each file has one job (SRP). `Game.js` is the only place that knows
how they connect (composition root / dependency injection) — nothing
else reaches across pieces directly.

```
src/
  main.js               # bootstrap only — creates Game, calls start()
  Game.js                # composition root: wires everything together
  core/
    SceneManager.js       # owns the Three.js Scene
    RendererManager.js    # owns the WebGLRenderer + resize
    Lighting.js           # builds the light rig
    InputManager.js       # translates key events into named actions
    GameLoop.js            # fixed-tick game clock, decoupled from render loop
    UIController.js        # owns DOM updates + game-state-to-label mapping
  game/
    Board.js               # pastel checkerboard + rim + center point
    CameraRig.js            # bird's-eye camera with tilt/rotate control
    Snake.js                 # owns grid positions + mesh, delegates visuals to the factory
    SnakeSegmentFactory.js    # builds head/body/tail meshes (procedural, no art files)
    Food.js                    # food pickup: position + pulsing mesh + respawn logic
    GameController.js          # game rules: direction, collision, eating, scoring, mode cycle
    RoundManager.js             # round lifecycle: idle -> running -> game over -> restart
    Pathfinder.js                # pure A* search + flood-fill, no game/rendering knowledge
    SnakeAI.js                   # A* hunt: food when safe, chase tail when not
    SurvivalAI.js                # live mode: Hamiltonian cycle + safe shortcuts
    HamiltonianCycle.js           # builds the even-height cycle SurvivalAI follows
    directions.js                 # shared 4-direction helpers used by pathfinding + AIs
  palette.js               # shared pastel colors for board, lights, snake, food
```

## Status

Fully playable: manual WASD, two AI modes (A* hunt and Hamiltonian live),
M to cycle them, space to start/restart, collision, scoring, and game over.

## How the AIs work

### A* hunt (`SnakeAI`)

Each tick, asks `Pathfinder` for the shortest route to the food (A*,
Manhattan-distance heuristic). Before committing, it simulates the first
step and flood-fills from the new head to count reachable cells.

- If at least half the snake's body length is still reachable, it commits
  to the food path (`A*: Hunting`).
- If not, it pathfinds to its own tail instead (`A*: Surviving`).
- If neither path exists, it falls back to any safe adjacent cell.

### Live (`SurvivalAI`)

Follows a Hamiltonian cycle around the board — a closed path that visits
every cell of an even-height rectangle exactly once. Because the snake's
body is always a contiguous arc of that cycle, the next cycle cell is
either empty or the tail about to vacate, so it cannot trap itself.

Safe shortcuts jump ahead along the empty arc toward food (`Live:
Shortcut`) so it still scores instead of slowly touring the whole board
every pellet. Food on the leftover last row (odd×odd grids have no
full-board cycle) is ignored so the snake never steps off the cycle.

Once the body fills the cycle it can crawl forever by always stepping
onto its own tail.

## Known limitations

A* hunt's flood-fill only verifies the *next* move, so that mode still
boxes itself in once the snake gets long. Live mode avoids that on the
cycle, but the 25×25 board is odd×odd (no full-grid cycle exists), so
one row is omitted. Food that spawns there is ignored — the snake keeps
circulating without growing until a later pellet lands on-cycle.

## Design principles

The codebase deliberately follows SOLID:

- **Single responsibility** — every file in `core/` and `game/` does
  exactly one job. `RoundManager` owns the idle/running/game-over
  lifecycle so `Game.js` is purely a composition root; `UIController`
  is the only place that maps game state to display text, so
  `GameController` only ever emits structured state, never copy.
- **Open/closed** — `InputManager` maps raw keys to named actions, so new
  bindings never require touching the code that consumes them.
  `SnakeSegmentFactory` and `UIController`'s status-label map work the
  same way: extending either never touches the classes that use them.
- **Dependency inversion** — `GameController` is handed a `Snake`, `Food`,
  and an `ais` map (`hunt` / `survive`) rather than constructing them;
  `Game.js` is the only composition root that wires concrete pieces
  together. `Game` exposes `state`/`snake`/`food`/`controller` as
  getters delegating to `RoundManager`, so external consumers (DevTools,
  Cypress) depend on a stable shape even though the internal split
  changed.
