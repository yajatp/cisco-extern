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
  let activeN = null // which demo currently owns the clicker, or null
  let relaying = false // true while we inject a synthetic key, so it isn't echoed

  const NAV_KEYS = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'ArrowUp', 'ArrowDown']
  // ↑/↓ are global jump-to-first/last hatches the deck owns; a demo never handles
  // them, so they must relay up even from the active demo (unlike the beat keys).
  const HATCH_KEYS = ['ArrowUp', 'ArrowDown']

  // Keyboard-nav lifeline: a preloaded (or clicked) demo iframe can quietly grab
  // focus, and then key presses land in the iframe instead of the parent window
  // — the deck goes deaf until you mouse-click the page. Since the demos are
  // same-origin, relay any real nav key pressed while an *inactive* frame holds
  // focus up to the parent window so the deck always hears it. (When the frame
  // IS the active demo it drives its own beats, so relaying would double-fire.)
  function wireRelay(n, f) {
    if (!f) return
    const attach = () => {
      let cw
      try {
        cw = f.contentWindow
      } catch {
        return // cross-origin — can't attach; focus reclaim still covers us
      }
      if (!cw) return
      try {
        cw.addEventListener('keydown', (e) => {
          if (relaying) return // a key we injected — don't echo it back
          if (!NAV_KEYS.includes(e.key)) return
          // The active demo drives its own beat keys — don't echo those — but the
          // global ↑/↓ jump hatches are never handled by a demo, so always relay.
          if (activeN === n && !HATCH_KEYS.includes(e.key)) return
          window.dispatchEvent(new KeyboardEvent('keydown', { key: e.key }))
        })
      } catch {
        /* cross-origin (shouldn't happen for same-origin demos) */
      }
    }
    f.addEventListener('load', attach)
    attach() // in case it's already loaded
  }
  for (const n of Object.keys(frames)) wireRelay(Number(n), frames[n])

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
    try {
      f.blur() // let focus fall back to the parent as we leave the demo
    } catch {}
    clearTimeout(hideTimers[n])
    hideTimers[n] = setTimeout(() => f.classList.remove('live'), 1650) // stop painting after the fade
  }

  /** Relay a clicker press into a demo's own keyboard handler. */
  function forwardKey(n, key) {
    const w = frames[n]?.contentWindow
    if (!w) return
    try {
      relaying = true
      w.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    } catch (e) {
      /* iframe not ready yet — the press is simply dropped */
    } finally {
      relaying = false
    }
  }

  /** Mark which demo owns the clicker (null = none), so relay knows when to stay quiet. */
  function setActive(n) {
    activeN = n
  }

  /** Give a demo iframe keyboard focus so mouse- and key-driven beats both land in it. */
  function focus(n) {
    try {
      frames[n]?.focus()
    } catch {}
  }

  return { frames, show, hide, forwardKey, setActive, focus }
}
