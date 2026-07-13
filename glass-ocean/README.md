# PROJECT GLASS OCEAN

A single-page presentation website for the Bat Bridge Partners × The Metals Company
Cisco capstone pitch. Slides "sink" into three full-screen ocean simulations and
surface back out. Built with Vite + vanilla JS + Three.js — fully static, no backend.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). Use a Chromium-based
browser for the live presentation.

## Keyboard controls (cheat sheet)

| Key | Action |
| --- | --- |
| `→` / `space` / `PageDown` | Advance — through EVERYTHING (slides and sim beats). This is what the clicker sends. |
| `←` / `PageUp` | Step back |
| `S` | **Escape hatch** — instantly bail out of any simulation to the next slide |
| `R` | Restart the robot demo (resets counter, plume, ledger) |
| `Home` | Jump to the title slide |
| mouse + click / `Enter` | (Robot sim only) aim and collect a nodule |
| hold `W` | (Robot sim only) thruster boost — fills the plume meter and triggers AUTO-THROTTLE |

The full press-by-press cue list is in [PRESENTER_NOTES.md](./PRESENTER_NOTES.md).

## Standalone demo routes

For hands-on laptop time with the judges after the pitch:

- `/#/robot` — loops the interactive harvesting stage endlessly (`R` restarts)
- `/#/bridge` — the Glass Bridge (arrows step the tamper beat)
- `/#/sharks` — the Zero Trust threat view (arrows step the three attacks)

## Build & deploy (GitHub Pages)

```bash
npm run build   # outputs static site to dist/
```

The build uses relative paths (`base: './'`), so `dist/` works from any subpath.

1. Push this project to a GitHub repo.
2. Either enable **Pages → Deploy from a branch** and push `dist/` to a
   `gh-pages` branch (`npx gh-pages -d dist` after `npm i -D gh-pages`), or use
   the Pages "GitHub Actions → Static HTML" workflow pointed at `dist/`.
3. The site is fully static — Netlify/Vercel also work: just drag-and-drop `dist/`.

**Rehearse on the final deployed URL** — always load the page once on the
presentation machine beforehand so everything is cached.

## Troubleshooting: projector / display scaling

If the projector output looks laggy or soft: (1) set the laptop display mode to
**mirror at 1920×1080** rather than a higher native resolution — the renderer caps
its pixel ratio but the OS compositor can still struggle at 4K; (2) make the
browser fullscreen (`F11` / `⌃⌘F`) *before* the title slide so no chrome flashes
mid-show; (3) if frame rate still dips, append `?lite` to the URL — it halves
particle counts and drops the pixel ratio to 1.0 with no loss of content; (4) if a
simulation ever misbehaves live, press `S` — it cuts invisibly to the next slide.
