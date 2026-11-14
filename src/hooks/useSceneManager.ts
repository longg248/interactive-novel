import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { sceneManager } from '@/engine/SceneManager';

export function useSceneManager() {
  const state = useSyncExternalStore(
    cb => sceneManager.subscribe(cb),
    () => sceneManager.getState(),
    () => sceneManager.getState()
  );

  useEffect(() => {
    sceneManager.initialize().catch(console.error);
  }, []);

  const completeScriptedContent = useCallback(() => {
    sceneManager.completeScriptedContent();
  }, []);

  const selectChoice = useCallback(async (choiceId: string) => {
    await sceneManager.selectChoice(choiceId);
  }, []);

  const completeAIBridge = useCallback(async (targetNodeId: string) => {
    await sceneManager.completeAIBridge(targetNodeId);
  }, []);

  const skipText = useCallback(() => {
    sceneManager.skipText();
  }, []);

  return {
    ...state,
    completeScriptedContent,
    selectChoice,
    completeAIBridge,
    skipText,
    canAdvance: sceneManager.canAdvance(),
    isShowingChoices: sceneManager.isShowingChoices(),
    currentParagraph: sceneManager.getCurrentParagraph(),
    paragraphs: sceneManager.getParagraphs(),
  };
}