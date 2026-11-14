// Game State
export interface GameVariables {
  [key: string]: string | number | boolean;
}

export interface GameFlags {
  [key: string]: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'key' | 'consumable' | 'equipment' | 'misc';
}

export interface Relationships {
  [characterId: string]: number; // -100 to 100
}

export interface GameState {
  variables: GameVariables;
  flags: GameFlags;
  inventory: InventoryItem[];
  relationships: Relationships;
  currentSceneId: string | null;
  history: HistoryEntry[];
  playtime: number; // seconds
  chapter: string;
}

// Scene & Story
export interface CharacterSprite {
  id: string;
  sprite: string; // asset key
  position: 'left' | 'center' | 'right' | 'hidden';
  expression?: string;
  animation?: 'fade' | 'slide' | 'shake';
}

export interface SceneData {
  background: string; // asset key
  characters: CharacterSprite[];
  bgm?: string; // asset key
  transition?: 'fade' | 'slide' | 'none';
}

export interface Choice {
  id: string;
  text: string;
  conditions?: Condition[];
  disabled?: boolean;
  hidden?: boolean;
}

export interface Condition {
  type: 'flag' | 'variable' | 'relationship' | 'inventory';
  key: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number | boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  sceneId: string;
  speaker: string | null;
  text: string;
  type: 'narrative' | 'dialog' | 'choice' | 'system';
  choices?: Choice[];
  selectedChoiceId?: string;
}

// AI Narrator
export interface AINarratorRequest {
  systemPrompt: string;
  conversationHistory: ConversationMessage[];
  currentState: GameState;
  playerInput?: string;
  sceneContext?: SceneData;
}

export interface ConversationMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface AINarratorResponse {
  narrative: string;
  choices: Choice[];
  stateChanges: StateChanges;
  sceneData: Partial<SceneData>;
  internalMonologue?: string; // for debugging
}

export interface StateChanges {
  variables?: Partial<GameVariables>;
  flags?: Partial<GameFlags>;
  relationships?: Partial<Relationships>;
  inventoryAdd?: InventoryItem[];
  inventoryRemove?: string[];
}

// Scripted Story Nodes
export interface StoryNode {
  id: string;
  type: 'scripted' | 'ai_bridge' | 'ending';
  title: string;
  sceneData: SceneData;
  content: ScriptedContent;
  transitions: NodeTransition[];
  conditions?: Condition[]; // when this node is available
  metadata?: {
    chapter?: string;
    estimatedDuration?: number; // minutes
    tags?: string[];
  };
}

export interface ScriptedContent {
  paragraphs: ScriptedParagraph[];
}

export interface ScriptedParagraph {
  speaker: string | null; // null = narrator
  text: string;
  characterId?: string; // for sprite expression changes
  expression?: string;
  delay?: number; // ms before next paragraph
  autoAdvance?: boolean;
}

export interface NodeTransition {
  targetNodeId: string;
  choiceId: string;
  text?: string; // label shown on the choice button
  conditions?: Condition[];
  type: 'direct' | 'ai_bridge'; // ai_bridge = AI generates transition
}

// Save System
export interface SaveSlot {
  id: number;
  timestamp: number;
  playtime: number;
  chapter: string;
  sceneId: string;
  screenshot?: string; // base64 canvas
  state: GameState;
  version: string; // save format version
}

export interface SaveMetadata {
  slots: SaveSlot[];
  currentSlot: number | null;
  version: string;
}

// Asset Manifest
export interface AssetManifest {
  backgrounds: Record<string, string>; // key -> path
  sprites: Record<string, string>;
  audio: {
    bgm: Record<string, string>;
    sfx: Record<string, string>;
  };
  version: string;
}

// Settings
export interface GameSettings {
  textSpeed: number; // 1-5
  autoSpeed: number; // 1-5
  skipUnread: boolean;
  volume: {
    master: number; // 0-1
    bgm: number;
    sfx: number;
    voice: number;
  };
  windowed: boolean;
  language: 'vi' | 'en';
}