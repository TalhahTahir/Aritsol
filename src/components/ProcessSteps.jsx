import { useRef, useState } from 'react';
import { useContent } from '../content/store';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { sound } from '../fx/sound';
import s from './ProcessSteps.module.css';

/** The five steps; a line draws through them as you scroll and each step lights up in turn. */
export default function ProcessSteps() {
  const ref = useRef(null);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);
  const { process } = useContent();
  const count = useRef(process.length);
  count.current = process.length;

  useScrollProgress(ref, {
    end: 0.3,
    onProgress: (p) => {
      const idx = Math.floor(p * (count.current - 1) + 0.08);
      const next = p <= 0.02 ? -1 : Math.min(count.current - 1, idx);
      if (next !== activeRef.current) {
        if (next > activeRef.current) sound.click(0.55);
        activeRef.current = next;
        setActive(next);
      }
    },
  });

  return (
    <ol ref={ref} role="list" className={s.steps}>
      {process.map((step, i) => (
        <li key={step._id || step.title} className={`${s.step} ${i <= active ? s.lit : ''}`}>
          <span className={s.num} aria-hidden="true">
            {i + 1}
          </span>
          <h3 className={s.title}>{step.title}</h3>
          <p className={s.desc}>{step.desc}</p>
        </li>
      ))}
    </ol>
  );
}
