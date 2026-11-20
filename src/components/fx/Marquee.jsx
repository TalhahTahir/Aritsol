import { useEffect, useRef } from 'react';
import s from './Marquee.module.css';

/**
 * Big rows of words drifting sideways. Scrolling the page speeds them up
 * (in the direction you scroll). Static for reduced-motion visitors.
 */
export default function Marquee({ rows }) {
  const wrap = useRef(null);
  const tracks = useRef([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const offsets = rows.map(() => 0);
    let lastY = window.scrollY;
    let velocity = 0;
    let raf = 0;
    let visible = false;

    const loop = () => {
      const y = window.scrollY;
      velocity += (y - lastY - velocity) * 0.12;
      lastY = y;
      tracks.current.forEach((el, i) => {
        if (!el) return;
        const half = el.scrollWidth / 2;
        const dir = i % 2 === 0 ? -1 : 1;
        offsets[i] += dir * (0.45 + Math.abs(velocity) * 0.18) * (velocity < 0 ? -1 : 1);
        if (offsets[i] <= -half) offsets[i] += half;
        if (offsets[i] > 0) offsets[i] -= half;
        el.style.transform = `translate3d(${offsets[i]}px,0,0)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        lastY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(wrap.current);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [rows]);

  return (
    <div ref={wrap} className={s.marquee}>
      {rows.map((words, i) => (
        <div key={i} className={s.row} aria-hidden={i > 0 ? 'true' : undefined}>
          <div ref={(el) => (tracks.current[i] = el)} className={s.track}>
            {[0, 1].map((copy) =>
              words.map((w, j) => (
                <span key={`${copy}-${j}`} className={(j + i) % 2 ? s.outline : s.solid} aria-hidden={copy ? 'true' : undefined}>
                  {w}
                </span>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
