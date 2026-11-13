import { useGameStore } from '@/engine/StateManager';
import type { Choice } from '@/types';

export function useGameState() {
  const store = useGameStore();
  return {
    // State
    ...store,
    // Computed
    currentScene: store.currentSceneData,
    availableChoices: (choices: Choice[]) => choices.filter(c => store.evaluateConditions(c.conditions || [])),
    // Actions (already in store)
  };
}

export function useSettings() {
  return useGameStore((state) => ({
    settings: state.settings,
    setSettings: state.setSettings,
  }));
}

export function useSaveSystem() {
  return useGameStore((state) => ({
    saveMetadata: state.saveMetadata,
    saveGame: state.saveGame,
    loadGame: state.loadGame,
    deleteSave: state.deleteSave,
    exportSave: state.exportSave,
    importSave: state.importSave,
  }));
}