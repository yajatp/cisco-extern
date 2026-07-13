# CLAUDE CODE PROMPT — Project Glass Ocean Presentation Website
### Copy everything below the line into Claude Code. Fill in anything marked [TEAM DECIDES].
### Tip: save this file as `PROJECT_CONTEXT.md` in the repo root so every future Claude Code session can re-read it.

---

# PART A — PROJECT CONTEXT (read this first, in every session)

## What this is and why it exists
I'm a high-school student in the Cisco Externship program (Austin cohort, team "Bat Bridge Partners," 6 members). Our capstone assignment: act as a Cisco consulting team hired by an organization that wants to leverage AI to become more competitive, but is worried that new security & ethics risks could let hackers break in. We must (A) choose an organization, (B) propose two AI use cases that transform their business, and (C) show how Cisco technology enables the transition with a focus on security & ethics. We present to Cisco judges; a technical coach (Demetrius) validates our Cisco product claims.

**Grading rubric (build everything to serve this):** Innovation 30 pts (creativity/originality), Technical Feasibility 25 pts (soundness, use of REAL Cisco technologies, AI integration), Impact & Relevance 20 pts, Implementation Plan 15 pts (roadmap, scalability), Presentation & Communication 10 pts. Required solution pillars: Technical, Value (quantified metrics), Security & Ethics, Sustainability (edge/cloud deployment reasoning).

## Our client and thesis
Client: **The Metals Company (TMC)** — a real, controversial, publicly traded deep-sea mining company harvesting battery-metal nodules (nickel, cobalt, copper, manganese) from the Pacific seafloor at ~4,000m. Chosen deliberately: they're AI-ambitious but have near-zero AI deployed (so everything we propose is ADDITIVE — no rip-and-replace to justify), and they have the richest ethics problem available: regulators, analysts, and environmental groups (Greenpeace, the International Seabed Authority) publicly distrust their environmental claims. They lost ~$320M in 2025; distrust is why capital is expensive.

**Core thesis: TMC doesn't have a mining problem — it has a PROOF problem, and the proof problem is also the money problem.** Our answer makes security the product, not a cost: verified truth is what makes the mine licensable, insurable, fundable.

**One-line version: "Give the machines eyes. Give the ocean a voice. Lock both behind doors nobody can pick."**

## The three problem/solution pairs (the presentation's spine)
1. **Trust Deficit → GLASS OCEAN**: tamper-proof, publicly verifiable environmental monitoring. Sensor data is hash-chained/signed into Splunk (Cisco-owned) the moment it's captured, flows through a ONE-WAY architecture (nothing — not even TMC — can write into the sensor zone), and publishes to a public dashboard + a Webex "regulator observation room." Instead of "trust us," the ocean testifies. Cisco: Splunk, Catalyst Industrial Ethernet, ThousandEyes, Webex. Categories: Value + Ethics. This is our Innovation centerpiece.
2. **Blind & Mute 1960s Machines → AI SELECTIVE HARVESTING**: computer-vision retrofit on TMC's EXISTING collector vehicles (like driver-assist added to a truck fleet): classify nodules in real time (bare = collect, life detected = skip), auto-throttle when sediment plumes spike, and SIGN every decision into the same tamper-proof ledger — the machines get eyes (avoid harm) AND a voice (prove it). AI runs at the edge on shipboard Cisco UCS because satellite bandwidth/latency make cloud impossible (this is our Sustainability story). Honest limitation we volunteer: underwater acoustic/tether links are NOT Cisco; Cisco begins at the surface. Cisco: UCS AI POD, CURWB, Catalyst IE. Categories: Technical + Sustainability.
3. **Cyber/Operational Risk → ZERO TRUST ARCHITECTURE**: TMC is a floating industrial plant that nation-states and activists have motive to attack. Three nightmare scenarios: data poisoning (fake or hide a violation), ransomware at sea, vessel/AIS spoofing. Defense: Duo (MFA — the anti-MGM), ISE segmentation into four sealed ship zones (the anti-Ascension), Cyber Vision (OT monitoring), Umbrella (DNS), Secure Access (ZTNA), XDR (correlation), Splunk (immutable logs). The one-way data design here is the load-bearing wall under Glass Ocean's "tamper-proof" claim. Category: Security.

