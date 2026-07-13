import * as THREE from 'three'

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
export const easeOut = (t) => 1 - (1 - t) ** 3
export const easeIn = (t) => t * t * t

export class Tween {
  constructor({ duration, ease = easeInOut, update, complete }) {
    this.t = 0
    this.duration = duration
    this.ease = ease
    this.update = update
    this.complete = complete
    this.done = false
  }
  step(dt) {
    if (this.done) return true
    this.t += dt
    const p = clamp(this.t / this.duration, 0, 1)
    this.update(this.ease(p), p)
    if (p >= 1) {
      this.done = true
      this.complete?.()
    }
    return this.done
  }
  finish() {
    if (this.done) return
    this.done = true
    this.update(this.ease(1), 1)
    this.complete?.()
  }
}

export function makeCanvasTexture(size, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const _v = new THREE.Vector3()
/** Project a world position to screen px. Returns {x, y, visible}. */
export function projectToScreen(worldPos, camera, w, h) {
  _v.copy(worldPos).project(camera)
  return {
    x: (_v.x * 0.5 + 0.5) * w,
    y: (-_v.y * 0.5 + 0.5) * h,
    visible: _v.z < 1,
  }
}

/** Soft radial glow texture used by several sims. */
export function makeGlowTexture(size = 128, color = 'rgba(180,235,255,1)') {
  return makeCanvasTexture(size, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, color)
    g.addColorStop(0.4, color.replace(/,1\)$/, ',0.35)'))
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
}
