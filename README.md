# Golf Masters

Golf Masters is a portrait-first puzzle golf game for desktop and mobile. The current milestone focuses on the main menu, responsive game shell, a playable solo course, room-code UI, CPU match setup, persistent settings, and on-screen clubhouse questions.

## Technology

- Three.js and WebGL for the menu atmosphere and playable course
- Matter.js for browser-side ball, wall, gate, and wind physics
- Vite for local development and production builds
- Web Audio for synthesized UI, shot, answer, and celebration effects

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm test
npm run build
```

The full PRD is in `Golf-Masters-PRD.md`. Project-specific implementation guidance is in `.agent`.
