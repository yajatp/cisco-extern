/**
 * A full-screen bubble transition that completely covers the screen on each
 * forward slide change: a curtain of ~30 big bubbles rides an opaque wash that
 * ramps to full cover, hides the slide swap underneath, then clears to reveal
 * the next slide. Few, large bubbles → cheap to draw, no lag.
 *
 * Runs its own rAF only during a transition, then goes idle.
 */
export function createBubbles() {
  const canvas = document.createElement('canvas')
  canvas.id = 'bubble-layer'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  let W = 0
  let H = 0
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

  function resize() {
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  const DUR = 1.6 // whole transition length (s)
  const COVER_IN = 0.42 // wash reaches full opacity by here — safe to swap the slide
  const HOLD_END = 0.85 // fully covered through here, then it clears

  let bubbles = []
  let t = 0 // elapsed seconds within the current transition
  let raf = 0
  let last = 0
  let coverCb = null
  let coverFired = false

  function spawn() {
    bubbles = []
    // Densely pack the screen: enough bubbles of a roughly uniform size that
    // they overlap edge-to-edge with no gaps.
    const n = Math.round((W * H) / 5000)
    for (let i = 0; i < n; i++) {
      const r = 64 + Math.random() * 30 // ~64–94px, roughly uniform
      bubbles.push({
        x: Math.random() * W,
        y: Math.random() * (H + 300) - 100,
        r,
        vy: 40 + Math.random() * 110,
        phase: Math.random() * Math.PI * 2,
        wob: 5 + Math.random() * 12,
        wobRate: 1 + Math.random() * 2,
      })
    }
  }

  /** Opacity of the covering wash across the transition (0 → 1 → 0). */
  function washAlpha(tt) {
    if (tt < COVER_IN) return tt / COVER_IN
    if (tt < HOLD_END) return 1
    return Math.max(0, 1 - (tt - HOLD_END) / (DUR - HOLD_END))
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    t += dt
    ctx.clearRect(0, 0, W, H)

    // 1) the opaque wash that hides the slide swap
    const wa = washAlpha(t)
    if (wa > 0) {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, `rgba(238, 249, 253, ${wa})`)
      g.addColorStop(1, `rgba(200, 230, 242, ${wa})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }

    // 2) once fully covered, swap the slide underneath (caller's callback)
    if (!coverFired && t >= COVER_IN) {
      coverFired = true
      coverCb && coverCb()
    }

    // 3) big bubbles riding on top — fade in fast, out with the wash
    const ba = Math.min(1, t / 0.25) * Math.min(1, Math.max(0, (DUR - t) / 0.55))
    if (ba > 0.01) {
      for (const b of bubbles) {
        b.y -= b.vy * dt
        b.phase += b.wobRate * dt
        drawBubble(b.x + Math.sin(b.phase) * b.wob, b.y, b.r, ba)
      }
    }

    if (t < DUR) {
      raf = requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, W, H)
      bubbles = []
      raf = 0
    }
  }

  function drawBubble(x, y, r, a) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)

    // translucent body
    ctx.fillStyle = `rgba(232, 247, 252, ${a * 0.35})`
    ctx.fill()

    // soft darker inner edge for ring definition
    ctx.lineWidth = Math.max(2, r * 0.05)
    ctx.strokeStyle = `rgba(120, 168, 190, ${a * 0.45})`
    ctx.stroke()

    // crisp bright rim
    ctx.lineWidth = Math.max(1.5, r * 0.028)
    ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.9})`
    ctx.stroke()

    // specular highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.5})`
    ctx.beginPath()
    ctx.arc(x - r * 0.3, y - r * 0.32, Math.max(3, r * 0.13), 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Play one covering bubble transition. `onCover` (optional) fires the instant
   * the wash is fully opaque, so the caller can swap the slide while it's hidden.
   */
  function burst(onCover) {
    spawn()
    t = 0
    coverCb = onCover
    coverFired = false
    last = performance.now()
    if (!raf) raf = requestAnimationFrame(frame)
  }

  /** Dev-only: hold the fully-covered peak so it can be eyeballed headless. */
  function preview() {
    const draw = () => {
      spawn()
      ctx.clearRect(0, 0, W, H)
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, 'rgba(238, 249, 253, 1)')
      g.addColorStop(1, 'rgba(200, 230, 242, 1)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      for (const b of bubbles) drawBubble(b.x, b.y, b.r, 1)
    }
    draw()
    setInterval(draw, 200)
  }

  return { burst, preview }
}
