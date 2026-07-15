/**
 * The full show as a flat list of clicker presses.
 * Each cue is either { slide } or { demo:n }.
 *
 * The three "Live Demo" filler slides (page-09 / page-14 / page-18) are gone —
 * their slots are now the actual Claude-designed demos, which the deck sinks
 * into and surfaces out of. Each demo owns its own internal beats.
 */
export const SEQUENCE = [
  { slide: 'page-01' },  //  1 Title
  { slide: 'page-02' },  //  2 Team
  { slide: 'page-03' },  //  3 Client
  { slide: 'page-04' },  //  4 Roadmap
  { slide: 'page-05' },  //  5 Implementation & Risk
  { slide: 'page-06' },  //  6 Glass Ocean / Our Problem
  { slide: 'page-07' },  //  7 Glass Ocean / Our Solution
  { slide: 'page-08' },  //  8 Glass Ocean / Cisco Tech
  { demo: 1 },           //  9 SINK → Demo 1: Glass Ocean live dashboard (was page-09)
  { slide: 'page-10' },  // 10 Mining in the Dark / Our Problem
  { slide: 'page-11' },  // 11 Mining in the Dark / Our Solution
  { slide: 'page-12' },  // 12 Mining in the Dark / Cisco Tech
  { slide: 'page-13' },  // 13 Mining in the Dark / Where Cisco Starts
  { demo: 2 },           // 14 SINK → Demo 2: Robot Cam selective harvesting (was page-14)
  { slide: 'page-15' },  // 15 Zero Trust / Our Problem
  { slide: 'page-16' },  // 16 Zero Trust / Our Solution
  { slide: 'page-17' },  // 17 Zero Trust / Cisco Tech
  { demo: 3 },           // 18 SINK → Demo 3: Shark Attack live threat view (was page-18)
  { slide: 'page-19' },  // 19 Value & Metrics
  { slide: 'page-20' },  // 20 Scalability
  { slide: 'page-21' },  // 21 Two More Markets
  { slide: 'page-22' },  // 22 The Deciding Metric
  { slide: 'page-23' },  // 23 Thank You
]

/** Chapter id per cue (for the progress dots): consecutive cues sharing a slide/demo collapse to one dot. */
export function chapters(sequence) {
  const ids = []
  const cueChapter = []
  let prev = null
  for (const cue of sequence) {
    const id = cue.demo != null ? `demo-${cue.demo}` : cue.slide
    if (id !== prev) ids.push(id)
    cueChapter.push(ids.length - 1)
    prev = id
  }
  return { ids, cueChapter }
}
