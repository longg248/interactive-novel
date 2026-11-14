import { storyScript } from './StoryScript';
import { aiNarrator } from './AINarrator';
import { assetLoader } from './AssetLoader';
import { useGameStore } from './StateManager';
import type {
  GameState,
  SceneData,
  Choice,
  StoryNode,
  ScriptedParagraph,
  StateChanges,
  CharacterSprite,
} from '@/types';

export type ScenePhase =
  | 'loading'
  | 'scripted'
  | 'ai_generating'
  | 'ai_bridge'
  | 'choices'
  | 'transitioning'
  | 'ended'
  | 'error';

export const BRIDGE_CONTINUE_CHOICE_ID = '__bridge_continue__';

export interface SceneManagerState {
  phase: ScenePhase;
  currentNode: StoryNode | null;
  scriptedParagraphs: ScriptedParagraph[];
  currentParagraphIndex: number;
  displayedParagraphs: ScriptedParagraph[];
  choices: Choice[];
  pendingChoice: Choice | null;
  isTransitioning: boolean;
  /** Node to start once the player finishes reading an AI bridge. */
  bridgeTargetNodeId: string | null;
  /** Changes on every new scene so the UI can remount reliably. */
  sceneKey: number;
  errorMessage: string | null;
}

const MAX_RELATIONSHIP_DELTA = 15;
const MAX_VARIABLE_DELTA = 100;

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
    bridgeTargetNodeId: null,
    sceneKey: 0,
    errorMessage: null,
  };

  // Stable snapshot for useSyncExternalStore.
  private snapshot: SceneManagerState = { ...this.state };
  private subscribers: Array<() => void> = [];
  private initPromise: Promise<void> | null = null;

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((c) => c !== callback);
    };
  }

  private notify(): void {
    this.snapshot = { ...this.state };
    this.subscribers.forEach((cb) => cb());
  }

  getState(): SceneManagerState {
    return this.snapshot;
  }

  /** Idempotent: React StrictMode runs effects twice in dev, and we must not start twice. */
  initialize(startNodeId = 'prologue_01'): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInitialize(startNodeId).catch((error: unknown) => {
      this.initPromise = null; // allow "retry"
      const message = error instanceof Error ? error.message : String(error);
      console.error('Initialization failed:', error);
      this.state.errorMessage = message;
      this.setPhase('error');
    });
    return this.initPromise;
  }

  /** Used by the "Thử lại" button on the error screen. */
  retryInitialize(): Promise<void> {
    this.initPromise = null;
    this.state.errorMessage = null;
    return this.initialize();
  }

  private async doInitialize(startNodeId: string): Promise<void> {
    this.setPhase('loading');
    await storyScript.loadAllNodes();
    await assetLoader.loadManifest();
    await this.startNode(startNodeId);
  }

  /**
   * Restart the scene saved in the game store (after loading a save).
   * Returns false when the saved scene id is not a known node.
   */
  async resumeCurrentScene(): Promise<boolean> {
    const sceneId = useGameStore.getState().currentSceneId;
    if (!sceneId || !storyScript.getNode(sceneId)) return false;
    await this.startNode(sceneId, { autosave: false });
    return true;
  }

  async startNode(nodeId: string, options: { autosave?: boolean } = {}): Promise<void> {
    const node = storyScript.getNode(nodeId);
    if (!node) {
      throw new Error(`Không tìm thấy node truyện: ${nodeId}`);
    }

    storyScript.setCurrentNode(nodeId);
    await assetLoader.preloadScene(node.sceneData);

    const gameStore = useGameStore.getState();
    gameStore.setScene(nodeId, node.sceneData);
    gameStore.setChapter(node.metadata?.chapter || gameStore.chapter);

    const choices = storyScript
      .getChoicesFromNode(node)
      .filter((c) => !c.hidden && useGameStore.getState().evaluateConditions(c.conditions || []));

    this.state.currentNode = node;
    this.state.scriptedParagraphs = storyScript.getParagraphs(node);
    this.state.currentParagraphIndex = 0;
    this.state.displayedParagraphs = [];
    this.state.choices = choices;
    this.state.pendingChoice = null;
    this.state.bridgeTargetNodeId = null;
    this.state.isTransitioning = false;
    this.state.sceneKey += 1;

    if (options.autosave !== false) {
      // Slot 0 = automatic save, never touches the player's manual slots.
      useGameStore.getState().saveGame(0);
    }

    this.setPhase('scripted');
  }

  /**
   * Called by the TextBox once every paragraph of the current node has been
   * displayed. The TextBox owns the typing animation and its own paragraph cursor.
   */
  completeScriptedContent(): void {
    if (this.state.phase !== 'scripted' && this.state.phase !== 'ai_bridge') return;
    this.state.currentParagraphIndex = Math.max(0, this.state.scriptedParagraphs.length - 1);

    if (this.state.phase === 'scripted' && this.state.currentNode?.type === 'ending') {
      this.setPhase('ended');
      return;
    }
    this.setPhase('choices');
  }

  async selectChoice(choiceId: string): Promise<void> {
    if (this.state.phase !== 'choices') return; // also blocks double clicks

    // After an AI bridge there is a single "continue" button.
    if (this.state.bridgeTargetNodeId) {
      const target = this.state.bridgeTargetNodeId;
      this.state.bridgeTargetNodeId = null;
      this.setPhase('transitioning');
      await this.safeStartNode(target);
      return;
    }

    const choice = this.state.choices.find((c) => c.id === choiceId);
    const currentNode = this.state.currentNode;
    if (!choice || !currentNode) return;

    const transition = currentNode.transitions.find((t) => t.choiceId === choiceId);
    const targetNode = transition ? storyScript.getNode(transition.targetNodeId) : undefined;
    if (!transition || !targetNode) {
      // Data error: stay on the choices instead of freezing in "transitioning".
      console.error(`Transition/target missing for choice "${choiceId}" in node "${currentNode.id}"`);
      return;
    }

    this.state.pendingChoice = choice;
    this.setPhase('transitioning');

    const store = useGameStore.getState();
    store.addHistory({
      sceneId: currentNode.id,
      speaker: null,
      text: choice.text,
      type: 'choice',
      selectedChoiceId: choiceId,
    });
    if (transition.effects) this.applyStateChanges(transition.effects);

    if (transition.type === 'ai_bridge') {
      await this.generateAIBridge(choice, targetNode);
    } else {
      await this.safeStartNode(targetNode.id);
    }
  }

  private async safeStartNode(nodeId: string): Promise<void> {
    try {
      await this.startNode(nodeId);
    } catch (error) {
      console.error(error);
      this.state.errorMessage = error instanceof Error ? error.message : String(error);
      this.setPhase('error');
    }
  }

  private async generateAIBridge(choice: Choice, targetNode: StoryNode): Promise<void> {
    this.setPhase('ai_generating');

    const playerInput = `Player chọn: "${choice.text}". Mô tả ngắn phản ứng của NPC rồi chuyển cảnh tới "${targetNode.title}". Không đưa ra lựa chọn mới.`;

    let response;
    try {
      response = await aiNarrator.generateScene(this.getGameState(), undefined, playerInput);
    } catch (error) {
      console.error('AI Bridge generation failed:', error);
      await this.safeStartNode(targetNode.id);
      return;
    }

    // AI offline / rate limited: don't show the canned fallback scene, just move on.
    if (response.isFallback) {
      await this.safeStartNode(targetNode.id);
      return;
    }

    this.applyStateChanges(response.stateChanges);

    const store = useGameStore.getState();
    const currentScene = store.currentSceneData;
    const sceneData = this.sanitizeSceneData(response.sceneData, currentScene);

    // Keep the source node id as the scene id: a manual save made during the
    // bridge can then be resumed (it replays the choice) instead of dangling.
    store.setScene(this.state.currentNode?.id ?? store.currentSceneId ?? '', sceneData);

    const paragraphs = response.narrative
      .split(/\n{2,}/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map<ScriptedParagraph>((text) => ({ speaker: null, text, delay: 0 }));

    this.state.scriptedParagraphs = paragraphs.length ? paragraphs : [{ speaker: null, text: '...', delay: 0 }];
    this.state.currentParagraphIndex = 0;
    this.state.displayedParagraphs = [];
    // The bridge must lead to the node the author scripted: ignore AI-made choices.
    this.state.choices = [{ id: BRIDGE_CONTINUE_CHOICE_ID, text: 'Tiếp tục', conditions: [] }];
    this.state.bridgeTargetNodeId = targetNode.id;
    this.state.sceneKey += 1;

    this.setPhase('ai_bridge');
  }

  /** Keep only backgrounds/sprites/bgm that exist in the manifest. */
  private sanitizeSceneData(raw: Partial<SceneData>, current: SceneData | null): SceneData {
    const manifest = assetLoader.getManifest();
    const hasBg = (k?: string) => !!k && !!manifest?.backgrounds[k];
    const hasSprite = (k?: string) => !!k && !!manifest?.sprites[k];
    const hasBgm = (k?: string) => !!k && !!manifest?.audio.bgm[k];

    const validChars: CharacterSprite[] = Array.isArray(raw.characters)
      ? raw.characters.filter(
          (c): c is CharacterSprite =>
            !!c && typeof c.id === 'string' && hasSprite(c.sprite) &&
            ['left', 'center', 'right', 'hidden'].includes(c.position)
        )
      : [];

    return {
      background: hasBg(raw.background) ? (raw.background as string) : current?.background || 'black',
      characters: validChars.length ? validChars : current?.characters ?? [],
      bgm: hasBgm(raw.bgm) ? raw.bgm : current?.bgm,
      transition: 'fade',
    };
  }

  /** Apply AI/authored state changes with sanity limits (the model is not trusted blindly). */
  private applyStateChanges(changes: StateChanges | undefined): void {
    if (!changes || typeof changes !== 'object') return;
    const store = useGameStore.getState();

    if (changes.flags && typeof changes.flags === 'object') {
      for (const [k, v] of Object.entries(changes.flags)) {
        if (typeof v === 'boolean') store.setFlag(k, v);
      }
    }
    if (changes.variables && typeof changes.variables === 'object') {
      for (const [k, v] of Object.entries(changes.variables)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          const prev = store.getVariable(k);
          if (typeof prev === 'number') {
            store.setVariable(k, prev + Math.max(-MAX_VARIABLE_DELTA, Math.min(MAX_VARIABLE_DELTA, v)));
          } else {
            store.setVariable(k, Math.max(-MAX_VARIABLE_DELTA, Math.min(MAX_VARIABLE_DELTA, v)));
          }
        } else if (typeof v === 'string' || typeof v === 'boolean') {
          store.setVariable(k, v);
        }
      }
    }
    if (changes.relationships && typeof changes.relationships === 'object') {
      for (const [k, v] of Object.entries(changes.relationships)) {
        if (typeof v === 'number' && Number.isFinite(v)) {
          store.changeRelationship(k, Math.max(-MAX_RELATIONSHIP_DELTA, Math.min(MAX_RELATIONSHIP_DELTA, v)));
        }
      }
    }
    if (Array.isArray(changes.inventoryAdd)) {
      for (const item of changes.inventoryAdd) {
        if (item && typeof item.id === 'string' && typeof item.name === 'string') {
          store.addItem({
            id: item.id,
            name: item.name,
            description: item.description ?? '',
            quantity: Math.max(1, Math.min(99, Math.floor(item.quantity || 1))),
            type: item.type ?? 'misc',
          });
        }
      }
    }
    if (Array.isArray(changes.inventoryRemove)) {
      for (const id of changes.inventoryRemove) {
        if (typeof id === 'string') store.removeItem(id);
      }
    }
  }

  async completeAIBridge(targetNodeId: string): Promise<void> {
    await this.safeStartNode(targetNodeId);
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
}

export const sceneManager = new SceneManager();
