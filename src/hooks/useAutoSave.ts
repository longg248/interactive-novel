import { useEffect } from 'react';
import { useGameStore } from '@/engine/StateManager';

const AUTOSAVE_SLOT = 0; // manual slots 1..10 are never overwritten automatically
const INTERVAL_MS = 5 * 60 * 1000;

export function useAutoSave() {
  useEffect(() => {
    const save = () => {
      // saveGame returns false (and writes nothing) when no scene has started yet.
      useGameStore.getState().saveGame(AUTOSAVE_SLOT);
    };
    window.addEventListener('beforeunload', save);
    const interval = window.setInterval(save, INTERVAL_MS);
    return () => {
      window.removeEventListener('beforeunload', save);
      window.clearInterval(interval);
    };
  }, []);
}
