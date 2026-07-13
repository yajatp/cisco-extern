/* All slide copy is final draft from PROJECT_CONTEXT.md — tighten only, never add claims. */

const ciscoChips = (names) =>
  `<div class="chips">${names.map((n) => `<span class="chip chip--cisco">${n}</span>`).join('')}</div>`

const DEFS = {
  title: `
    <h1 class="mega shimmer">PROJECT<br>GLASS&nbsp;OCEAN</h1>
    <p class="subtitle">Bat Bridge Partners &times; The Metals Company — a Cisco consulting proposal</p>
    <p class="byline">Cisco Externship — Austin Cohort</p>
    <!-- [TEAM DECIDES]: add the six team member names to the byline above -->`,

  client: `
    <p class="kicker">The client</p>
    <p class="statement">The Metals Company mines battery-metal nodules — nickel, cobalt, copper, manganese — from the Pacific seafloor at 4,000&nbsp;m. It is betting its future on AI.</p>
    <div class="chips">
      <span class="chip chip--stat"><b>$320M</b>&nbsp; loss in 2025</span>
      <span class="chip chip--stat"><b>0</b>&nbsp; AI deployed today</span>
      <span class="chip chip--stat"><b>License</b>&nbsp; = environmental data</span>
    </div>`,

  alignment: `
    <p class="kicker">The assignment</p>
    <h2 class="headline">An ambitious AI adopter.<br>A new attack surface.</h2>
    <p class="statement dim">Our job: modernize them — safely &amp; ethically.</p>`,

  problem1: `
    <p class="kicker kicker--red">Problem 1 — Trust deficit</p>
    <h2 class="headline">Nobody believes them.</h2>
    <ul class="bullets">
      <li>Regulators, analysts &amp; environmental groups publicly distrust TMC's environmental claims</li>
      <li>Distrust makes capital expensive — ~$320M lost in 2025</li>
      <li>The only witness at 4,000&nbsp;m is data TMC alone controls</li>
    </ul>`,

  solution1: `
    <p class="kicker">Solution 1 — Glass Ocean</p>
    <h2 class="headline">Instead of &ldquo;trust us,&rdquo; the ocean testifies.</h2>
    <ul class="bullets">
      <li>Sensor data hash-chained &amp; signed into Splunk the moment it's captured</li>
      <li>One-way architecture — nothing writes into the sensor zone. Not even TMC.</li>
      <li>Public dashboard + a Webex regulator observation room</li>
    </ul>
    ${ciscoChips(['Splunk', 'Cisco Catalyst Industrial Ethernet', 'Cisco ThousandEyes', 'Webex'])}`,

  problem2: `
    <p class="kicker kicker--red">Problem 2 — Blind &amp; mute machines</p>
    <h2 class="headline">1960s machines: blind to life, mute to regulators.</h2>
    <ul class="bullets">
      <li>Collector vehicles can't tell bare rock from living habitat</li>
      <li>And they can't prove what they did — or didn't — disturb</li>
    </ul>`,

  solution2: `
    <p class="kicker">Solution 2 — AI selective harvesting</p>
    <h2 class="headline">Eyes AND a voice — a retrofit, not a replacement.</h2>
    <ul class="bullets">
      <li>Real-time classification: bare = collect, life detected = skip</li>
      <li>Auto-throttle when sediment plumes spike</li>
      <li>Every decision signed into the same tamper-proof ledger</li>
    </ul>
    ${ciscoChips(['Cisco UCS AI POD', 'Cisco CURWB', 'Cisco Catalyst Industrial Ethernet'])}
    <p class="honesty">Underwater acoustic links aren't Cisco — Cisco begins at the surface.</p>`,

  problem3: `
    <p class="kicker kicker--red">Problem 3 — Cyber risk</p>
    <h2 class="headline">A floating factory with a target on its back.</h2>
    <div class="chips">
      <span class="chip chip--threat">DATA POISONING</span>
      <span class="chip chip--threat">RANSOMWARE AT SEA</span>
      <span class="chip chip--threat">VESSEL SPOOFING</span>
    </div>`,

  solution3: `
    <p class="kicker">Solution 3 — Zero Trust</p>
    <h2 class="headline">Nobody trusted by default. Not even us.</h2>
    <p class="statement dim">Four sealed ship zones. One-way sensor data. Immutable logs.</p>
    ${ciscoChips(['Cisco Duo', 'Cisco ISE', 'Cisco Cyber Vision', 'Cisco Umbrella', 'Cisco Secure Access', 'Cisco XDR', 'Splunk'])}`,

  value: `
    <p class="kicker">Value &amp; metrics</p>
    <h2 class="headline">What verified truth is worth.</h2>
    <div class="stats-grid">
      <div class="stat"><div class="num">&gt;90%</div><div class="lbl">fauna-avoidance recall (target)</div></div>
      <div class="stat"><div class="num">&rarr;&nbsp;0</div><div class="lbl">plume threshold exceedances</div></div>
      <div class="stat"><div class="num">Minutes</div><div class="lbl">to detect an OT anomaly</div></div>
      <div class="stat"><div class="num">100%</div><div class="lbl">disputes resolvable by ledger</div></div>
    </div>`,

  scalability: `
    <p class="kicker">Scalability</p>
    <div class="rings">
      <div class="ring ring-2"><span class="ring-label">ABYSSAL WEATHER<i>governed ocean data — science &amp; shipping</i></span></div>
      <div class="ring ring-1"><span class="ring-label">SAFEDEPTH<i>crew safety — any offshore operator</i></span></div>
      <div class="ring core"><span class="core-label">GLASS OCEAN<i>+ 2 AI use cases</i></span></div>
    </div>`,

  roadmap: `
    <p class="kicker">Roadmap</p>
    <h2 class="headline">Four phases. Exit ramps marked.</h2>
    <div class="roadmap">
      <div class="phase"><b>Phase 0</b><span>Security basics</span></div>
      <div class="ramp">&#10551; exit ramp</div>
      <div class="phase"><b>Phase 1</b><span>Pilot</span></div>
      <div class="ramp">&#10551; exit ramp</div>
      <div class="phase"><b>Phase 2</b><span>Retrofit</span></div>
      <div class="ramp">&#10551; exit ramp</div>
      <div class="phase"><b>Phase 3</b><span>Public dashboard</span></div>
    </div>`,

  closing: `
    <h2 class="headline closing-thesis">&ldquo;Give the machines eyes.<br>Give the ocean a voice.<br>Lock both behind doors nobody can pick.&rdquo;</h2>
    <p class="closing-line2">Turning TMC's biggest liability into its license to operate.</p>`,
}

