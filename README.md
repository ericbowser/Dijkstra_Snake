# Dijkstra Snake

A 3D Snake game with an A* pathfinding AI, built directly on Three.js.

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

## Controls

- **W A S D** — move the snake (manual mode only)
- **↑ / ↓** — tilt camera from bird's-eye toward an angled perspective view
- **← / →** — rotate camera around the board
- **space** — start the round; restarts after game over
- **M** — toggle between manual control and the A* AI

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
    UIController.js        # owns DOM updates (score, status) — the only file that touches the DOM
  game/
    Board.js               # board mesh + grid overlay + center point
    CameraRig.js            # bird's-eye camera with tilt control
    Snake.js                 # owns grid positions + mesh, delegates visuals to the factory
    SnakeSegmentFactory.js    # builds head/body/tail meshes (procedural, no art files)
    Food.js                    # food pickup: position + pulsing mesh + respawn logic
    GameController.js          # game rules: direction, collision, eating, scoring, mode switch
    Pathfinder.js               # pure A* search + flood-fill, no game/rendering knowledge
    SnakeAI.js                  # strategy: hunt food when safe, chase tail when not
```

## Status

Fully playable: manual WASD control, A* AI with flood-fill safety checking
(hunts food when safe, chases its own tail to buy space otherwise), M to
switch modes, space to start/restart, collision, scoring, and game over.

## How the AI works

Each tick, `SnakeAI` asks `Pathfinder` for the shortest route to the food
(A* search, Manhattan-distance heuristic). Before committing to that path,
it simulates taking the first step and runs a flood-fill from the new head
position to count how many cells would still be reachable.

- If at least half the snake's body length is still reachable, it commits
  to the food path (`AI: Hunting`).
- If not, it abandons food and pathfinds to its own tail instead, buying
  time and space rather than boxing itself in (`AI: Surviving`).
- If neither path exists, it falls back to any safe adjacent cell.

## Known limitations

Flood-fill only verifies safety for the *next* move — it can't see far
enough ahead to know whether a currently-open path will still be open
several moves later. In practice the snake plays very well early on but
can still trap itself once it gets long enough that the board fills up.
A Hamiltonian-cycle strategy would eliminate this entirely (guaranteed no
self-trapping) at the cost of looking less "intelligent" — a reasonable
next step if this project keeps growing.

## Design principles

The codebase deliberately follows SOLID:

- **Single responsibility** — every file in `core/` and `game/` does
  exactly one job (e.g. `Pathfinder` only searches grids, `UIController`
  is the only file that touches the DOM).
- **Open/closed** — `InputManager` maps raw keys to named actions, so new
  bindings never require touching the code that consumes them.
- **Dependency inversion** — `GameController` is handed a `Snake`, `Food`,
  and `SnakeAI` rather than constructing them; `Game.js` is the only
  composition root that wires concrete pieces together.
