import { useEffect, useRef } from 'react';
import s from './Magnetic.module.css';

/** Wrap a button/link so it leans toward the cursor when it comes close. */
export default function Magnetic({ children, strength = 0.3 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || !fine || reduced) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={s.mag}>
      {children}
    </span>
  );
}
