import * as THREE from 'three'
import { clamp, lerp, easeInOut, makeCanvasTexture, makeGlowTexture, projectToScreen } from '../util.js'

/**
 * SIMULATION 3 — "The Sharks" (passive, schematic/hologram aesthetic).
 * Stages: 0 schematic · 1 phishing vs Duo · 2 ransomware vs ISE ·
 *         3 data poisoning vs one-way architecture · 4 defense constellation.
 */
const RINGS = [
  { name: 'CREW', r: 9.4, color: 0x38e1ff },
  { name: 'MINING OT', r: 7.4, color: 0x2bd9c0 },
  { name: 'SENSORS', r: 5.4, color: 0x47f2a2 },
  { name: 'UPLINK', r: 3.4, color: 0x9fd4e6 },
]

export function createSharksSim({ stage, overlayEl }) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x010409)
  scene.fog = new THREE.Fog(0x010409, 20, 60)
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200)
  const rig = new THREE.Group()
  camera.position.set(0, 14, 18)
  camera.lookAt(0, 0.5, 0)
  rig.add(camera)
  scene.add(rig)

  /* ---------- faint polar grid + zone rings ---------- */
  const ringMeshes = []
  for (const rdef of RINGS) {
    const pts = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * rdef.r, 0, Math.sin(a) * rdef.r))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineDashedMaterial({ color: rdef.color, transparent: true, opacity: 0.55, dashSize: 0.55, gapSize: 0.3 })
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    scene.add(line)
    ringMeshes.push(line)
  }
  // radial spokes, very faint
  const spokeGeo = new THREE.BufferGeometry()
  const spokePts = []
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    spokePts.push(new THREE.Vector3(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2))
    spokePts.push(new THREE.Vector3(Math.cos(a) * 11.5, 0, Math.sin(a) * 11.5))
  }
  spokeGeo.setFromPoints(spokePts)
  scene.add(new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({ color: 0x0d2836, transparent: true, opacity: 0.6 })))

  /* ---------- the vessel schematic ---------- */
  const vessel = new THREE.Group()
  const lineMat = new THREE.LineBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.9 })
  const edgeBox = (w, h, d, x, y, z) => {
    const seg = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat)
    seg.position.set(x, y, z)
    vessel.add(seg)
  }
  edgeBox(4.2, 0.8, 1.5, 0, 0.5, 0) // hull
  edgeBox(1.1, 0.9, 1.2, -1.2, 1.35, 0) // superstructure
  edgeBox(0.35, 1.7, 0.35, 0.5, 1.7, 0) // derrick
  const bow = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.ConeGeometry(0.75, 1.4, 4)),
    lineMat
  )
  bow.rotation.z = -Math.PI / 2
  bow.position.set(2.75, 0.5, 0)
  vessel.add(bow)
  const vGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }))
  vGlow.scale.set(9, 5, 1)
  vGlow.position.y = 0.8
  vessel.add(vGlow)
  scene.add(vessel)

  /* ---------- sharks ---------- */
  function sharkShape() {
    const s = new THREE.Shape()
    s.moveTo(1.7, 0)
    s.quadraticCurveTo(0.9, 0.34, 0.25, 0.36)
    s.lineTo(0.05, 0.95) // dorsal fin
    s.lineTo(-0.25, 0.34)
    s.quadraticCurveTo(-0.9, 0.28, -1.35, 0.1)
    s.lineTo(-1.75, 0.6) // tail top
    s.lineTo(-1.5, 0.02)
    s.lineTo(-1.9, -0.45) // tail bottom
    s.lineTo(-1.3, -0.12)
    s.quadraticCurveTo(-0.4, -0.32, 0.5, -0.28)
    s.quadraticCurveTo(1.2, -0.2, 1.7, 0)
    return s
  }
  const sharkGeoBase = new THREE.ShapeGeometry(sharkShape())
  const sharks = ['PHISHING', 'RANSOMWARE', 'DATA POISONING'].map((name, i) => {
    const group = new THREE.Group()
    const body = new THREE.Mesh(sharkGeoBase, new THREE.MeshBasicMaterial({ color: 0x05080c, side: THREE.DoubleSide }))
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(sharkGeoBase), new THREE.LineBasicMaterial({ color: 0xff4d5e, transparent: true, opacity: 0.9 }))
    group.add(body, edge)
    group.scale.setScalar(1.5)
    group.position.set(0, 0.8, 0)
    group.visible = false
    scene.add(group)
    const label = document.createElement('div')
    label.className = 'shark-label'
    label.textContent = name
    return {
      name, group, label,
      r: 14, a: i * 2.1, // polar position
      prev: new THREE.Vector3(),
      circling: false, circleR: 12.5, circleSpeed: 0.22,
    }
  })

  /* ---------- defense visuals ---------- */
  const duoTex = makeCanvasTexture(256, (ctx, s) => {
    ctx.strokeStyle = '#049fd9'
    ctx.lineWidth = 8
    ctx.strokeRect(14, 14, s - 28, s - 28)
    ctx.fillStyle = 'rgba(4,159,217,0.16)'
    ctx.fillRect(14, 14, s - 28, s - 28)
    // shield + check
    ctx.beginPath()
    ctx.moveTo(s / 2, 48)
    ctx.lineTo(s / 2 + 44, 66)
    ctx.lineTo(s / 2 + 40, 128)
    ctx.quadraticCurveTo(s / 2 + 30, 168, s / 2, 186)
    ctx.quadraticCurveTo(s / 2 - 30, 168, s / 2 - 40, 128)
    ctx.lineTo(s / 2 - 44, 66)
    ctx.closePath()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s / 2 - 18, 112)
    ctx.lineTo(s / 2 - 4, 130)
    ctx.lineTo(s / 2 + 22, 92)
    ctx.lineWidth = 10
    ctx.strokeStyle = '#38e1ff'
    ctx.stroke()
  })
  const duoGate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: duoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  )
  duoGate.position.y = 1.2
  duoGate.visible = false
  scene.add(duoGate)

  function arcWall(radius, color, thetaLen) {
    const geo = new THREE.CylinderGeometry(radius, radius, 1.7, 32, 1, true, 0, thetaLen)
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }))
    mesh.position.y = 0.85
    mesh.visible = false
    scene.add(mesh)
    return mesh
  }
  const iseWall = arcWall(7.4, 0x38e1ff, 1.0)
  const sealWall = arcWall(5.4, 0xff4d5e, 0.6)

  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeGlowTexture(128, 'rgba(120,220,255,1)'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  flash.scale.set(5, 5, 1)
  scene.add(flash)
  let flashT = 1

  function fireFlash(x, z, color = 0x78dcff) {
    flash.material.color.setHex(color)
    flash.position.set(x, 1.2, z)
    flashT = 0
  }

  /* ---------- one-way data stream (sensors ring) ---------- */
  const STREAM = stage.lite ? 60 : 140
  const streamGeo = new THREE.BufferGeometry()
  const streamPos = new Float32Array(STREAM * 3)
  const streamMeta = [] // {a, r, speed}
  for (let i = 0; i < STREAM; i++) {
    streamMeta.push({ a: Math.random() * Math.PI * 2, r: 4.2 + Math.random() * 1.0, speed: 1.2 + Math.random() * 1.6 })
  }
  streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPos, 3))
  const streamPoints = new THREE.Points(streamGeo, new THREE.PointsMaterial({ color: 0x47f2a2, size: 0.14, transparent: true, opacity: 0.85, depthWrite: false }))
  streamPoints.visible = false
  scene.add(streamPoints)

  /* ---------- overlay DOM ---------- */
  overlayEl.innerHTML = `<div class="sim3-title">ZERO TRUST — LIVE THREAT VIEW</div><div class="sim3-labels"></div>`
  const labelBox = overlayEl.querySelector('.sim3-labels')
  const zoneLabels = RINGS.map((rdef, i) => {
    const el = document.createElement('div')
    el.className = 'zone-label'
    el.textContent = rdef.name
    labelBox.appendChild(el)
    return { el, anchor: new THREE.Vector3(Math.cos(1.05 + i * 0.28) * rdef.r, 0.15, Math.sin(1.05 + i * 0.28) * rdef.r) }
  })
  for (const sh of sharks) labelBox.appendChild(sh.label)

  const defenseLabels = [
    { html: `Cisco Duo — identity verified.<small>(This one gutted MGM.)</small>` },
    { html: `Cisco ISE — segmentation: breach contained.<small>(Ascension had no walls.)</small>` },
    { html: `One-way architecture — nothing writes in.<small>Not even TMC.</small>` },
  ].map((d) => {
    const el = document.createElement('div')
    el.className = 'defense-label'
    el.innerHTML = d.html
    labelBox.appendChild(el)
    return { el, anchor: new THREE.Vector3() }
  })

  const constLabels = ['Cisco XDR', 'Cisco Cyber Vision', 'Cisco Umbrella', 'Splunk'].map((name, i) => {
    const el = document.createElement('div')
    el.className = 'constellation-label'
    el.textContent = name
    labelBox.appendChild(el)
    const a = 0.7 + i * (Math.PI / 2.15)
    return { el, anchor: new THREE.Vector3(Math.cos(a) * 11.2, 2.4, Math.sin(a) * 11.2) }
  })
  // faint constellation lines to the vessel
  const constLineGeo = new THREE.BufferGeometry().setFromPoints(
    constLabels.flatMap((c) => [c.anchor.clone(), new THREE.Vector3(0, 1, 0)])
  )
  const constLines = new THREE.LineSegments(constLineGeo, new THREE.LineBasicMaterial({ color: 0x049fd9, transparent: true, opacity: 0.3 }))
  constLines.visible = false
  scene.add(constLines)

  /* ---------- attack choreography ---------- */
  // approach headings (polar angle each shark attacks from)
  const ATK = [
    { a: 0.35 },  // phishing → CREW ring (r 9.4)
    { a: 2.6 },   // ransomware → through CREW, blocked at MINING OT wall (r 7.4)
    { a: 4.3 },   // data poisoning → circles SENSORS ring (r 5.4)
  ]

  const sim = {
    id: 'sharks',
    scene,
    camera,
    overlayEl,
    descend: { y: 0 },
    stageCount: 5,
  }
  let stageIdx = 0
  let t = 0 // time within current stage
  let time = 0
  let active = false

  sim.enter = () => { active = true }
  sim.exit = () => { active = false }

  sim.setStage = (n) => {
    stageIdx = n
    t = 0
    // snap all earlier beats to their finished state so back-nav & S-skips stay coherent
    duoGate.visible = n > 1
    iseWall.visible = n > 2
    iseWall.material.opacity = 0.22
    sealWall.visible = false
    streamPoints.visible = n >= 3
    constLines.visible = n >= 4
    defenseLabels[0].el.classList.toggle('show', n > 1)
    defenseLabels[1].el.classList.toggle('show', n > 2)
    defenseLabels[2].el.classList.toggle('show', n > 3)
    constLabels.forEach((c) => c.el.classList.toggle('show', n >= 4))
    sharks.forEach((sh, i) => {
      const beat = i + 1
      sh.group.visible = n >= beat
      sh.label.classList.toggle('show', n >= beat)
      if (n > beat) {
        // this shark's attack already resolved → it circles harmlessly
        sh.circling = true
        sh.r = sh.circleR
        sh.a = ATK[i].a + 0.9
      } else if (n === beat) {
        sh.circling = false
        sh.r = 15
        sh.a = ATK[i].a
      }
    })
    if (n > 1) placeDefense(0, 9.4, ATK[0].a)
    if (n > 2) placeDefense(1, 7.4, ATK[1].a)
    if (n > 3) placeDefense(2, 5.4, ATK[2].a)
  }

  function placeDefense(i, r, a) {
    defenseLabels[i].anchor.set(Math.cos(a) * r, 2.2, Math.sin(a) * r)
    if (i === 0) {
      duoGate.position.set(Math.cos(a) * 9.4, 1.3, Math.sin(a) * 9.4)
      duoGate.lookAt(Math.cos(a) * 20, 1.3, Math.sin(a) * 20)
    }
    if (i === 1) iseWall.rotation.y = -a - 0.5
    if (i === 2) sealWall.rotation.y = -a - 0.3
  }

  /* per-beat shark animation. Returns polar {r} for the attacking shark. */
  function animateAttack(i, sh, lt) {
    const atkA = ATK[i].a
    if (i === 0) {
      // lunge to CREW ring, bounce off Duo gate
      if (lt < 2.4) {
        sh.a = atkA + Math.sin(lt * 2.2) * 0.04
        sh.r = lerp(15, 9.7, easeInOut(clamp(lt / 2.4, 0, 1)))
      } else if (lt < 2.5) {
        if (!duoGate.visible) {
          duoGate.visible = true
          placeDefense(0, 9.4, atkA)
          fireFlash(Math.cos(atkA) * 9.4, Math.sin(atkA) * 9.4)
          defenseLabels[0].el.classList.add('show')
        }
      } else {
        const p = clamp((lt - 2.5) / 1.4, 0, 1)
        sh.r = lerp(9.7, sh.circleR, easeInOut(p))
        sh.a = atkA + p * 0.5
        if (p >= 1) sh.circling = true
      }
    } else if (i === 1) {
      // breach CREW ring, slam into ISE wall at MINING OT boundary
      if (lt < 3.1) {
        sh.a = atkA + Math.sin(lt * 2.5) * 0.04
        sh.r = lerp(15, 7.7, easeInOut(clamp(lt / 3.1, 0, 1)))
        // flash the CREW ring red as it's crossed
        const crossing = Math.abs(sh.r - 9.4) < 0.5
        ringMeshes[0].material.color.setHex(crossing ? 0xff4d5e : RINGS[0].color)
        ringMeshes[0].material.opacity = crossing ? 1 : 0.55
      } else if (lt < 3.2) {
        ringMeshes[0].material.color.setHex(RINGS[0].color)
        ringMeshes[0].material.opacity = 0.55
        if (!iseWall.visible) {
          iseWall.visible = true
          placeDefense(1, 7.4, atkA)
          iseWall.material.opacity = 0.75
          fireFlash(Math.cos(atkA) * 7.4, Math.sin(atkA) * 7.4)
          defenseLabels[1].el.classList.add('show')
        }
      } else {
        iseWall.material.opacity = lerp(iseWall.material.opacity, 0.22, 0.03)
        const p = clamp((lt - 3.2) / 1.5, 0, 1)
        sh.r = lerp(7.7, sh.circleR, easeInOut(p))
        sh.a = atkA - p * 0.6
        if (p >= 1) sh.circling = true
      }
    } else {
      // circle the SENSORS ring, try to swim in, get sealed out
      if (lt < 5) {
        sh.r = lerp(15, 6.1, easeInOut(clamp(lt / 1.8, 0, 1)))
        if (lt > 1.8) sh.a = atkA + (lt - 1.8) * 0.55
      } else if (lt < 6) {
        const p = (lt - 5) / 1
        sh.a = atkA + 3.2 * 0.55
        sh.r = lerp(6.1, 5.5, easeInOut(p)) // nosing inward…
      } else if (lt < 6.1) {
        if (!sealWall.visible) {
          sealWall.visible = true
          sealWall.rotation.y = -(atkA + 3.2 * 0.55) - 0.3
          sealWall.material.opacity = 0.7
          fireFlash(Math.cos(atkA + 1.76) * 5.4, Math.sin(atkA + 1.76) * 5.4, 0xff6070)
          placeDefense(2, 5.4, atkA + 1.76)
          defenseLabels[2].el.classList.add('show')
        }
      } else {
        sealWall.material.opacity = Math.max(0, sealWall.material.opacity - 0.008)
        if (sealWall.material.opacity <= 0.01) sealWall.visible = false
        const p = clamp((lt - 6.1) / 1.6, 0, 1)
        sh.r = lerp(5.5, sh.circleR, easeInOut(p))
        sh.a = atkA + 1.76 + p * 0.5
        if (p >= 1) sh.circling = true
      }
    }
  }

  /* ---------- update ---------- */
  const tmp = new THREE.Vector3()
  sim.update = (dt) => {
    time += dt
    t += dt
    rig.position.y = sim.descend.y
    rig.rotation.y = Math.sin(time * 0.07) * 0.35
    vessel.position.y = Math.sin(time * 0.8) * 0.06
    for (const line of ringMeshes) line.rotation.y += dt * 0.02

    if (flashT < 1) {
      flashT = Math.min(1, flashT + dt * 1.6)
      flash.material.opacity = (1 - flashT) * 0.9
      flash.scale.setScalar(5 + flashT * 6)
    }

    // sharks
    sharks.forEach((sh, i) => {
      if (!sh.group.visible) return
      if (sh.circling) {
        sh.a += dt * sh.circleSpeed
        sh.r = lerp(sh.r, sh.circleR, dt)
      } else if (stageIdx === i + 1) {
        animateAttack(i, sh, t)
      }
      sh.prev.copy(sh.group.position)
      sh.group.position.set(Math.cos(sh.a) * sh.r, 0.8 + Math.sin(time * 1.4 + i) * 0.12, Math.sin(sh.a) * sh.r)
      const dx = sh.group.position.x - sh.prev.x
      const dz = sh.group.position.z - sh.prev.z
      if (dx * dx + dz * dz > 1e-8) sh.group.rotation.y = Math.atan2(-dz, dx)
    })

    // one-way stream: particles flow OUT of the sensors ring
    if (streamPoints.visible) {
      for (let i = 0; i < STREAM; i++) {
        const m = streamMeta[i]
        m.r += m.speed * dt
        if (m.r > 12.5) {
          m.r = 4.2
          m.a = Math.random() * Math.PI * 2
        }
        streamPos[i * 3] = Math.cos(m.a) * m.r
        streamPos[i * 3 + 1] = 0.35
        streamPos[i * 3 + 2] = Math.sin(m.a) * m.r
      }
      streamGeo.attributes.position.needsUpdate = true
      streamPoints.material.opacity = stageIdx === 3 ? 0.95 : 0.5
    }

    // project all DOM labels
    rig.updateMatrixWorld(true)
    const w = window.innerWidth
    const h = window.innerHeight
    for (const z of zoneLabels) place(z.el, z.anchor, w, h)
    sharks.forEach((sh) => {
      if (!sh.group.visible) return
      tmp.copy(sh.group.position)
      tmp.y += 1.1
      place(sh.label, tmp, w, h)
    })
    for (const d of defenseLabels) if (d.el.classList.contains('show')) place(d.el, d.anchor, w, h)
    for (const c of constLabels) if (c.el.classList.contains('show')) place(c.el, c.anchor, w, h)
  }

  function place(el, worldPos, w, h) {
    const p = projectToScreen(worldPos, camera, w, h)
    el.style.left = `${p.x}px`
    el.style.top = `${p.y}px`
    el.style.display = p.visible ? 'block' : 'none'
  }

  sim.resize = (w, h) => {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  sim.resize(window.innerWidth, window.innerHeight)

  return sim
}
