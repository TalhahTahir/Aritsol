// Shared state for the ferrofluid background: the magnet's mode
// ('attract' or 'repel') and whether a visitor has tried holding yet.

let mode = 'attract';
let tried = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export const fluid = {
  get mode() {
    return mode;
  },
  get tried() {
    return tried;
  },
  setMode(m) {
    mode = m;
    emit();
  },
  markTried() {
    if (!tried) {
      tried = true;
      emit();
    }
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
