/**
 * A full-screen bubble transition played on each forward slide change: a dense
 * curtain of bubbles fades in across the whole screen, drifts up with a gentle
 * wobble, and dissolves — and the slide underneath is swapped WHILE the bubbles
 * cover it, so the change reads as a wash of water rather than a cut.
 *
 * Runs its own rAF only while bubbles are alive, then goes idle.
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

  const COVER_DELAY = 240 // ms until the curtain is dense enough to hide the swap
  const FADE_IN = 0.16
  const FADE_OUT = 0.5

  let bubbles = []
  let raf = 0
  let last = 0

  function spawn() {
    // count scales with screen area so the whole viewport fills densely
    const n = Math.round((W * H) / 1500)
    for (let i = 0; i < n; i++) {
      const r = 5 + Math.random() * Math.random() * 34 // 5–~39px, skewed small
      bubbles.push({
        x: Math.random() * W,
        y: Math.random() * (H * 1.1) - H * 0.05, // seeded across the whole screen
        r,
        vy: 110 + Math.random() * 210 + r * 4, // gentle upward drift
        phase: Math.random() * Math.PI * 2,
        wob: 5 + Math.random() * 16,
        wobRate: 1.2 + Math.random() * 2.4,
        baseAlpha: 0.6 + Math.random() * 0.4,
        life: 0,
        maxLife: 1.15 + Math.random() * 0.6, // 1.15–1.75s
      })
    }
  }

  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05)
    last = t
    ctx.clearRect(0, 0, W, H)

    for (const b of bubbles) {
      b.life += dt
      b.y -= b.vy * dt
      b.phase += b.wobRate * dt
      const x = b.x + Math.sin(b.phase) * b.wob
      const fin = Math.min(1, b.life / FADE_IN)
      const fout = Math.min(1, Math.max(0, (b.maxLife - b.life) / FADE_OUT))
      const a = b.baseAlpha * fin * fout
      if (a > 0.01) drawBubble(x, b.y, b.r, a)
    }
    bubbles = bubbles.filter((b) => b.life < b.maxLife && b.y + b.r > -8)

    if (bubbles.length) {
      raf = requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, W, H)
      raf = 0
    }
  }

  function drawBubble(x, y, r, a) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)

    // translucent body — noticeably lightens whatever's behind
    ctx.fillStyle = `rgba(224, 244, 251, ${a * 0.28})`
    ctx.fill()

    // soft darker inner edge gives the ring definition on light backgrounds
    ctx.lineWidth = Math.max(1.4, r * 0.11)
    ctx.strokeStyle = `rgba(120, 168, 190, ${a * 0.5})`
    ctx.stroke()

    // crisp bright rim on top
    ctx.lineWidth = Math.max(1, r * 0.06)
    ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.9})`
    ctx.stroke()

    // small off-center specular highlight (cheap — no gradient, so dense fields stay smooth)
    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.5})`
    ctx.beginPath()
    ctx.arc(x - r * 0.3, y - r * 0.32, Math.max(0.8, r * 0.2), 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Play one bubble wash. `onCover` (optional) fires once the curtain is dense,
   * so the caller can swap the slide underneath while it's hidden.
   */
  function burst(onCover) {
    spawn()
    if (onCover) setTimeout(onCover, COVER_DELAY)
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  /** Dev-only: hold a static dense field (via the redraw loop) to eyeball it. */
  function preview() {
    // Static field, redrawn on an interval (resilient to headless resize/idle).
    const draw = () => {
      bubbles = []
      spawn()
      ctx.clearRect(0, 0, W, H)
      for (const b of bubbles) drawBubble(b.x, b.y, b.r, b.baseAlpha)
    }
    draw()
    setInterval(draw, 200)
  }

  return { burst, preview }
}
