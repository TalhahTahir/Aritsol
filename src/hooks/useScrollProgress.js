import { useEffect, useRef } from 'react';

/**
 * Scroll-linked progress for an element, without re-rendering React.
 * Writes `--p` (0 → 1) on the element and calls `onProgress(p)` every frame
 * while it changes.
 *
 * mode 'pin'  : 0 when the element's top reaches the top of the viewport,
 *               1 when its bottom reaches the bottom (for sticky sections).
 * mode 'pass' : 0 when the element's top enters at the bottom of the viewport,
 *               1 when its top reaches `end` (fraction of viewport height).
 */
export function useScrollProgress(ref, { mode = 'pass', end = 0.35, onProgress } = {}) {
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let last = -1;

    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      let p;
      if (mode === 'pin') {
        const total = r.height - vh;
        p = total > 0 ? -r.top / total : 0;
      } else {
        p = (vh - r.top) / (vh - vh * end);
      }
      p = Math.min(1, Math.max(0, p));
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      el.style.setProperty('--p', p.toFixed(4));
      cb.current?.(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, mode, end]);
}
