import { useMutation } from '@tanstack/react-query';
import { aiNarrator } from '@/engine/AINarrator';
import { useGameStore } from '@/engine/StateManager';
import type { SceneData } from '@/types';

export function useAINarrator() {
  const gameState = useGameStore((s) => ({
    variables: s.variables,
    flags: s.flags,
    relationships: s.relationships,
    inventory: s.inventory,
    currentSceneId: s.currentSceneId,
    history: s.history,
    playtime: s.playtime,
    chapter: s.chapter,
  }));
  const applyStateChanges = useGameStore((s) => ({
    setVariable: s.setVariable,
    setFlag: s.setFlag,
    changeRelationship: s.changeRelationship,
    addItem: s.addItem,
    removeItem: s.removeItem,
  }));
  const setScene = useGameStore((s) => s.setScene);
  const addHistory = useGameStore((s) => s.addHistory);

  const generateSceneMutation = useMutation({
    mutationFn: async ({ sceneContext, playerInput }: { sceneContext?: SceneData; playerInput?: string }) => {
      return aiNarrator.generateScene(gameState, sceneContext, playerInput);
    },
    onSuccess: (response) => {
      if (response.stateChanges.variables) {
        Object.entries(response.stateChanges.variables).forEach(([key, value]) => {
          if (value !== undefined) applyStateChanges.setVariable(key, value);
        });
      }
      if (response.stateChanges.flags) {
        Object.entries(response.stateChanges.flags).forEach(([key, value]) => {
          if (value !== undefined) applyStateChanges.setFlag(key, value);
        });
      }
      if (response.stateChanges.relationships) {
        Object.entries(response.stateChanges.relationships).forEach(([charId, delta]) => {
          if (delta !== undefined) applyStateChanges.changeRelationship(charId, delta);
        });
      }
      if (response.stateChanges.inventoryAdd) {
        response.stateChanges.inventoryAdd.forEach(item => applyStateChanges.addItem(item));
      }
      if (response.stateChanges.inventoryRemove) {
        response.stateChanges.inventoryRemove.forEach(id => applyStateChanges.removeItem(id));
      }

      addHistory({
        sceneId: gameState.currentSceneId || '',
        speaker: null,
        text: response.narrative,
        type: 'narrative',
      });

      if (response.sceneData.background || response.sceneData.characters?.length) {
        const currentScene = useGameStore.getState().currentSceneData;
        const newSceneData: SceneData = {
          background: response.sceneData.background || currentScene?.background || 'black',
          characters: response.sceneData.characters || currentScene?.characters || [],
          bgm: response.sceneData.bgm || currentScene?.bgm,
          transition: response.sceneData.transition || 'fade',
        };
        setScene(gameState.currentSceneId || 'ai_generated', newSceneData);
      }
    },
    onError: (error) => {
      console.error('AI Narrator mutation failed:', error);
    },
  });

  const generateScene = (sceneContext?: SceneData, playerInput?: string) => {
    return generateSceneMutation.mutateAsync({ sceneContext, playerInput });
  };

  const cancel = () => {
    aiNarrator.cancel();
    generateSceneMutation.reset();
  };

  return {
    generateScene,
    cancel,
    isLoading: generateSceneMutation.isPending,
    error: generateSceneMutation.error,
    lastResponse: generateSceneMutation.data,
  };
}