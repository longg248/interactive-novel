import { storyScript } from './StoryScript';
import { aiNarrator } from './AINarrator';
import { assetLoader } from './AssetLoader';
import { useGameStore } from './StateManager';
import type { GameState, SceneData, Choice, StoryNode, ScriptedParagraph } from '@/types';

export type ScenePhase =
  | 'loading'
  | 'scripted'
  | 'ai_generating'
  | 'ai_bridge'
  | 'choices'
  | 'transitioning'
  | 'ended';

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

  // Stable snapshot for useSyncExternalStore: the reference only changes when
  // the state actually changes, so React can compare it cheaply.
  private snapshot: SceneManagerState = { ...this.state };

  private subscribers: Array<() => void> = [];

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(c => c !== callback);
    };
  }

  private notify(): void {
    this.snapshot = { ...this.state };
    this.subscribers.forEach(cb => cb());
  }

  getState(): SceneManagerState {
    return this.snapshot;
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

    this.state.choices = this.state.choices.filter(
      c => !c.hidden && gameStore.evaluateConditions(c.conditions || [])
    );

    this.setPhase('scripted');
  }

  /**
   * Called by the TextBox once every paragraph of the current node has been
   * displayed. The TextBox owns the typing animation and its own paragraph
   * cursor, so the manager only needs to flip the phase and expose choices.
   */
  completeScriptedContent(): void {
    if (this.state.phase !== 'scripted' && this.state.phase !== 'ai_bridge') return;
    this.state.currentParagraphIndex = Math.max(0, this.state.scriptedParagraphs.length - 1);
    if (this.state.currentNode?.type === 'ending') {
      this.setPhase('ended');
      return;
    }
    this.setPhase('choices');
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

      this.state.scriptedParagraphs = [{ speaker: null, text: response.narrative, delay: 0 }];
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

  /** Full paragraph list of the current node - the TextBox types through all of them. */
  getParagraphs(): ScriptedParagraph[] {
    return this.state.scriptedParagraphs;
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