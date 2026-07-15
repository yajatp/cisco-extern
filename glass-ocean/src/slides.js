/* Programmatically load the Veritas Blue slide deck images */

const DEFS = {}
for (let i = 1; i <= 23; i++) {
  const num = String(i).padStart(2, '0')
  DEFS[`page-${num}`] = `<img src="slides/page-${num}.png" alt="Slide ${i}" class="slide-img" />`
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
    // Keep as a no-op for sequence compatibility
  }

  return { show, hide, setBuild, get currentId() { return currentId } }
}
