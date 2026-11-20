// Shared state for the ferrofluid background's magnet: attract or repel.
// The switch in the corner writes it, the simulation reads it.

const KEY = 'artisol-magnet';
let mode = 'attract';
try {
  if (localStorage.getItem(KEY) === 'repel') mode = 'repel';
} catch {
  /* storage blocked */
}
const listeners = new Set();

export const magnet = {
  get mode() {
    return mode;
  },
  setMode(next) {
    mode = next === 'repel' ? 'repel' : 'attract';
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
    listeners.forEach((fn) => fn(mode));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
