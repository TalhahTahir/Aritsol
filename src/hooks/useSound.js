import { useSyncExternalStore } from 'react';
import { sound } from '../fx/sound';

/** Current sound on/off state, re-rendering when it changes. */
export function useSoundEnabled() {
  return useSyncExternalStore(
    (cb) => sound.subscribe(cb),
    () => sound.enabled,
    () => false
  );
}
