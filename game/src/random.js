// A tiny seeded random generator, so ?seed=N replays the same shift.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  }
  function int(max) { return Math.floor(next() * max); }
  function pick(list) { return list[int(list.length)]; }
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }
  return { next, int, pick, shuffle };
}
