import * as THREE from 'three'
import { lerp, makeCanvasTexture, makeGlowTexture } from '../util.js'

/**
 * SIMULATION 1 — "The Glass Bridge" (passive ambience, ~30–45s).
 * First person on a glass walkway looking down at the monitored seafloor.
 * Stage 0: verified data cards rise & stamp. Stage 1: the tamper-detection beat.
 */
const CARD_CONTENT = [
  { title: 'TURBIDITY', value: '2.1 NTU', status: 'verified' },
  { title: 'BIOACOUSTIC', value: 'whale detected — operations quieted', status: 'verified' },
  { title: 'SEDIMENT PLUME', value: 'within threshold', status: 'verified' },
]

export function createBridgeSim({ stage, overlayEl }) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x03141f)
  scene.fog = new THREE.FogExp2(0x03141f, 0.031)
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 200)
  const rig = new THREE.Group()
  rig.add(camera)
  scene.add(rig)
  camera.rotation.x = -0.85 // looking down through the glass

  scene.add(new THREE.HemisphereLight(0x2c5b78, 0x06121c, 1.6))
  const dir = new THREE.DirectionalLight(0x9fd4ff, 1.4)
  dir.position.set(4, 20, 2)
  scene.add(dir)

  /* ---------- seafloor with nodules ---------- */
  const floorTex = makeCanvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#0c141c'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(150,180,200,0.05)' : 'rgba(0,0,0,0.16)'
      ctx.beginPath()
      ctx.arc(Math.random() * s, Math.random() * s, Math.random() * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
  floorTex.repeat.set(24, 24)
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1, color: 0x93aab8 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -28
  scene.add(floor)

  const NODULES = stage.lite ? 120 : 240
  const nodInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({ color: 0x34322e, roughness: 0.95, flatShading: true }),
    NODULES
  )
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < NODULES; i++) {
    const s = 0.5 + Math.random() * 0.9
    m4.makeRotationY(Math.random() * Math.PI * 2)
    m4.scale(new THREE.Vector3(s, s * 0.7, s))
    m4.setPosition((Math.random() - 0.5) * 130, -27.6, (Math.random() - 0.5) * 130)
    nodInst.setMatrixAt(i, m4)
  }
  scene.add(nodInst)

  /* ---------- glass walkway underfoot ---------- */
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 26),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.05, depthWrite: false })
  )
  glass.rotation.x = -Math.PI / 2
  glass.position.set(0, -2.2, -6)
  scene.add(glass)
  const gridPts = []
  for (let x = -3.5; x <= 3.5; x += 1.75) gridPts.push(new THREE.Vector3(x, -2.2, 7), new THREE.Vector3(x, -2.2, -19))
  for (let z = 7; z >= -19; z -= 2.6) gridPts.push(new THREE.Vector3(-3.5, -2.2, z), new THREE.Vector3(3.5, -2.2, z))
  const grid = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(gridPts),
    new THREE.LineBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.16 })
  )
  scene.add(grid)

  /* ---------- drifting sediment current ---------- */
  const DRIFT = stage.lite ? 180 : 380
  const driftGeo = new THREE.BufferGeometry()
  const driftPos = new Float32Array(DRIFT * 3)
  for (let i = 0; i < DRIFT; i++) {
    driftPos[i * 3] = (Math.random() - 0.5) * 90
    driftPos[i * 3 + 1] = -27 + Math.random() * 24
    driftPos[i * 3 + 2] = -Math.random() * 70
  }
  driftGeo.setAttribute('position', new THREE.BufferAttribute(driftPos, 3))
  const drift = new THREE.Points(driftGeo, new THREE.PointsMaterial({ color: 0x9fd4e6, size: 0.09, transparent: true, opacity: 0.45, depthWrite: false }))
  scene.add(drift)

  /* ---------- caustic light patch drifting over the floor ---------- */
  const caustic = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }))
  caustic.scale.set(46, 46, 1)
  caustic.position.set(0, -26.5, -30)
  scene.add(caustic)

  /* ---------- fish + whale silhouettes ---------- */
  const fishTex = makeCanvasTexture(128, (ctx, s) => {
    ctx.fillStyle = 'rgba(2,8,14,0.92)'
    ctx.strokeStyle = 'rgba(120,200,230,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(s * 0.45, s * 0.5, s * 0.32, s * 0.13, 0, 0, Math.PI * 2)
    ctx.moveTo(s * 0.74, s * 0.5)
    ctx.lineTo(s * 0.94, s * 0.36)
    ctx.lineTo(s * 0.94, s * 0.64)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  })
  const fishes = []
  for (let i = 0; i < 6; i++) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex, transparent: true, opacity: 0.85, depthWrite: false }))
    f.scale.set(2.6, 1.3, 1)
    f.position.set((Math.random() - 0.5) * 70, -13 - Math.random() * 9, -14 - Math.random() * 40)
    scene.add(f)
    fishes.push({ sprite: f, speed: (2 + Math.random() * 2.5) * (Math.random() > 0.5 ? 1 : -1) })
  }
  const whaleTex = makeCanvasTexture(256, (ctx, s) => {
    ctx.fillStyle = 'rgba(1,6,11,0.95)'
    ctx.strokeStyle = 'rgba(110,190,225,0.18)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(s * 0.42, s * 0.52, s * 0.36, s * 0.13, 0, 0, Math.PI * 2)
    ctx.moveTo(s * 0.76, s * 0.52)
    ctx.quadraticCurveTo(s * 0.88, s * 0.5, s * 0.97, s * 0.34)
    ctx.lineTo(s * 0.9, s * 0.54)
    ctx.lineTo(s * 0.97, s * 0.7)
    ctx.quadraticCurveTo(s * 0.88, s * 0.56, s * 0.76, s * 0.52)
    ctx.fill()
    ctx.stroke()
  })
  const whale = new THREE.Sprite(new THREE.SpriteMaterial({ map: whaleTex, transparent: true, opacity: 0.9, depthWrite: false }))
  whale.scale.set(19, 8, 1)
  scene.add(whale)
  const ping = new THREE.Mesh(
    new THREE.RingGeometry(0.96, 1, 48),
    new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  )
  ping.rotation.x = -Math.PI / 2
  scene.add(ping)
  let pingT = 99

  /* ---------- overlay: rising data cards + ledger ---------- */
  overlayEl.innerHTML = `
    <div class="datacards"></div>
    <div class="ledger-panel">
      <h4>PUBLIC LEDGER</h4>
      <ul></ul>
    </div>`
  const cardBox = overlayEl.querySelector('.datacards')
  const ledgerList = overlayEl.querySelector('.ledger-panel ul')

  const LANES = [0.3, 0.5, 0.68] // screen-x fractions so cards never collide
  const cards = CARD_CONTENT.map((c, i) => {
    const el = document.createElement('div')
    el.className = 'datacard'
    el.innerHTML = `
      <div class="dc-title">${c.title}</div>
      <div class="dc-value">${c.value}</div>
      <div class="dc-status"><span class="hash-stamp"><span>#</span></span> ✓ ${c.status}</div>`
    el.style.left = `${LANES[i] * 100}%`
    cardBox.appendChild(el)
    return { el, content: c, y: i * 0.34, stamped: false }
  })

  function addLedger(text, cls = 'ok') {
    const li = document.createElement('li')
    li.className = cls
    li.textContent = text
    ledgerList.appendChild(li)
    while (ledgerList.children.length > 6) ledgerList.removeChild(ledgerList.firstChild)
    return li
  }

  /* ---------- tamper beat (stage 1) ---------- */
  let tamperFired = false
  function fireTamper() {
    if (tamperFired) return
    tamperFired = true
    const el = document.createElement('div')
    el.className = 'datacard tamper'
    el.style.left = '50%'
    el.style.top = '38%'
    el.innerHTML = `
      <div class="dc-title">⚠ TAMPER ATTEMPT DETECTED</div>
      <div class="dc-value">TURBIDITY «0.4 NTU»</div>
      <div class="dc-status">hash mismatch — signature invalid</div>`
    cardBox.appendChild(el)
    addLedger('✗ WRITE REJECTED — hash mismatch', 'rejected')
    const intact = addLedger('⛓ TURBIDITY 2.1 NTU — original intact — chain unbroken ✓', 'intact')
    intact.classList.add('ok')
    // shatter after the red flashes play out
    setTimeout(() => {
      const rect = el.getBoundingClientRect()
      for (let i = 0; i < 6; i++) {
        const shard = document.createElement('div')
        shard.className = 'shard'
        const col = i % 3
        const row = Math.floor(i / 3)
        shard.style.clipPath = `polygon(${col * 33}% ${row * 50}%, ${(col + 1) * 33 + 6}% ${row * 50 - 4}%, ${(col + 1) * 33}% ${(row + 1) * 50 + 5}%, ${col * 33 - 5}% ${(row + 1) * 50}%)`
        shard.style.setProperty('--tx', `${(col - 1) * 90 + (Math.random() - 0.5) * 60}px`)
        shard.style.setProperty('--ty', `${(row === 0 ? -1 : 1) * (70 + Math.random() * 80)}px`)
        shard.style.setProperty('--rot', `${(Math.random() - 0.5) * 90}deg`)
        el.appendChild(shard)
      }
      el.style.background = 'transparent'
      el.style.borderColor = 'transparent'
      el.style.boxShadow = 'none'
      for (const child of el.querySelectorAll('.dc-title,.dc-value,.dc-status')) child.style.opacity = '0'
      setTimeout(() => el.remove(), 1200)
    }, 1300)
  }

  /* ---------- sim API ---------- */
  const sim = {
    id: 'bridge',
    scene,
    camera,
    overlayEl,
    descend: { y: 0 },
    stageCount: 2,
  }
  let time = 0

  sim.enter = () => {
    tamperFired = false
    ledgerList.innerHTML = ''
    cards.forEach((c, i) => {
      c.y = i * 0.34
      c.stamped = false
      c.el.classList.remove('stamped')
    })
    whale.position.set(-60, -21, -34)
  }
  sim.exit = () => {
    for (const t of cardBox.querySelectorAll('.tamper')) t.remove()
  }
  sim.setStage = (n) => {
    if (n >= 1) fireTamper()
  }

  sim.update = (dt) => {
    time += dt
    rig.position.y = sim.descend.y
    rig.position.x = Math.sin(time * 0.3) * 0.25
    camera.rotation.z = Math.sin(time * 0.22) * 0.012

    // sediment current
    for (let i = 0; i < DRIFT; i++) {
      driftPos[i * 3] += dt * 1.1
      if (driftPos[i * 3] > 45) driftPos[i * 3] = -45
    }
    driftGeo.attributes.position.needsUpdate = true

    caustic.position.x = Math.sin(time * 0.11) * 16
    caustic.position.z = -30 + Math.cos(time * 0.09) * 10

    for (const f of fishes) {
      f.sprite.position.x += f.speed * dt
      if (f.sprite.position.x > 45) f.sprite.position.x = -45
      if (f.sprite.position.x < -45) f.sprite.position.x = 45
      f.sprite.material.rotation = f.speed > 0 ? 0 : Math.PI
    }

    // the whale passes far below, pinging
    whale.position.x += dt * 2.1
    if (whale.position.x > 70) whale.position.x = -70
    pingT += dt
    if (pingT > 6.5) {
      pingT = 0
      ping.position.set(whale.position.x, whale.position.y - 0.5, whale.position.z)
    }
    if (pingT < 3.2) {
      const p = pingT / 3.2
      ping.scale.setScalar(1 + p * 11)
      ping.material.opacity = (1 - p) * 0.5
    } else ping.material.opacity = 0

    // rising data cards (DOM)
    const h = window.innerHeight
    for (const c of cards) {
      c.y += dt / 11
      if (c.y > 1) {
        c.y = 0
        c.stamped = false
        c.el.classList.remove('stamped')
      }
      const top = (1.06 - c.y * 1.3) * 100
      c.el.style.top = `${(top / 100) * h}px`
      if (!c.stamped && top < 46) {
        c.stamped = true
        c.el.classList.add('stamped')
        addLedger(`⛓ ${c.content.title} — sealed ✓`)
      }
    }
  }

  sim.resize = (w, h) => {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  sim.resize(window.innerWidth, window.innerHeight)

  return sim
}
