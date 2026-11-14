# Task 8: Scene Manager - Main Game Loop

## Goal
Implement the central SceneManager that orchestrates the game loop: loading assets/nodes, playing scripted content, showing choices, handling AI bridges, and transitioning between story nodes.

## Files to Create
- `src/engine/SceneManager.ts` - Central scene orchestration
- `src/hooks/useSceneManager.ts` - React hook wrapper

## Dependencies
- StateManager from Task 3 (`src/engine/StateManager.ts`)
- AssetLoader from Task 4 (`src/engine/AssetLoader.ts`)
- AINarrator from Task 6 (`src/engine/AINarrator.ts`)
- StoryScript from Task 7 (`src/engine/StoryScript.ts`)
- Scene components from Task 5

## Exact Implementation (from plan)

### SceneManager.ts
```typescript
import { storyScript } from './StoryScript';
import { aiNarrator } from './AINarrator';
import { assetLoader } from './AssetLoader';
import { useGameStore } from './StateManager';
import type { GameState, SceneData, Choice, StoryNode, ScriptedParagraph } from '@/types';

export type ScenePhase = 'loading' | 'scripted' | 'ai_generating' | 'ai_bridge' | 'choices' | 'transitioning' | 'ended';

export interface SceneManagerState {
  phase: ScenePhase;
  currentNode: StoryNode | null;
  scriptedParagraphs: ScriptedParagraph[];
  currentParagraphIndex: number;
  displayedParagraphs: ScriptedParagraph[];
  choices: Choice[];
  pendingChoice: Choice | null;
  isTransitioning: boolean;
}

class SceneManager {
  private state: SceneManagerState = {
    phase: 'loading',
    currentNode: null,
    scriptedParagraphs: [],
    currentParagraphIndex: 0,
    displayedParagraphs: [],
    choices: [],
    pendingChoice: null,
    isTransitioning: false,
  };

  private subscribers: Array<(state: SceneManagerState) => void> = [];

  subscribe(callback: (state: SceneManagerState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(c => c !== callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb(this.state));
  }

  getState(): SceneManagerState {
    return { ...this.state };
  }

  async initialize(startNodeId = 'prologue_01'): Promise<void> {
    this.setPhase('loading');
    await storyScript.loadAllNodes();
    await assetLoader.loadManifest();
    await this.startNode(startNodeId);
  }

  async startNode(nodeId: string): Promise<void> {
    const node = storyScript.getNode(nodeId);
    if (!node) {
      console.error(`Node not found: ${nodeId}`);
      return;
    }

    this.state.currentNode = node;
    storyScript.setCurrentNode(nodeId);

    await assetLoader.preloadScene(node.sceneData);

    const gameStore = useGameStore.getState();
    gameStore.setScene(nodeId, node.sceneData);
    gameStore.setChapter(node.metadata?.chapter || gameStore.chapter);

    this.state.scriptedParagraphs = storyScript.getParagraphs(node);
    this.state.currentParagraphIndex = 0;
    this.state.displayedParagraphs = [];
    this.state.choices = storyScript.getChoicesFromNode(node);

    const gameState = this.getGameState();
    this.state.choices = this.state.choices.filter(c =>
      !c.hidden && gameStore.evaluateConditions(c.conditions || [])
    );

    this.setPhase('scripted');
  }

  nextParagraph(): boolean {
    if (this.state.phase !== 'scripted') return false;
    if (this.state.currentParagraphIndex >= this.state.scriptedParagraphs.length - 1) {
      this.setPhase('choices');
      return false;
    }

    this.state.currentParagraphIndex++;
    this.notify();
    return true;
  }

  async selectChoice(choiceId: string): Promise<void> {
    if (this.state.phase !== 'choices') return;

    const choice = this.state.choices.find(c => c.id === choiceId);
    if (!choice) return;

    this.state.pendingChoice = choice;
    this.setPhase('transitioning');

    const currentNode = this.state.currentNode;
    if (!currentNode) return;

    const transition = currentNode.transitions.find(t => t.choiceId === choiceId);
    if (!transition) {
      console.error(`Transition not found for choice: ${choiceId}`);
      return;
    }

    const targetNode = storyScript.getNode(transition.targetNodeId);
    if (!targetNode) {
      console.error(`Target node not found: ${transition.targetNodeId}`);
      return;
    }

    if (transition.type === 'ai_bridge') {
      await this.generateAIBridge(choiceId, targetNode);
    } else {
      await this.startNode(transition.targetNodeId);
    }
  }

  private async generateAIBridge(choiceId: string, targetNode: StoryNode): Promise<void> {
    this.setPhase('ai_generating');

    const gameState = this.getGameState();
    const playerInput = `Player chọn: ${choiceId}. Mô tả phản ứng của NPC và chuyển cảnh đến ${targetNode.title}.`;

    try {
      const response = await aiNarrator.generateScene(gameState, undefined, playerInput);

      const currentScene = useGameStore.getState().currentSceneData;
      const newSceneData: SceneData = {
        background: response.sceneData.background || currentScene?.background || 'black',
        characters: response.sceneData.characters || currentScene?.characters || [],
        bgm: response.sceneData.bgm || currentScene?.bgm,
        transition: 'fade',
      };

      useGameStore.getState().setScene(`ai_bridge_${choiceId}`, newSceneData);

      this.state.scriptedParagraphs = [
        { speaker: null, text: response.narrative, delay: 0 }
      ];
      this.state.currentParagraphIndex = 0;
      this.state.displayedParagraphs = [];
      this.state.choices = response.choices.filter(c =>
        useGameStore.getState().evaluateConditions(c.conditions || [])
      );

      this.setPhase('ai_bridge');
    } catch (error) {
      console.error('AI Bridge generation failed:', error);
      await this.startNode(targetNode.id);
    }
  }

  async completeAIBridge(targetNodeId: string): Promise<void> {
    await this.startNode(targetNodeId);
  }

  getCurrentParagraph(): ScriptedParagraph | null {
    if (this.state.currentParagraphIndex < this.state.scriptedParagraphs.length) {
      return this.state.scriptedParagraphs[this.state.currentParagraphIndex];
    }
    return null;
  }

  getDisplayedParagraphs(): ScriptedParagraph[] {
    return this.state.scriptedParagraphs.slice(0, this.state.currentParagraphIndex + 1);
  }

  getChoices(): Choice[] {
    return this.state.choices;
  }

  private getGameState(): GameState {
    const store = useGameStore.getState();
    return {
      variables: store.variables,
      flags: store.flags,
      inventory: store.inventory,
      relationships: store.relationships,
      currentSceneId: store.currentSceneId,
      history: store.history,
      playtime: store.playtime,
      chapter: store.chapter,
    };
  }

  private setPhase(phase: ScenePhase): void {
    this.state.phase = phase;
    this.notify();
  }

  skipText(): void {
    if (this.state.phase === 'scripted' || this.state.phase === 'ai_bridge') {
      this.state.currentParagraphIndex = this.state.scriptedParagraphs.length - 1;
      this.notify();
    }
  }

  canAdvance(): boolean {
    return this.state.phase === 'scripted' || this.state.phase === 'ai_bridge';
  }

  isShowingChoices(): boolean {
    return this.state.phase === 'choices';
  }

  getSaveData(): SceneManagerState {
    return { ...this.state };
  }

  loadSaveData(data: SceneManagerState): void {
    this.state = { ...data };
    this.notify();
  }
}

export const sceneManager = new SceneManager();
```

### useSceneManager.ts
```typescript
import { useEffect, useState, useCallback } from 'react';
import { sceneManager } from '@/engine/SceneManager';
import { useGameStore } from '@/engine/StateManager';

export function useSceneManager() {
  const [state, setState] = useState(sceneManager.getState());
  const gameStore = useGameStore();

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
```

## Global Constraints
- Hybrid routing: scripted nodes use direct transitions, `ai_bridge` type uses AI generation
- AI bridge fallback: on error, transition directly to target node
- Choices filtered by `evaluateConditions` from StateManager
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-8-report.md`