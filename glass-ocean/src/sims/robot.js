import * as THREE from 'three'
import { clamp, lerp, makeCanvasTexture, projectToScreen } from '../util.js'

/**
 * SIMULATION 2 — "The Robot" (the only interactive sim).
 * Stages: 0 exterior orbit · 1–4 Cisco callouts · 5 first-person harvesting.
 * Freeze (Stage C) is driven by the deck; standalone #/robot loops stage 5.
 */
export function createRobotSim({ stage, overlayEl }) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x04131f)
  scene.fog = new THREE.FogExp2(0x04131f, 0.042)
  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 200)
  const rig = new THREE.Group()
  rig.add(camera)
  scene.add(rig)

  scene.add(new THREE.HemisphereLight(0x2a5674, 0x0a1620, 1.7))
  const dir = new THREE.DirectionalLight(0x9fd4ff, 1.9)
  dir.position.set(6, 14, 4)
  scene.add(dir)
  const headlight = new THREE.PointLight(0xbfe8ff, 320, 60, 2)
  headlight.position.set(0, 0.4, -2)
  camera.add(headlight)

  /* ---------- seafloor ---------- */
  const floorTex = makeCanvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#101a22'
    ctx.fillRect(0, 0, s, s)
    for (let i = 0; i < 900; i++) {
      const shade = Math.random()
      ctx.fillStyle = shade > 0.5 ? 'rgba(160,190,205,0.06)' : 'rgba(0,0,0,0.18)'
      const r = Math.random() * 2.2
      ctx.beginPath()
      ctx.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping
  floorTex.repeat.set(36, 36)
  const FLOOR_WORLD_PER_REPEAT = 300 / 36
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1, color: 0x8fa8b8 })
  )
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  /* ---------- the collector vehicle (Stage A) ---------- */
  const robot = new THREE.Group()
  const metal = new THREE.MeshStandardMaterial({ color: 0x3d4a54, roughness: 0.6, metalness: 0.35, flatShading: true })
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x141b21, roughness: 0.9, flatShading: true })
  const cyanGlow = new THREE.MeshStandardMaterial({ color: 0x0b2a36, emissive: 0x38e1ff, emissiveIntensity: 1.6 })
  const ciscoGlow = new THREE.MeshStandardMaterial({ color: 0x03202e, emissive: 0x049fd9, emissiveIntensity: 1.8 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.5), metal)
  body.position.y = 0.85
  robot.add(body)
  for (const z of [-0.85, 0.85]) {
    const tread = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 0.45), darkMetal)
    tread.position.set(0, 0.28, z)
    robot.add(tread)
  }
  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.3), darkMetal)
  intake.position.set(1.55, 0.45, 0)
  intake.rotation.z = 0.35
  robot.add(intake)
  const pod = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), metal)
  pod.position.set(1.05, 1.55, 0)
  robot.add(pod)
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), cyanGlow)
  lens.position.set(1.3, 1.55, 0)
  robot.add(lens)
  const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 1.0), cyanGlow)
  ledBar.position.set(1.28, 1.18, 0)
  robot.add(ledBar)
  const ucs = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.95), metal)
  ucs.position.set(0, 1.48, 0)
  robot.add(ucs)
  const ucsStrip = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.98), ciscoGlow)
  ucsStrip.position.set(0, 1.35, 0)
  robot.add(ucsStrip)
  const telem = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.55), metal)
  telem.position.set(-0.9, 1.5, 0)
  robot.add(telem)
  const telemLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), cyanGlow)
  telemLight.position.set(-0.9, 1.78, 0)
  robot.add(telemLight)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.6, 8), darkMetal)
  mast.position.set(-1.0, 2.3, 0)
  robot.add(mast)
  const mastTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), ciscoGlow)
  mastTip.position.set(-1.0, 3.12, 0)
  robot.add(mastTip)
  scene.add(robot)

  const anchors = {
    pod: new THREE.Vector3(1.15, 1.62, 0),
    ucs: new THREE.Vector3(0, 1.66, 0),
    telem: new THREE.Vector3(-0.9, 1.72, 0),
    mast: new THREE.Vector3(-1.0, 3.12, 0),
  }

  /* ---------- sediment motes for motion parallax (Stage B) ---------- */
  const MOTES = stage.lite ? 90 : 200
  const moteGeo = new THREE.BufferGeometry()
  const motePos = new Float32Array(MOTES * 3)
  for (let i = 0; i < MOTES; i++) resetMote(i, true)
  function resetMote(i, anywhere) {
    motePos[i * 3] = (Math.random() - 0.5) * 26
    motePos[i * 3 + 1] = 0.2 + Math.random() * 5
    motePos[i * 3 + 2] = anywhere ? -Math.random() * 60 : -55 - Math.random() * 10
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3))
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({ color: 0x8fc4d8, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false })
  )
  motes.visible = false
  scene.add(motes)

  /* ---------- nodules (Stage B) ---------- */
  const noduleGeo = new THREE.DodecahedronGeometry(0.42, 0)
  const noduleMat = new THREE.MeshStandardMaterial({ color: 0x555149, roughness: 0.9, flatShading: true })
  const faunaMat = new THREE.MeshStandardMaterial({ color: 0x4a3b40, roughness: 0.9, flatShading: true })
  const coralMatA = new THREE.MeshStandardMaterial({ color: 0x2a0f18, emissive: 0xff7b9c, emissiveIntensity: 1.1, flatShading: true })
  const coralMatB = new THREE.MeshStandardMaterial({ color: 0x2a1a08, emissive: 0xffb36b, emissiveIntensity: 1.0, flatShading: true })

  const NODULES = 12
  const nodules = []
  for (let i = 0; i < NODULES; i++) {
    const group = new THREE.Group()
    const rock = new THREE.Mesh(noduleGeo, noduleMat)
    group.add(rock)
    const bits = []
    for (let b = 0; b < 3; b++) {
      const bit = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 5), b % 2 ? coralMatA : coralMatB)
      bit.position.set((Math.random() - 0.5) * 0.5, 0.4 + Math.random() * 0.15, (Math.random() - 0.5) * 0.5)
      bit.rotation.z = (Math.random() - 0.5) * 0.7
      group.add(bit)
      bits.push(bit)
    }
    group.visible = false
    scene.add(group)
    const tag = document.createElement('div')
    tag.className = 'ntag'
    tag.style.display = 'none'
    nodules.push({ group, rock, bits, tag, kind: 'bare', state: 'field', grabT: 0, grabFrom: new THREE.Vector3() })
  }

  function respawnNodule(n, initial = false) {
    n.state = 'field'
    n.grabT = 0
    n.kind = Math.random() < 0.32 ? 'fauna' : 'bare'
    n.rock.material = n.kind === 'fauna' ? faunaMat : noduleMat
    for (const b of n.bits) b.visible = n.kind === 'fauna'
    const z = initial ? -10 - Math.random() * 55 : -58 - Math.random() * 14
    n.group.position.set((Math.random() - 0.5) * 13, 0.32, z)
    n.group.rotation.y = Math.random() * Math.PI * 2
    const s = 0.8 + Math.random() * 0.55
    n.group.scale.set(s, s * 0.8, s)
    n.tag.className = 'ntag' + (n.kind === 'fauna' ? ' red' : '')
    n.tag.textContent = n.kind === 'fauna' ? 'EPIFAUNA DETECTED — SKIP' : 'BARE NODULE — COLLECT'
    n.tag.style.display = 'none'
  }

  /* ---------- overlay DOM ---------- */
  overlayEl.innerHTML = `
    <svg class="callout-lines"></svg>
    <div class="callouts"></div>
    <div class="hud hidden">
      <div class="hud-scanlines"></div>
      <div class="hud-frame"></div>
      <div class="ntags"></div>
      <div class="hud-reticle"></div>
      <div class="hud-depth">DEPTH 4,012 m</div>
      <div class="hud-counter">COLLECTED <b>0</b></div>
      <div class="hud-plume"><label>SEDIMENT PLUME</label><div class="bar"><i></i></div></div>
      <div class="hud-ledger"><div class="ledger-title">SIGNED TELEMETRY</div><ul></ul></div>
      <div class="hud-banner"></div>
      <div class="hud-hint">aim: mouse &nbsp;·&nbsp; collect: click / Enter &nbsp;·&nbsp; boost: hold W</div>
    </div>`
  const svg = overlayEl.querySelector('.callout-lines')
  const calloutBox = overlayEl.querySelector('.callouts')
  const hud = overlayEl.querySelector('.hud')
  const ntagBox = overlayEl.querySelector('.ntags')
  for (const n of nodules) ntagBox.appendChild(n.tag)
  const reticleEl = overlayEl.querySelector('.hud-reticle')
  const depthEl = overlayEl.querySelector('.hud-depth')
  const counterEl = overlayEl.querySelector('.hud-counter b')
  const plumeWrap = overlayEl.querySelector('.hud-plume')
  const plumeBar = overlayEl.querySelector('.hud-plume .bar i')
  const ledgerList = overlayEl.querySelector('.hud-ledger ul')
  const bannerEl = overlayEl.querySelector('.hud-banner')

  // y = fixed screen slot; the left/right side is chosen live from where the anchor projects
  const CALLOUTS = [
    { key: 'pod', text: 'Vision pod (cameras + LED array)', y: 0.24 },
    { key: 'ucs', text: 'Edge AI — Cisco UCS shipboard inference', y: 0.34 },
    { key: 'telem', text: 'Signed telemetry module → tamper-proof ledger', y: 0.56 },
    { key: 'mast', text: 'CURWB surface link (ship ↔ buoys)', y: 0.18 },
  ]
  const calloutEls = CALLOUTS.map((c) => {
    const el = document.createElement('div')
    el.className = 'callout'
    el.textContent = c.text
    calloutBox.appendChild(el)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    svg.appendChild(line)
    return { ...c, el, line }
  })

  /* ---------- state ---------- */
  const sim = {
    id: 'robot',
    scene,
    camera,
    overlayEl,
    descend: { y: 0 },
    frozen: false,
    standalone: false,
  }
  let mode = 'exterior' // 'exterior' | 'fpv'
  let stageIdx = 0
  let orbitAngle = 0.6
  let time = 0
  let collected = 0
  let plume = 0
  let throttled = false
  let boost = false
  let speed = 3.2
  let missionSec = 7 * 3600 + 41 * 60 + 50
  const mouse = new THREE.Vector2(0, 0)
  const raycaster = new THREE.Raycaster()
  let hovered = null
  let active = false // is this sim the one on stage?

  const BASE_SPEED = 3.2
  const BOOST_SPEED = 8.5
  const THROTTLE_SPEED = 1.1

  function fmtClock() {
    const s = Math.floor(missionSec)
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }

  function ledger(text) {
    const li = document.createElement('li')
    li.className = 'ok'
    li.innerHTML = `${fmtClock()} — ${text} — <b>SIGNED ✓</b>`
    ledgerList.appendChild(li)
    while (ledgerList.children.length > 5) ledgerList.removeChild(ledgerList.firstChild)
  }

  function banner(text, color, sticky = false) {
    bannerEl.textContent = text
    bannerEl.className = `hud-banner ${color} ${sticky ? 'sticky' : ''}`
    if (!sticky) {
      void bannerEl.offsetWidth
      bannerEl.classList.add('flash')
    }
  }
  function clearBanner() {
    bannerEl.className = 'hud-banner'
  }

  /* ---------- input ---------- */
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    reticleEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
  })
  window.addEventListener('click', () => {
    if (fpvActive()) attemptCollect()
  })
  window.addEventListener('keydown', (e) => {
    if (!fpvActive()) return
    if (e.key === 'Enter') attemptCollect()
    if (e.key === 'w' || e.key === 'W') boost = true
  })
  window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') boost = false
  })

  function fpvActive() {
    return active && mode === 'fpv' && !sim.frozen
  }

  function attemptCollect() {
    if (!hovered || hovered.state !== 'field') return
    const z = hovered.group.position.z
    if (z < -30 || z > -1.5) return // out of collection range
    if (hovered.kind === 'bare') {
      hovered.state = 'grabbing'
      hovered.grabT = 0
      hovered.grabFrom.copy(hovered.group.position)
      hovered.tag.style.display = 'none'
      collected++
      counterEl.textContent = collected
      plume = clamp(plume + 0.14, 0, 1)
      ledger('nodule collected — no fauna')
    } else {
      banner('PROTECTED — SKIPPED', 'red')
      ledger('fauna avoided')
    }
  }

  /* ---------- stage control ---------- */
  sim.enter = (opts = {}) => {
    sim.standalone = !!opts.standalone
    active = true
    restartState()
  }
  sim.exit = () => {
    active = false
    hud.classList.add('hidden')
    for (const c of calloutEls) {
      c.el.classList.remove('show')
      c.line.classList.remove('show')
    }
  }
  sim.freeze = () => {
    sim.frozen = true
  }
  sim.unfreeze = () => {
    sim.frozen = false
  }
  sim.restart = () => {
    if (mode === 'fpv') restartState(true)
  }

  function restartState(keepMode = false) {
    collected = 0
    plume = 0
    throttled = false
    boost = false
    speed = BASE_SPEED
    missionSec = 7 * 3600 + 41 * 60 + 50
    counterEl.textContent = '0'
    ledgerList.innerHTML = ''
    clearBanner()
    for (const n of nodules) respawnNodule(n, true)
    if (!keepMode) {
      mode = 'exterior'
      stageIdx = 0
    }
  }

  sim.setStage = (n) => {
    stageIdx = n
    if (n <= 4) {
      mode = 'exterior'
      robot.visible = true
      motes.visible = false
      hud.classList.add('hidden')
      for (const nd of nodules) {
        nd.group.visible = false
        nd.tag.style.display = 'none'
      }
      calloutEls.forEach((c, i) => {
        c.el.classList.toggle('show', i < n)
        c.line.classList.toggle('show', i < n)
      })
    } else {
      mode = 'fpv'
      robot.visible = false
      motes.visible = true
      hud.classList.remove('hidden')
      for (const nd of nodules) nd.group.visible = true
      calloutEls.forEach((c) => {
        c.el.classList.remove('show')
        c.line.classList.remove('show')
      })
    }
  }

  /* ---------- update ---------- */
  sim.update = (dt) => {
    time += dt
    missionSec += dt
    if (mode === 'exterior') updateExterior(dt)
    else updateFpv(dt)
  }

  function updateExterior(dt) {
    orbitAngle += dt * 0.16
    const r = 7.5
    rig.position.set(Math.cos(orbitAngle) * r, 2.6 + sim.descend.y, Math.sin(orbitAngle) * r)
    camera.position.set(0, 0, 0)
    camera.lookAt(0, 1.0, 0)
    telemLight.material.emissiveIntensity = 1.2 + Math.sin(time * 4) * 0.8
    rig.updateMatrixWorld(true)
    // project callout leader lines
    const w = window.innerWidth
    const h = window.innerHeight
    for (const c of calloutEls) {
      const p = projectToScreen(anchors[c.key], camera, w, h)
      const lx = (p.x < w / 2 ? 0.2 : 0.8) * w
      const ly = c.y * h
      c.el.style.left = `${lx}px`
      c.el.style.top = `${ly}px`
      c.line.setAttribute('x1', p.x)
      c.line.setAttribute('y1', p.y)
      c.line.setAttribute('x2', lx)
      c.line.setAttribute('y2', ly)
    }
  }

  function updateFpv(dt) {
    // speed & plume dynamics
    const target = throttled ? THROTTLE_SPEED : boost ? BOOST_SPEED : BASE_SPEED
    speed = lerp(speed, target, 1 - Math.exp(-dt * 2.5))
    if (boost && !throttled) plume += dt * 0.3
    if (speed > BASE_SPEED + 0.5) plume += dt * 0.08
    plume = clamp(plume - dt * 0.055, 0, 1)
    if (!throttled && plume >= 1) {
      throttled = true
      banner('AUTO-THROTTLE ENGAGED', 'amber', true)
      plumeWrap.classList.add('throttled')
    }
    if (throttled && plume < 0.4) {
      throttled = false
      clearBanner()
      plumeWrap.classList.remove('throttled')
    }
    plumeBar.style.width = `${plume * 100}%`
    depthEl.textContent = `DEPTH ${(4012 + Math.sin(time * 0.7) * 1.5).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} m`

    // camera: fixed position, world scrolls toward us
    rig.position.set(0, 2.2 + Math.sin(time * 1.3) * 0.06 + sim.descend.y, 0)
    camera.position.set(0, 0, 0)
    camera.rotation.set(-0.14, 0, 0)
    floorTex.offset.y += (speed * dt) / FLOOR_WORLD_PER_REPEAT

    // motes drift past
    for (let i = 0; i < MOTES; i++) {
      motePos[i * 3 + 2] += speed * dt * (0.7 + (i % 5) * 0.1)
      if (motePos[i * 3 + 2] > 3) resetMote(i, false)
    }
    moteGeo.attributes.position.needsUpdate = true

    // nodules approach, tags, hover, grabs
    rig.updateMatrixWorld(true)
    raycaster.setFromCamera(mouse, camera)
    const meshes = []
    for (const n of nodules) if (n.state === 'field') meshes.push(n.rock)
    const hits = raycaster.intersectObjects(meshes, false)
    const hitRock = hits[0]?.object ?? null
    hovered = nodules.find((n) => n.rock === hitRock) ?? null

    const w = window.innerWidth
    const h = window.innerHeight
    const tagPos = new THREE.Vector3()
    for (const n of nodules) {
      if (n.state === 'grabbing') {
        n.grabT += dt * 2.4
        const t = Math.min(n.grabT, 1)
        n.group.position.lerpVectors(n.grabFrom, new THREE.Vector3(0, 0.8, -1.4), t * t)
        const s = (1 - t) * 0.9 + 0.05
        n.group.scale.setScalar(s)
        if (t >= 1) respawnNodule(n)
        continue
      }
      n.group.position.z += speed * dt
      n.group.rotation.y += dt * 0.1
      if (n.group.position.z > 2.5) respawnNodule(n)
      const z = n.group.position.z
      const inRange = z > -28 && z < -2
      if (inRange) {
        tagPos.copy(n.group.position)
        tagPos.y += 0.9
        const p = projectToScreen(tagPos, camera, w, h)
        if (p.visible) {
          n.tag.style.display = 'block'
          n.tag.style.left = `${p.x}px`
          n.tag.style.top = `${p.y}px`
          n.tag.classList.toggle('hover', n === hovered)
        } else n.tag.style.display = 'none'
      } else n.tag.style.display = 'none'
    }
  }

  sim.resize = (w, h) => {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('width', w)
    svg.setAttribute('height', h)
  }
  sim.resize(window.innerWidth, window.innerHeight)

  return sim
}
