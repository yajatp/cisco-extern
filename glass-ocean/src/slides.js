/* Programmatically load the Veritas Blue slide deck images */

// Photographic slides ship as compressed JPEG (small, fast to decode); the rest
// are flat-graphic PNGs that compress well as-is.
const JPG = new Set(['page-21'])
const DEFS = {}
for (let i = 1; i <= 21; i++) {
  const num = String(i).padStart(2, '0')
  const id = `page-${num}`
  const ext = JPG.has(id) ? 'jpg' : 'png'
  DEFS[id] = `<img src="slides/${id}.${ext}" alt="Slide ${i}" class="slide-img" />`
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

  // Pre-decode every slide bitmap up front so a heavy image (e.g. the photographic
  // thank-you slide) can never paint half-way through its fade — the browser has a
  // ready bitmap the instant the slide is shown.
  for (const el of Object.values(els)) {
    const img = el.querySelector('img')
    img?.decode?.().catch(() => {})
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
    // Keep as a no-op for sequence compatibility
  }

  return { show, hide, setBuild, get currentId() { return currentId } }
}