Scalability extensions (one slide only): **SafeDepth** (crew health/safety on the same network — sellable to any offshore operator) and **Abyssal Weather** (governed ocean-current/climate data products — the sensors become a revenue asset even if mining never scales).

## Presentation format & the website's job
Six presenters, two per problem/solution pair. **The slides support the speakers — presenters carry the info, slides stay minimal.** This website IS the deck: slides that "sink" into three full-screen ocean simulations and surface back out (specs in Part B). Only Simulation 2 (the robot) is interactive; 1 and 3 are narrated visualizations. After the pitch, laptops circulate with the standalone robot demo. Judges include real Cisco engineers — every product name must be real and correctly used; if a visual implies a fake Cisco capability, that's worse than no visual.

## Standing instructions for every future Claude Code session
- Protect the choreography: the S-key escape hatch, clicker-only navigation, the Sim-2 freeze-into-slide moment, and the Sim-1 tamper-detection beat are presentation-critical. Never regress them.
- Performance beats beauty: mid-range laptop, projector at 1080p. If forced to cut, cut visual richness in Sim 1 first; never cut Sim 2 interactivity or the tamper beat.
- Copy discipline: don't invent new claims, stats, or Cisco products beyond those named here. Tighten wording, never add scope.
- When I ask for changes, assume the rubric above is the judge of every tradeoff (e.g., a flashy addition that muddies clarity loses points; it's a no).

---

# PART B — THE BUILD SPEC

Build a single-page presentation website that fuses a slide deck with three 3D/animated ocean simulations, for a high-school Cisco capstone pitch. The audience views it on a projector while presenters talk; slides are minimal visual support, NOT the script. The wow-factor is that slides "dissolve" into full-screen simulations and back, like the deck is floating in the ocean with us.

## Tech stack & constraints
- Vite + vanilla JS (or React if cleaner for you) + Three.js for the 3D scenes. No backend — fully static, deployable to GitHub Pages/Netlify.
- Must run smoothly on a mid-range laptop (integrated GPU) at 1080p. Cap pixel ratio, keep poly counts modest, prefer shader/particle tricks over heavy geometry. Target 60fps, degrade gracefully to 30.
- Keyboard navigation: arrow keys / space advance through EVERYTHING (slides and simulation stages), so a presenter can drive the whole show with a clicker. Add a hidden progress indicator (dots, bottom corner).
- An "escape hatch": pressing `S` skips any simulation instantly to the next slide (if a demo glitches live, we bail invisibly).
- Every simulation must also work as a standalone URL route (e.g., /robot) so we can hand laptops to judges afterward.
- Color/style: deep ocean palette (near-black blues, bioluminescent cyan/teal accents, white text), clean sans-serif (Inter or similar), Cisco-blue (#049fd9) reserved for Cisco product labels only, so Cisco tech visually pops. Subtle floating-particle backdrop on all slides (marine snow) to keep the underwater feeling everywhere.

## Overall structure (in order)
1. **Title slide** — "PROJECT GLASS OCEAN" with subtitle "Bat Bridge Partners × The Metals Company — a Cisco consulting proposal." Slow-drifting marine-snow particles; title has a gentle caustic light shimmer.
2. **The client slide** — one sentence: TMC mines battery-metal nodules from the Pacific seafloor at 4,000m; it's betting its future on AI. Three stat chips: "$320M loss 2025" / "0 AI deployed today" / "License = environmental data."
3. **The prompt-alignment slide** — "An ambitious AI adopter. New attack surface. Our job: modernize them safely & ethically." (mirrors the capstone prompt language)
4. **Problem 1 slide (Trust Deficit)** — headline "Nobody believes them." Three short bullets max.
5. → **TRANSITION → SIMULATION 1: THE GLASS BRIDGE** (spec below)
6. **Solution 1 slide (Glass Ocean)** — headline "Instead of 'trust us,' the ocean testifies." Cisco chips: Splunk, Catalyst IE, ThousandEyes, Webex.
7. **Problem 2 slide (Blind & Mute Machines)** — headline "1960s machines: blind to life, mute to regulators."
8. → **TRANSITION → SIMULATION 2: THE ROBOT (interactive)** (spec below)
9. **Solution 2 slide (AI Selective Harvesting)** — headline "Eyes AND a voice — a retrofit, not a replacement." Cisco chips: UCS AI POD, CURWB, Catalyst IE. Include small italic honesty note: "Underwater acoustic links aren't Cisco — Cisco begins at the surface."
10. **Problem 3 slide (Cyber Risk)** — headline "A floating factory with a target on its back." Three nightmare chips: data poisoning / ransomware at sea / vessel spoofing.
11. → **TRANSITION → SIMULATION 3: THE SHARKS** (spec below)
12. **Solution 3 slide (Zero Trust)** — headline "Nobody trusted by default. Not even us." Cisco chips: Duo, ISE, Cyber Vision, Umbrella, Secure Access, XDR, Splunk.
13. **Value & metrics slide** — 4 big numbers: fauna-avoidance recall target >90%, plume exceedances →0, OT anomaly detection in minutes, disputes resolvable by ledger 100%.
14. **Scalability slide** — concentric rings graphic: core (Glass Ocean + 2 AI use cases) → Ring 1 "SafeDepth" (crew safety, any offshore operator) → Ring 2 "Abyssal Weather" (ocean data for science & shipping).
15. **Roadmap slide** — 4 phases on a timeline with exit ramps marked (Phase 0 security basics → pilot → retrofit → public dashboard).
16. **Closing slide** — the thesis line: "Give the machines eyes. Give the ocean a voice. Lock both behind doors nobody can pick." Then fade in: "Turning TMC's biggest liability into its license to operate."

## Transition system (the signature move)
Slides don't cut — they SINK. On advancing into a simulation: the current slide tilts slightly, blurs, and drifts upward out of frame like viewed from underwater as the camera descends past it into the scene; particles increase; ambient light dims into the simulation's palette. On leaving a simulation: reverse — camera rises, the next slide surfaces into focus. Roughly 1.5–2s, never blocking input (advancing mid-transition jumps cleanly). Implement as a shared transition manager so all three sims use the same descend/surface language.

## SIMULATION 1 — "The Glass Bridge" (passive, ~30–45s of ambience while presenters talk)
First-person standing on a transparent glass walkway over the deep ocean, looking down. Below: a softly lit seafloor with scattered nodules, a slow sediment current, occasional fish silhouettes, a whale passing far below as a shadow with a faint sonar-ping ring. Floating holographic data cards rise gently from the water past the camera: "TURBIDITY: 2.1 NTU ✓ verified", "BIOACOUSTIC: whale detected — operations quieted ✓ verified", "SEDIMENT PLUME: within threshold ✓ verified" — each card stamps a small cyan hash icon when it passes eye level (the tamper-proof visual). Presenter advances to trigger one scripted beat: a data card flashes red "TAMPER ATTEMPT DETECTED — hash mismatch" and shatters, while the ledger sidebar visibly keeps the original intact. That beat IS the pitch. Then surface-transition to Solution 1 slide.

## SIMULATION 2 — "The Robot" (INTERACTIVE — the only interactive one)
Stage A (exterior): a low-poly collector vehicle on the seafloor, slowly orbited by the camera. Cisco-blue callout labels with leader lines fade in one by one as presenter advances: "Vision pod (cameras + LED array)", "Edge AI — Cisco UCS shipboard inference", "Signed telemetry module → tamper-proof ledger", "CURWB surface link (ship ↔ buoys)". 
Stage B (first person): advance again → camera dives INTO the robot's head; HUD appears (subtle scanlines, reticle, depth 4,012m, plume meter bottom-left). The seafloor ahead has ~8 nodules. As the reticle passes each, AI classification boxes appear: GREEN "bare nodule — collect" or RED "epifauna detected — SKIP" (make 2–3 red with tiny sponge/coral sprites on them). Interaction: mouse/trackpad aims, click (or Enter) collects a green nodule — a short satisfying grab animation, counter ticks up, and a ledger line writes itself in the corner: "07:42:11 — nodule collected — no fauna — SIGNED ✓". Clicking a RED nodule refuses: the HUD flashes "PROTECTED — skipped" and writes "07:42:30 — fauna avoided — SIGNED ✓" (the refusal is the message: even the demo won't let you harm life). If the plume meter fills from moving too fast, HUD shows "AUTO-THROTTLE ENGAGED" and speed visibly drops.
Stage C (freeze): after 2 nodule pickups, advance → the HUD freezes and desaturates, and the Solution 2 slide surfaces IN FRONT of the frozen scene (frozen sim stays dimmed as backdrop). This freeze-to-slide moment is choreographed with the presenters — make it crisp.
Standalone route /robot loops Stage B endlessly for hands-on laptop time.

## SIMULATION 3 — "The Sharks" (passive visualization, ~30s)
Stylized wireframe/hologram aesthetic (this one is a metaphor — make it read as a schematic, not real ocean, so judges get it instantly). Center: the vessel as a glowing schematic with four labeled zone-rings around it (CREW / MINING OT / SENSORS / UPLINK). Three shark silhouettes attack in sequence, each labeled on approach and each stopped by a labeled Cisco defense with a satisfying visual: (1) "PHISHING" shark lunges at CREW ring → a Duo gate materializes, shark bounces off, label "Cisco Duo — identity verified. (This one gutted MGM.)" (2) "RANSOMWARE" shark breaches the CREW ring but slams into an inner ISE wall between zones — "Cisco ISE — segmentation: breach contained. (Ascension had no walls.)" (3) "DATA POISONING" shark circles the SENSORS ring and tries to swim INTO it → a one-way valve visual: data particles stream out past the shark, but the entry is sealed — "One-way architecture — nothing writes in. Not even TMC." Finish: all three sharks circle harmlessly as XDR/Cyber Vision/Umbrella/Splunk labels constellation-in around the rings. Not interactive; presenter advances through the three attacks like slide beats.

## Content source
All slide copy above is final draft — tighten for visual fit but do not add claims. Product names must be exactly: Splunk, Cisco Duo, Cisco ISE, Cisco Cyber Vision, Cisco Umbrella, Cisco Secure Access, Cisco XDR, Cisco ThousandEyes, Cisco UCS, Cisco CURWB, Cisco Catalyst Industrial Ethernet, Webex.

## Deliverables
1. The full project, running with `npm install && npm run dev`, deployable with `npm run build` to static hosting.
2. A README with: local run steps, deploy steps for GitHub Pages, the keyboard controls cheat-sheet (arrows/space = advance, S = skip sim, R = restart robot demo), and a one-paragraph troubleshooting note for projector/display scaling.
3. A PRESENTER_NOTES.md mapping every advance-press to what appears, so six presenters can rehearse against a numbered cue list.

Build order if you need to prioritize: transition system → Simulation 2 (the interactive centerpiece) → Simulation 3 → Simulation 1 → slide polish. If performance forces cuts, cut visual richness in Sim 1 first, never the Sim 2 interaction or the tamper-detection beat.

[TEAM DECIDES]: final team member names for the title slide, and whether the closing slide includes a QR code linking to the live site.