export function createSlides(root) {
  const els = {}
  for (const [id, html] of Object.entries(DEFS)) {
    const el = document.createElement('section')
    el.className = 'slide'
    el.dataset.slide = id
    el.innerHTML = html
    root.appendChild(el)
    els[id] = el
  }

  let currentId = null
  const ANIM_CLASSES = ['anim-in-fade', 'anim-in-surface', 'anim-out-fade', 'anim-out-sink', 'fast']

  function clearAnim(el) {
    el.classList.remove(...ANIM_CLASSES)
  }

  function hide(mode = 'fade', fast = false) {
    if (!currentId) return
    const el = els[currentId]
    currentId = null
    clearAnim(el)
    // force restart of the out animation
    void el.offsetWidth
    el.classList.add(mode === 'sink' ? 'anim-out-sink' : 'anim-out-fade')
    if (fast) el.classList.add('fast')
    el.classList.remove('on')
    el.addEventListener('animationend', () => clearAnim(el), { once: true })
  }

  function show(id, mode = 'fade', fast = false, build) {
    if (currentId === id) {
      setBuild(id, build)
      return
    }
    hide('fade', fast)
    const el = els[id]
    currentId = id
    clearAnim(el)
    void el.offsetWidth
    if (mode !== 'none') el.classList.add(mode === 'surface' ? 'anim-in-surface' : 'anim-in-fade')
    if (fast) el.classList.add('fast')
    el.classList.add('on')
    el.addEventListener('animationend', () => clearAnim(el), { once: true })
    setBuild(id, build)
  }

  function setBuild(id, build) {
    const el = els[id]
    if (id === 'closing') {
      el.querySelector('.closing-line2').classList.toggle('revealed', (build ?? 0) >= 1)
    }
  }

  return { show, hide, setBuild, get currentId() { return currentId } }
}
