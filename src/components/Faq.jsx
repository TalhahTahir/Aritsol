import { FiPlus } from 'react-icons/fi';
import { faqs } from '../data/studio';
import s from './Faq.module.css';

export default function Faq({ items = faqs }) {
  return (
    <div className={s.list}>
      {items.map((f) => (
        <details key={f.q} className={s.item}>
          <summary className={s.q}>
            <span>{f.q}</span>
            <FiPlus aria-hidden className={s.icon} />
          </summary>
          <p className={s.a}>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
