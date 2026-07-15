/**
 * A transient bubble sweep played over each forward slide change: a field of
 * translucent bubbles rises up the screen and clears, so the slide swap reads
 * as a breath of water rather than a cut. Runs its own rAF only while bubbles
 * are alive, then goes idle (no cost between transitions).
 */
export function createBubbles() {
  const canvas = document.createElement('canvas')
  canvas.id = 'bubble-layer'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  let W = 0
  let H = 0
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

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

  let bubbles = []
  let raf = 0
  let last = 0

  function spawn() {
    const n = Math.round(48 + Math.random() * 22)
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * Math.random() * 13 // skew toward small
      bubbles.push({
        x: Math.random() * W,
        // stagger start below the screen so they stream in top-to-bottom
        y: H + Math.random() * H * 1.1,
        r,
        vy: 300 + Math.random() * 560 + r * 12, // bigger rise faster
        phase: Math.random() * Math.PI * 2,
        wob: 6 + Math.random() * 20,
        wobRate: 1.5 + Math.random() * 2.5,
        alpha: 0.55 + Math.random() * 0.4,
      })
    }
  }

  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05)
    last = t
    ctx.clearRect(0, 0, W, H)

    for (const b of bubbles) {
      b.y -= b.vy * dt
      b.phase += b.wobRate * dt
      const x = b.x + Math.sin(b.phase) * b.wob
      // soften over the top third as they reach the surface
      const fade = b.y < H * 0.32 ? Math.max(0, b.y / (H * 0.32)) : 1
      drawBubble(x, b.y, b.r, b.alpha * fade)
    }
    bubbles = bubbles.filter((b) => b.y + b.r > -4)

    if (bubbles.length) {
      raf = requestAnimationFrame(frame)
    } else {
      ctx.clearRect(0, 0, W, H)
      raf = 0
    }
  }

  function drawBubble(x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r)
    g.addColorStop(0, `rgba(223, 244, 250, ${a * 0.08})`)
    g.addColorStop(0.68, `rgba(180, 226, 240, ${a * 0.2})`)
    g.addColorStop(0.9, `rgba(150, 208, 228, ${a * 0.8})`)
    g.addColorStop(1, `rgba(210, 240, 250, ${a * 0.12})`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.7})`
    ctx.beginPath()
    ctx.arc(x - r * 0.32, y - r * 0.34, Math.max(0.6, r * 0.16), 0, Math.PI * 2)
    ctx.fill()
  }

  /** Trigger one bubble sweep. */
  function burst() {
    spawn()
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  /** Dev-only: hold a static field (redrawn on an interval) to eyeball it. */
  function preview() {
    const draw = () => {
      bubbles = []
      spawn()
      ctx.clearRect(0, 0, W, H)
      for (const b of bubbles) drawBubble(b.x, b.y, b.r, b.alpha)
    }
    draw()
    setInterval(draw, 200)
  }

  return { burst, preview }
}
