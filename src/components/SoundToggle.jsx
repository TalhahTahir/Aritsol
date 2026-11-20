import { sound } from '../fx/sound';
import { useSoundEnabled } from '../hooks/useSound';
import s from './SoundToggle.module.css';

/** Equaliser-style sound switch. Off by default; the choice is remembered. */
export default function SoundToggle() {
  const on = useSoundEnabled();
  return (
    <button
      type="button"
      className={`${s.toggle} ${on ? s.on : ''}`}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      title={on ? 'Sound on: soft typing and click sounds' : 'Sound off'}
      onClick={() => sound.toggle()}
    >
      <span className={s.bars} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={s.label}>{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  );
}
