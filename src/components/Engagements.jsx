import { engagements } from '../data/studio';
import s from './Engagements.module.css';

export default function Engagements() {
  return (
    <div className={s.grid}>
      <div className={s.note}>
        <h3 className={s.noteTitle}>How pricing works</h3>
        <p>
          Every project is scoped individually, so we do not publish fixed prices. After a free discovery call you get a
          written scope with a fixed price or a clear range, and nothing is billed until you approve it.
        </p>
      </div>
      <ul role="list" className={s.list}>
        {engagements.map((e) => (
          <li key={e.name} className={s.item}>
            <h3 className={s.name}>{e.name}</h3>
            <p className={s.desc}>{e.desc}</p>
            <p className={s.best}>
              <span className="muted">Best for</span> {e.bestFor.charAt(0).toLowerCase() + e.bestFor.slice(1)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
