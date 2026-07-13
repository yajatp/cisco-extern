/**
 * The full show as a flat list of clicker presses.
 * Each cue is either { slide } or { sim, stage }.
 * `freezeSim: true` = the slide surfaces IN FRONT of the frozen sim (Sim-2 Stage C).
 * `build` = intra-slide reveal step.
 */
export const SEQUENCE = [
  { slide: 'title' },                     //  1
  { slide: 'client' },                    //  2
  { slide: 'alignment' },                 //  3
  { slide: 'problem1' },                  //  4
  { sim: 'bridge', stage: 0 },            //  5  descend into the Glass Bridge
  { sim: 'bridge', stage: 1 },            //  6  TAMPER-DETECTION BEAT
  { slide: 'solution1' },                 //  7  surface
  { slide: 'problem2' },                  //  8
  { sim: 'robot', stage: 0 },             //  9  descend — robot exterior orbit
  { sim: 'robot', stage: 1 },             // 10  callout: vision pod
  { sim: 'robot', stage: 2 },             // 11  callout: edge AI / UCS
  { sim: 'robot', stage: 3 },             // 12  callout: signed telemetry
  { sim: 'robot', stage: 4 },             // 13  callout: CURWB surface link
  { sim: 'robot', stage: 5 },             // 14  DIVE INTO THE HEAD — interactive
  { slide: 'solution2', freezeSim: true },// 15  FREEZE-INTO-SLIDE moment
  { slide: 'problem3' },                  // 16
  { sim: 'sharks', stage: 0 },            // 17  descend — schematic appears
  { sim: 'sharks', stage: 1 },            // 18  attack 1: phishing vs Duo
  { sim: 'sharks', stage: 2 },            // 19  attack 2: ransomware vs ISE
  { sim: 'sharks', stage: 3 },            // 20  attack 3: data poisoning vs one-way
  { sim: 'sharks', stage: 4 },            // 21  defense constellation
  { slide: 'solution3' },                 // 22  surface
  { slide: 'value' },                     // 23
  { slide: 'scalability' },               // 24
  { slide: 'roadmap' },                   // 25
  { slide: 'closing', build: 0 },         // 26  thesis line
  { slide: 'closing', build: 1 },         // 27  fade-in: license to operate
]

/** Chapter id per cue (for the progress dots): consecutive cues sharing a slide/sim collapse to one dot. */
export function chapters(sequence) {
  const ids = []
  const cueChapter = []
  let prev = null
  for (const cue of sequence) {
    const id = cue.sim || cue.slide
    if (id !== prev) ids.push(id)
    cueChapter.push(ids.length - 1)
    prev = id
  }
  return { ids, cueChapter }
}
