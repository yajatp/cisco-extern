import { lerp, easeInOut, easeIn } from './util.js'
import { chapters } from './sequence.js'

const DESCEND_HEIGHT = 26 // world units the camera rig sinks through on enter
const DESCEND_TIME = 1.8
const SURFACE_TIME = 1.6
const FAST_TIME = 0.28

/**
 * Deck drives the whole show off the flat cue SEQUENCE.
 * Every sim exposes: scene, camera, descend {y}, overlayEl,
 * enter(), exit(), setStage(n), update(dt), and optionally freeze()/unfreeze().
 */
export class Deck {
  constructor({ stage, slides, sims, sequence, dotsEl }) {
    this.stage = stage
    this.slides = slides
    this.sims = sims
    this.sequence = sequence
    this.index = -1
    this.activeSim = null // sim currently live on the canvas
    this.frozenSim = null // sim frozen behind an overlay slide
    const { ids, cueChapter } = chapters(sequence)
    this.cueChapter = cueChapter
    this.dots = ids.map(() => {
      const d = document.createElement('span')
      d.className = 'dot'
      dotsEl.appendChild(d)
      return d
    })
    this.bindKeys()
  }

  start() {
    this.goTo(0, { instant: true })
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault()
          this.next()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          this.prev()
          break
        case 's':
        case 'S':
          this.skipSim()
          break
        case 'r':
        case 'R':
          if (this.activeSim === this.sims.robot) this.sims.robot.restart()
          break
        case 'Home':
          this.goTo(0, { fast: true })
          break
      }
    })
  }

  next() {
    this.goTo(this.index + 1)
  }
  prev() {
    this.goTo(this.index - 1)
  }

  /** S key: bail out of any simulation straight to the next slide cue. */
  skipSim() {
    const cur = this.sequence[this.index]
    if (!cur?.sim) return
    let i = this.index + 1
    while (i < this.sequence.length && this.sequence[i].sim) i++
    if (i < this.sequence.length) this.goTo(i, { fast: true })
  }

  goTo(target, { fast = false, instant = false } = {}) {
    if (target < 0 || target >= this.sequence.length || target === this.index) return
    this.stage.finishTweens()
    const to = this.sequence[target]
    this.index = target

    if (to.sim) this.enterSimCue(to, fast)
    else this.enterSlideCue(to, fast, instant)
    this.updateDots()
  }

  /* ---------- sim cues ---------- */
  enterSimCue(to, fast) {
    const sim = this.sims[to.sim]

    // already live: just move between stages
    if (this.activeSim === sim) {
      sim.setStage(to.stage)
      return
    }

    // stepping backward from the freeze-overlay slide into the frozen sim
    if (this.frozenSim === sim) {
      this.frozenSim = null
      this.activeSim = sim
      this.slides.hide('fade', true)
      sim.unfreeze?.()
      this.stage.setFrozen(false)
      sim.overlayEl.classList.remove('frozen')
      sim.setStage(to.stage)
      return
    }

    // fresh entry: the signature sink transition
    this.cleanupFrozen()
    if (this.activeSim) this.detachSim(this.activeSim) // e.g. jumping sim→sim
    this.slides.hide('sink', fast)
    sim.enter()
    sim.setStage(to.stage)
    sim.descend.y = fast ? 0 : DESCEND_HEIGHT
    this.stage.setSim(sim)
    sim.overlayEl.classList.add('visible')
    this.activeSim = sim
    if (!fast) {
      this.stage.addTween({
        duration: DESCEND_TIME,
        ease: easeInOut,
        update: (e) => { sim.descend.y = lerp(DESCEND_HEIGHT, 0, e) },
      })
    }
  }

  /* ---------- slide cues ---------- */
  enterSlideCue(to, fast, instant) {
    // Sim-2 Stage C: freeze the sim and surface the slide IN FRONT of it
    if (this.activeSim && to.freezeSim) {
      const sim = this.activeSim
      this.activeSim = null
      this.frozenSim = sim
      sim.freeze?.()
      this.stage.setFrozen(true)
      sim.overlayEl.classList.add('frozen')
      this.slides.show(to.slide, 'surface', fast, to.build)
      return
    }

    // normal exit from a live sim: camera surfaces while the slide comes into focus
    if (this.activeSim) {
      const sim = this.activeSim
      this.activeSim = null
      sim.overlayEl.classList.remove('visible')
      const done = () => {
        if (this.stage.sim === sim) this.stage.setSim(null)
        sim.exit()
      }
      if (fast) {
        done()
      } else {
        this.stage.addTween({
          duration: SURFACE_TIME,
          ease: easeIn,
          update: (e) => { sim.descend.y = lerp(0, DESCEND_HEIGHT, e) },
          complete: done,
        })
      }
      this.slides.show(to.slide, 'surface', fast, to.build)
      return
    }

    // arriving at the freeze slide from the OTHER side (stepping backward from problem3):
    // rebuild the frozen backdrop so the choreography still reads
    if (to.freezeSim && !this.frozenSim) {
      const sim = this.sims.robot
      sim.enter()
      sim.setStage(5)
      sim.descend.y = 0
      this.stage.setSim(sim)
      sim.overlayEl.classList.add('visible', 'frozen')
      this.frozenSim = sim
      // let a couple of frames render before freezing the canvas on that frame
      setTimeout(() => {
        if (this.frozenSim === sim) {
          sim.freeze?.()
          this.stage.setFrozen(true)
        }
      }, 120)
      this.slides.show(to.slide, 'fade', true, to.build)
      return
    }

    // leaving the freeze-overlay slide onward: clean up the frozen backdrop
    if (this.frozenSim && !to.freezeSim) this.cleanupFrozen()

    this.slides.show(to.slide, instant ? 'none' : 'fade', fast, to.build)
  }

  cleanupFrozen() {
    if (!this.frozenSim) return
    const sim = this.frozenSim
    this.frozenSim = null
    this.stage.setFrozen(false)
    this.detachSim(sim)
  }

  detachSim(sim) {
    sim.overlayEl.classList.remove('visible', 'frozen')
    if (this.stage.sim === sim) this.stage.setSim(null)
    sim.unfreeze?.()
    sim.exit()
  }

  updateDots() {
    const ch = this.cueChapter[this.index]
    this.dots.forEach((d, i) => d.classList.toggle('on', i === ch))
  }
}
