import { chapters } from './sequence.js'

/**
 * Deck drives the whole show off the flat cue SEQUENCE.
 * A cue is either { slide } or { demo:n }. Slides are PNG layers; demos are
 * pre-warmed iframes. Entering a demo SINKS the slide out and raises the demo;
 * leaving a demo SURFACES the next slide up over it. While a demo is live it
 * owns the clicker — the deck forwards arrows into it and only advances slides
 * again when the demo signals a boundary (veritas-demo-next / -prev).
 */
export class Deck {
  constructor({ slides, demos, bubbles, sequence, dotsEl }) {
    this.slides = slides
    this.demos = demos
    this.bubbles = bubbles
    this.sequence = sequence
    this.index = -1
    this.activeDemo = null // demo number currently live on screen, or null
    const { ids, cueChapter } = chapters(sequence)
    this.cueChapter = cueChapter
    this.dots = ids.map(() => {
      const d = document.createElement('span')
      d.className = 'dot'
      dotsEl.appendChild(d)
      return d
    })
    this.bindKeys()
    this.bindMessages()
    this.bindClick()
  }

  start() {
    this.goTo(0, { instant: true })
    this.reclaimFocus()
  }

  /**
   * Pull keyboard focus back to the deck. A preloaded demo iframe can grab focus
   * on load (or from a mouse click), which silently kills arrow-key nav until you
   * click the page — so whenever we land on a slide, blur whatever stole focus and
   * hand it back to the top window.
   */
  reclaimFocus() {
    const el = document.activeElement
    if (el && el !== document.body && typeof el.blur === 'function') el.blur()
    try {
      window.focus()
    } catch {}
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return

      // Global hatches work everywhere.
      if (e.key === 'Home') {
        e.preventDefault()
        return this.goTo(0, { instant: true })
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        return this.skipDemo()
      }

      // While a demo is live it owns the beats: forward the press into it and
      // never navigate slides ourselves (avoids double-navigation at the seam).
      if (this.activeDemo != null) {
        if (['ArrowRight', ' ', 'PageDown', 'ArrowLeft', 'PageUp'].includes(e.key)) {
          e.preventDefault()
          const key =
            e.key === 'PageDown' ? 'ArrowRight' : e.key === 'PageUp' ? 'ArrowLeft' : e.key
          this.demos.forwardKey(this.activeDemo, key)
        }
        return
      }

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
      }
    })
  }

  /** Click anywhere to advance, like pressing →. */
  bindClick() {
    window.addEventListener('click', (e) => {
      // don't hijack the corner UI controls
      if (e.target?.closest?.('#fs-btn')) return
      // while a demo is live, clicks belong to the demo (mouse-driven beats)
      if (this.activeDemo != null) return
      this.next()
    })
  }

  /** Demos surface back to the deck by posting a boundary message. */
  bindMessages() {
    window.addEventListener('message', (e) => {
      const d = e.data
      if (!d || typeof d !== 'object' || this.activeDemo == null) return
      if (d.type === 'veritas-demo-next') this.next()
      else if (d.type === 'veritas-demo-prev') this.prev()
    })
  }

  next() {
    this.goTo(this.index + 1)
  }
  prev() {
    this.goTo(this.index - 1)
  }

  /** S key: bail out of the live demo straight to the slide after it. */
  skipDemo() {
    if (this.activeDemo == null) return
    let i = this.index + 1
    while (i < this.sequence.length && this.sequence[i].demo != null) i++
    if (i < this.sequence.length) this.goTo(i)
  }

  goTo(target, { instant = false } = {}) {
    if (target < 0 || target >= this.sequence.length || target === this.index) return
    const forward = target > this.index
    const to = this.sequence[target]
    this.index = target
    if (to.demo != null) this.enterDemo(to.demo)
    else this.enterSlide(to, instant, forward)
    this.updateDots()
  }

  /* ---------- demo cues ---------- */
  enterDemo(n) {
    if (this.activeDemo === n) return
    // hand off any other live demo first (jumping demo→demo shouldn't happen,
    // but keep it safe)
    if (this.activeDemo != null) this.demos.hide(this.activeDemo)
    this.slides.hide('sink')
    this.demos.show(n)
    this.activeDemo = n
    this.demos.setActive(n) // the demo now owns the clicker
    this.demos.focus(n) // land keyboard + mouse beats in the demo itself
  }

  /* ---------- slide cues ---------- */
  enterSlide(to, instant, forward) {
    if (this.activeDemo != null) {
      // surfacing up out of a demo: the slide rises over the demo, demo sinks away
      this.demos.hide(this.activeDemo)
      this.demos.setActive(null)
      this.activeDemo = null
      this.slides.show(to.slide, 'surface')
      this.reclaimFocus() // take the clicker back from the demo iframe
      return
    }
    // a bubble sweep breathes over each forward slide change
    if (forward && !instant) this.bubbles?.burst()
    this.slides.show(to.slide, instant ? 'none' : 'fade')
    this.reclaimFocus()
  }

  updateDots() {
    const ch = this.cueChapter[this.index]
    this.dots.forEach((d, i) => d.classList.toggle('on', i === ch))
  }
}
