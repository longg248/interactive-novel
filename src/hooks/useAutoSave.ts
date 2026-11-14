import { useEffect } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function useAutoSave() {
  const { saveGame, saveMetadata } = useGameStore();

  // Auto-save on choice selection (handled by SceneManager)
  // This hook handles periodic saves and beforeunload

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Quick save to current slot or slot 1
      const currentSlot = saveMetadata.currentSlot ?? 1;
      saveGame(currentSlot);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveGame, saveMetadata.currentSlot]);

  // Periodic auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSlot = saveMetadata.currentSlot ?? 1;
      saveGame(currentSlot);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [saveGame, saveMetadata.currentSlot]);
}