// ─────────────────────────────────────────────────────────────
// Directional hover fill.
// A gold layer slides in from the edge the cursor entered through and
// slides out through the edge it leaves by. Works on any element with
// the class `dfill` (and on every `.btn--ghost`). Styles: global.css.
//
// Keyboard focus fills from the bottom; touch taps simply fill;
// reduced-motion visitors get a colour fade instead of the slide.
// ─────────────────────────────────────────────────────────────

const SELECTOR = '.dfill, .btn--ghost';

function edgeOf(el, x, y) {
  const r = el.getBoundingClientRect();
  // distance to each edge, normalised so wide rows and tall cards behave alike
  const d = {
    left: (x - r.left) / r.width,
    right: (r.right - x) / r.width,
    top: (y - r.top) / r.height,
    bottom: (r.bottom - y) / r.height,
  };
  return Object.keys(d).reduce((a, b) => (d[a] < d[b] ? a : b));
}

function enter(el, edge) {
  // jump the layer to the entry edge without animating, then slide it in
  el.dataset.snap = '';
  el.dataset.edge = edge;
  delete el.dataset.fill;
  void el.offsetWidth; // apply the jump before the slide starts
  delete el.dataset.snap;
  el.dataset.fill = 'on';
}

function leave(el, edge) {
  el.dataset.edge = edge;
  delete el.dataset.fill;
}

if (typeof document !== 'undefined') {
  document.addEventListener(
    'pointerover',
    (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest?.(SELECTOR);
      if (!el || el.contains(e.relatedTarget)) return;
      enter(el, edgeOf(el, e.clientX, e.clientY));
    },
    { passive: true }
  );
  document.addEventListener(
    'pointerout',
    (e) => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest?.(SELECTOR);
      if (!el || el.contains(e.relatedTarget)) return;
      leave(el, edgeOf(el, e.clientX, e.clientY));
    },
    { passive: true }
  );
}
