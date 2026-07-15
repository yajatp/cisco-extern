/**
 * The three Claude-designed demos, each embedded full-bleed as a pre-warmed
 * iframe (`public/demos/demo-{n}.dc.html`). The iframes load at page start so
 * the sink into a demo is a cross-fade, never a cold start.
 *
 * Each demo owns its own beats and speaks two messages back to the deck:
 *   - `veritas-demo-next`  → surface forward to the slide after the demo
 *   - `veritas-demo-prev`  → surface backward to the slide before the demo
 * The deck forwards arrow/space presses INTO the active demo so a single
 * clicker stream drives slides, in-demo beats, and the seams between them.
 */
export function createDemos() {
  const frames = {
    1: document.getElementById('demo-1'),
    2: document.getElementById('demo-2'),
    3: document.getElementById('demo-3'),
  }

  const hideTimers = {}

  function show(n) {
    const f = frames[n]
    if (!f) return
    clearTimeout(hideTimers[n])
    f.classList.add('live') // start painting this frame...
    // ...then next frame flip to .active so opacity/transform animate in
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.add('active')))
  }

  function hide(n) {
    const f = frames[n]
    if (!f) return
    f.classList.remove('active') // fade + sink away
    clearTimeout(hideTimers[n])
    hideTimers[n] = setTimeout(() => f.classList.remove('live'), 1650) // stop painting after the fade
  }

  /** Relay a clicker press into a demo's own keyboard handler. */
  function forwardKey(n, key) {
    const w = frames[n]?.contentWindow
    if (!w) return
    try {
      w.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    } catch (e) {
      /* iframe not ready yet — the press is simply dropped */
    }
  }

  return { frames, show, hide, forwardKey }
}
