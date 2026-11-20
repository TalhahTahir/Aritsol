import { useEffect, useRef } from 'react';
import s from './TextPressure.module.css';

/**
 * Variable-font pressure: each letter's weight and width respond to how
 * close the cursor is. Uses Bricolage Grotesque's variable axes
 * (wght 200–800, wdth 75–100). The word is sized to fill its container.
 *
 * Mouse: letters swell near the cursor.
 * Touch: a slow swell travels across the word as you scroll.
 * Reduced motion: a static, bold word.
 */
const AXES = {
  wght: [300, 800],
  wdth: [75, 100],
};
const RADIUS = 0.42; // of the container width

export default function TextPressure({ text, className = '' }) {
  const wrap = useRef(null);
  const letters = useRef([]);

  useEffect(() => {
    const el = wrap.current;
    const spans = letters.current.filter(Boolean);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const set = (span, t) => {
      const w = AXES.wght[0] + (AXES.wght[1] - AXES.wght[0]) * t;
      const d = AXES.wdth[0] + (AXES.wdth[1] - AXES.wdth[0]) * t;
      span.style.fontVariationSettings = `'wght' ${w.toFixed(0)}, 'wdth' ${d.toFixed(1)}, 'opsz' 96`;
    };

    // Size the word so that, fully "pressed", it just fills the width.
    const fit = () => {
      el.style.fontSize = '100px';
      spans.forEach((sp) => set(sp, 1));
      const natural = spans.reduce((sum, sp) => sum + sp.getBoundingClientRect().width, 0);
      const size = (el.clientWidth / natural) * 100 * 0.98;
      el.style.fontSize = `${size}px`;
      spans.forEach((sp, i) => set(sp, values[i]));
    };

    const values = spans.map(() => (reduced ? 0.8 : 0));
    const targets = spans.map(() => 0);
    const pointer = { x: -1e4, y: -1e4 };
    let raf = 0;
    let visible = false;

    const tick = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const radius = rect.width * RADIUS;
      let moving = false;

      if (!fine) {
        // touch: a soft wave moves across as the word scrolls through the screen
        const p = 1 - (rect.top + rect.height / 2) / window.innerHeight; // 0 → 1 while passing
        const cx = rect.left + rect.width * (p * 1.4 - 0.2);
        spans.forEach((sp, i) => {
          const r = sp.getBoundingClientRect();
          const d = Math.abs(r.left + r.width / 2 - cx);
          targets[i] = Math.max(0, 1 - d / radius) ** 1.6;
        });
      } else {
        spans.forEach((sp, i) => {
          const r = sp.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - pointer.x, r.top + r.height / 2 - pointer.y);
          const t = Math.max(0, 1 - d / radius);
          targets[i] = t * t * (3 - 2 * t); // smoothstep
        });
      }

      spans.forEach((sp, i) => {
        const delta = targets[i] - values[i];
        if (Math.abs(delta) > 0.002) {
          values[i] += delta * 0.14;
          moving = true;
          set(sp, values[i]);
        }
      });
      if (moving && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      kick();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit);

    if (reduced) {
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      kick();
    });
    io.observe(el);
    if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    else window.addEventListener('scroll', kick, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', kick);
    };
  }, [text]);

  return (
    <div ref={wrap} className={`${s.pressure} ${className}`} aria-hidden="true">
      {text.split('').map((ch, i) => (
        <span key={i} ref={(n) => (letters.current[i] = n)} className={s.letter}>
          {ch}
        </span>
      ))}
    </div>
  );
}
