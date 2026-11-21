# Zero-G Thrust Runner

A browser-based space runner built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step, no dependencies.

You pilot a small ship through a starfield while avoiding laser gates. Fire the thrusters to counteract gravity, glide through the gaps, and rack up as much distance as you can before the hull is breached.

## Features

- **Thrust physics** — gentle gravity with smooth upward acceleration and a capped vertical speed so movement stays controllable
- **Increasing difficulty** — speed ramps up with distance, gate gaps shrink, and gates begin moving vertically past 300 m
- **Particle effects** — thruster exhaust, explosion debris, and a parallax starfield
- **Persistent high score** — your best distance is saved in `localStorage`
- **Frame-rate independent** — the game loop normalizes delta time to 60 FPS, so speed is consistent across monitors
- **Keyboard, mouse, and touch input**

## Controls

| Input | Action |
|---|---|
| **Space** or **Left Click** / **Touch** (hold) | Fire thrusters / start / retry |
| Release | Stop thrusting (gravity takes over) |

Touch the canvas to start. Hit a laser gate, the ceiling, or the floor and the run ends — press **Space** or **Click** to retry.

## Running the game

No installation required. Either:

1. **Open `index.html` directly** in any modern browser, or
2. Serve the folder locally:

```sh
npx serve .
# or
python -m http.server
```

Then visit `http://localhost:3000` (or the port shown in your terminal).

## Project structure

```
├── index.html   # Page shell: HUD, canvas, and hint text
├── style.css    # Layout and neon-glow styling
├── script.js    # Game loop, physics, spawning, collision, and rendering
└── README.md
```

## How it works

- `requestAnimationFrame` drives a single `loop()` that computes a `dt` factor normalized to 60 FPS.
- `update(dt)` moves stars and particles, applies gravity/thrust, spawns laser gates, and checks collisions.
- `draw()` renders the starfield, glowing gates, exhaust particles, the ship, and the start/game-over overlays.
- Game state is a simple three-value machine: `START` → `PLAYING` → `GAMEOVER`.
