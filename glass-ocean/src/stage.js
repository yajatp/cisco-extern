import * as THREE from 'three'
import { Tween, makeGlowTexture } from './util.js'

/**
 * Stage owns the single WebGL renderer, the render loop, active tweens,
 * and the ambient "marine snow" background scene shown behind slides.
 * Exactly one scene renders at a time: the active sim, or the background.
 */
export class Stage {
  constructor(host) {
    this.lite = new URLSearchParams(location.search).has('lite')
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lite ? 1 : 1.5))
    host.appendChild(this.renderer.domElement)
    this.canvas = this.renderer.domElement

    this.tweens = new Set()
    this.sim = null
    this.frozen = false
    this.resizeHandlers = []
    this.bg = createBackground(this.lite)
    this.clock = new THREE.Clock()

    window.addEventListener('resize', () => this.resize())
    this.resize()
    this.renderer.setAnimationLoop(() => this.tick())
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05)
    for (const t of [...this.tweens]) if (t.step(dt)) this.tweens.delete(t)
    if (this.frozen) return
    const active = this.sim || this.bg
    active.update(dt)
    this.renderer.render(active.scene, active.camera)
  }

  addTween(opts) {
    const t = new Tween(opts)
    this.tweens.add(t)
    return t
  }
  finishTweens() {
    for (const t of [...this.tweens]) {
      t.finish()
      this.tweens.delete(t)
    }
  }

  setSim(sim) {
    this.sim = sim
  }
  setFrozen(b) {
    this.frozen = b
    this.canvas.classList.toggle('frozen', b)
  }

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.width = w
    this.height = h
    this.renderer.setSize(w, h)
    this.bg.resize(w, h)
    for (const fn of this.resizeHandlers) fn(w, h)
  }
}

/* ---------- ambient background: deep water + marine snow ---------- */
function createBackground(lite) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020814)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.set(0, 0, 0)

  const layers = []
  const makeLayer = (count, size, opacity, depth) => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30
      pos[i * 3 + 2] = -depth - Math.random() * 18
      speed[i] = 0.25 + Math.random() * 0.55
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({
      color: 0x9fd4e6,
      size,
      transparent: true,
      opacity,
      sizeAttenuation: true,
      depthWrite: false,
    })
    const points = new THREE.Points(geo, mat)
    scene.add(points)
    layers.push({ pos, speed, count, geo })
  }
  makeLayer(lite ? 220 : 480, 0.1, 0.55, 6)
  makeLayer(lite ? 140 : 300, 0.06, 0.35, 16)

  // faint light-from-the-surface glow high above
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(128),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  glow.position.set(0, 13, -26)
  glow.scale.set(58, 30, 1)
  scene.add(glow)

  let time = 0
  return {
    scene,
    camera,
    update(dt) {
      time += dt
      for (const l of layers) {
        for (let i = 0; i < l.count; i++) {
          l.pos[i * 3 + 1] -= l.speed[i] * dt
          l.pos[i * 3] += Math.sin(time * 0.4 + i) * 0.06 * dt
          if (l.pos[i * 3 + 1] < -15) l.pos[i * 3 + 1] = 15
        }
        l.geo.attributes.position.needsUpdate = true
      }
      glow.material.opacity = 0.12 + Math.sin(time * 0.35) * 0.03
    },
    resize(w, h) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
  }
}
