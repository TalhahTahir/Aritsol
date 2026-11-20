import { useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { sound } from '../../fx/sound';
import s from './TypeHeading.module.css';

/**
 * A heading that types itself out when it scrolls into view, with soft
 * keyboard taps when sound is on. Space for the full text is reserved from
 * the start, so nothing below it jumps. Screen readers get the full text.
 */
export default function TypeHeading({ as: Tag = 'h2', children, className = '', speed = 32 }) {
  const text = String(children);
  const ref = useRef(null);
  const inView = useInView(ref, { threshold: 0.6 });
  const reduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const [count, setCount] = useState(reduced ? text.length : 0);
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (!inView || reduced) return;
    let i = 0;
    let id;
    const step = () => {
      i += 1;
      setCount(i);
      const ch = text[i - 1];
      // not every character clicks: keeps it gentle and natural
      if (ch && ch !== ' ' && Math.random() < 0.7) sound.key(0.85);
      if (i < text.length) {
        const pause = ch === ' ' ? speed * 1.6 : ch === ',' || ch === '.' ? speed * 4 : speed;
        id = setTimeout(step, pause * (0.6 + Math.random() * 0.8));
      } else {
        id = setTimeout(() => setDone(true), 900);
      }
    };
    id = setTimeout(step, 120);
    return () => clearTimeout(id);
  }, [inView, reduced, text, speed]);

  // Words are kept whole (no mid-word line breaks); spaces sit between them.
  let index = 0;
  const char = (ch) => {
    const i = index++;
    return (
      <span key={i} className={i < count ? s.on : s.off}>
        {ch}
        {i === count - 1 && !done && <span className={s.caret} />}
      </span>
    );
  };
  const words = [];
  text.split(' ').forEach((word, w, arr) => {
    words.push(
      <span key={`w${w}`} className={s.word}>
        {word.split('').map(char)}
      </span>
    );
    if (w < arr.length - 1) words.push(char(' '));
  });

  return (
    <Tag ref={ref} className={`${s.heading} ${className}`} aria-label={text}>
      <span aria-hidden="true">
        {count === 0 && !done && <span className={s.caret} />}
        {words}
      </span>
    </Tag>
  );
}
