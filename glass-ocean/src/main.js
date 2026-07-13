import './styles.css'
import { Stage } from './stage.js'
import { createSlides } from './slides.js'
import { SEQUENCE } from './sequence.js'
import { Deck } from './deck.js'
import { createBridgeSim } from './sims/bridge.js'
import { createRobotSim } from './sims/robot.js'
import { createSharksSim } from './sims/sharks.js'

const stage = new Stage(document.getElementById('canvas-host'))

const sims = {
  bridge: createBridgeSim({ stage, overlayEl: document.getElementById('overlay-bridge') }),
  robot: createRobotSim({ stage, overlayEl: document.getElementById('overlay-robot') }),
  sharks: createSharksSim({ stage, overlayEl: document.getElementById('overlay-sharks') }),
}
for (const sim of Object.values(sims)) stage.resizeHandlers.push(sim.resize)

const route = location.hash.match(/^#\/(bridge|robot|sharks)/)?.[1]
window.addEventListener('hashchange', () => location.reload())

if (route) {
  startStandalone(route)
} else {
  const slides = createSlides(document.getElementById('slide-layer'))
  const deck = new Deck({
    stage,
    slides,
    sims,
    sequence: SEQUENCE,
    dotsEl: document.getElementById('dots'),
  })
  deck.start()
}

/* ---------- standalone sim routes (hands-on laptop time) ---------- */
function startStandalone(id) {
  const sim = sims[id]
  const hint = document.getElementById('hint')
  hint.classList.remove('hidden')
  sim.enter({ standalone: true })
  sim.descend.y = 0
  stage.setSim(sim)
  sim.overlayEl.classList.add('visible')

  if (id === 'robot') {
    // loop Stage B endlessly for judges
    sim.setStage(5)
    hint.textContent = 'aim: mouse · collect: click / Enter · boost: hold W · restart: R'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') sim.restart()
    })
  } else {
    let s = 0
    sim.setStage(0)
    const count = sim.stageCount
    hint.textContent = '→ / space: next beat · ← : previous · R: restart'
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        s = (s + 1) % count
        if (s === 0) sim.enter({ standalone: true })
        sim.setStage(s)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        s = Math.max(0, s - 1)
        sim.setStage(s)
      } else if (e.key === 'r' || e.key === 'R') {
        s = 0
        sim.enter({ standalone: true })
        sim.setStage(0)
      }
    })
  }
}
