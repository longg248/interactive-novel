import { useEffect, useState, useCallback } from 'react';
import { sceneManager } from '@/engine/SceneManager';

export function useSceneManager() {
  const [state, setState] = useState(sceneManager.getState());

  useEffect(() => {
    const unsubscribe = sceneManager.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    sceneManager.initialize().catch(console.error);
  }, []);

  const nextParagraph = useCallback(() => {
    sceneManager.nextParagraph();
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
    nextParagraph,
    selectChoice,
    completeAIBridge,
    skipText,
    canAdvance: sceneManager.canAdvance(),
    isShowingChoices: sceneManager.isShowingChoices(),
    currentParagraph: sceneManager.getCurrentParagraph(),
    displayedParagraphs: sceneManager.getDisplayedParagraphs(),
    choices: sceneManager.getChoices(),
  };
}