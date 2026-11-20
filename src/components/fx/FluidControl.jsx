import { useSyncExternalStore } from 'react';
import { fluid } from '../../fx/fluid-store';
import s from './FluidControl.module.css';

const useFluid = () =>
  useSyncExternalStore(
    (cb) => fluid.subscribe(cb),
    () => `${fluid.mode}|${fluid.tried}`,
    () => 'attract|false'
  ).split('|');

/** Small switch for the ferrofluid magnet: attract or repel, plus a first-time hint. */
export default function FluidControl() {
  const [mode, tried] = useFluid();
  return (
    <div className={s.control} role="group" aria-label="Ferrofluid magnet">
      <span className={s.icon} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M6 7h4M14 7h4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </span>
      <button type="button" className={s.opt} aria-pressed={mode === 'attract'} onClick={() => fluid.setMode('attract')}>
        Attract
      </button>
      <button type="button" className={s.opt} aria-pressed={mode === 'repel'} onClick={() => fluid.setMode('repel')}>
        Repel
      </button>
      <span className={`${s.hint} ${tried === 'true' ? s.hide : ''}`}>Press and hold on empty space</span>
    </div>
  );
}
