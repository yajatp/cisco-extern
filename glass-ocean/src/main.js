import './styles.css'
import { Stage } from './stage.js'
import { createSlides } from './slides.js'
import { SEQUENCE } from './sequence.js'
import { Deck } from './deck.js'
import { createDemos } from './demos.js'
import { createBubbles } from './bubbles.js'

// Ambient "deep water + marine snow" background painted behind the slides.
new Stage(document.getElementById('canvas-host'))

const slides = createSlides(document.getElementById('slide-layer'))
const demos = createDemos()
const bubbles = createBubbles()

const deck = new Deck({
  slides,
  demos,
  bubbles,
  sequence: SEQUENCE,
  dotsEl: document.getElementById('dots'),
})
deck.start()

// Dev-only probes for headless capture.
const params = new URLSearchParams(location.search)
if (params.get('bubbles') === 'preview') {
  setTimeout(() => bubbles.preview(), 2600)
}
const cue = params.get('cue')
if (cue != null) {
  // Jump straight to a cue's resting state (no transition pile-up).
  setTimeout(() => deck.goTo(parseInt(cue, 10), { instant: true }), 1800)
  // ?cue=N&keys=M then fires M real ArrowRight presses to exercise the live wiring.
  const keys = parseInt(params.get('keys') || '0', 10)
  if (keys > 0) {
    let k = keys
    const press = () => {
      if (k-- <= 0) return
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      setTimeout(press, 1000)
    }
    setTimeout(press, 3500)
  }
}
const auto = params.get('advance')
if (auto) {
  let n = parseInt(auto, 10)
  const tick = () => {
    if (n-- <= 0) return
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    setTimeout(tick, 900)
  }
  setTimeout(tick, 1800)
}
