# Interactive Visual Novel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal-use Visual Novel engine with AI Narrator (Gemini 1.5 Flash) for deep branching stories, self-hosted assets, static deployment.

**Architecture:** React 18 + TypeScript + Vite frontend. Hybrid story system: scripted JSON nodes for major plot beats + AI improvisation for transitions/dynamic content. Zustand for state, React Query for AI API calls, Tailwind for styling. All client-side, deploy to Vercel/Netlify.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, @tanstack/react-query, Tailwind CSS, Gemini API (Google AI Studio), localStorage for saves.

**Spec:** `docs/design.md`

## Global Constraints

- Free tier only: Gemini 1.5 Flash (1,500 req/day, 1M token context)
- No backend - all client-side, static deployment
- Assets self-hosted in `/public/assets/` (backgrounds, sprites, audio)
- Personal use only - no analytics, auth, payments, multiplayer
- API key in `.env` as `VITE_GEMINI_API_KEY`
- TypeScript strict mode, ESLint + Prettier

## Review Focus

1. **AI response parsing failure** - Gemini returns non-JSON or malformed JSON → graceful fallback to text display, log error, don't crash game
2. **Save/load corruption** - localStorage quota exceeded or malformed JSON → show user-friendly error, offer export backup, don't lose progress
3. **Asset loading failure** - missing/corrupt image/audio → show placeholder, log warning, continue game
4. **State inconsistency** - AI returns invalid state changes (unknown variable, out-of-range relationship) → validate & clamp, log warning
5. **Rate limit / network error** - Gemini API 429 or timeout → exponential backoff retry (3x), then queue with user notification

---

### Task 1: Project Setup & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.eslintrc.cjs`
- Create: `.prettierrc`
- Create: `.env.example`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Produces: Working dev server (`npm run dev`), build (`npm run build`), lint (`npm run lint`)

- [ ] **Step 1: Initialize package.json with all dependencies**

```json
{
  "name": "interactive-novel",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "format": "prettier --write ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.13.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

- [ ] **Step 2: Configure TypeScript (strict mode)**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Configure Vite with path aliases**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

- [ ] **Step 4: Configure Tailwind CSS**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif JP', 'serif'],
      },
      colors: {
        novel: {
          bg: '#1a1a2e',
          panel: '#16213e',
          accent: '#e94560',
          text: '#eaeaea',
          muted: '#8b8b8b',
        }
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Create entry files (main.tsx, App.tsx, index.html)**

- [ ] **Step 6: Run `npm install` and verify dev server starts**

Run: `npm run dev`
Expected: Vite dev server running at http://localhost:5173

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: project setup with React, TypeScript, Vite, Tailwind, Zustand, React Query"
```

---

### Task 2: Type Definitions & Core Types

**Files:**
- Create: `src/types/index.ts`

**Interfaces:**
- Produces: All type definitions used across the project

- [ ] **Step 1: Define core game types**

```typescript
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
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add core type definitions"
```

---

### Task 3: State Management (Zustand Store)

**Files:**
- Create: `src/engine/StateManager.ts`
- Create: `src/hooks/useGameState.ts`

**Interfaces:**
- Consumes: Types from Task 2
- Produces: `useGameState` hook with actions

- [ ] **Step 1: Implement Zustand store with all game state & actions**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, GameVariables, GameFlags, InventoryItem,
  Relationships, Choice, Condition, SceneData, HistoryEntry,
  SaveSlot, SaveMetadata, GameSettings, AssetManifest
} from '@/types';

interface GameStore extends GameState {
  // Settings
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;

  // Asset manifest
  assetManifest: AssetManifest | null;
  setAssetManifest: (manifest: AssetManifest) => void;
  getAssetPath: (type: 'backgrounds' | 'sprites' | 'bgm' | 'sfx', key: string) => string;

  // Scene management
  currentSceneData: SceneData | null;
  setScene: (sceneId: string, sceneData: SceneData) => void;
  updateCharacter: (characterId: string, updates: Partial<CharacterSprite>) => void;

  // Variable/Flag actions
  setVariable: (key: string, value: string | number | boolean) => void;
  getVariable: (key: string) => string | number | boolean | undefined;
  setFlag: (key: string, value: boolean) => void;
  getFlag: (key: string) => boolean;

  // Relationship actions
  changeRelationship: (characterId: string, delta: number) => void;
  getRelationship: (characterId: string) => number;

  // Inventory actions
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  hasItem: (itemId: string, quantity?: number) => boolean;

  // Choice evaluation
  evaluateConditions: (conditions: Condition[]) => boolean;

  // History
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;

  // Playtime
  incrementPlaytime: (seconds: number) => void;

  // Chapter
  setChapter: (chapter: string) => void;

  // Save/Load
  saveMetadata: SaveMetadata;
  saveGame: (slotId: number, screenshot?: string) => void;
  loadGame: (slotId: number) => boolean;
  deleteSave: (slotId: number) => void;
  exportSave: (slotId: number) => string; // JSON string
  importSave: (json: string, slotId: number) => boolean;

  // Reset
  newGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      variables: {},
      flags: {},
      inventory: [],
      relationships: {},
      currentSceneId: null,
      history: [],
      playtime: 0,
      chapter: 'Prologue',
      currentSceneData: null,
      settings: {
        textSpeed: 3,
        autoSpeed: 3,
        skipUnread: false,
        volume: { master: 0.8, bgm: 0.7, sfx: 0.8, voice: 1.0 },
        windowed: false,
        language: 'vi',
      },
      assetManifest: null,
      saveMetadata: { slots: [], currentSlot: null, version: '1.0.0' },

      // Settings
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Assets
      setAssetManifest: (manifest) => set({ assetManifest: manifest }),
      getAssetPath: (type, key) => {
        const manifest = get().assetManifest;
        if (!manifest) return '';
        const map = manifest[type === 'bgm' || type === 'sfx' ? 'audio' : type];
        return map?.[key] ?? '';
      },

      // Scene
      setScene: (sceneId, sceneData) => set({
        currentSceneId: sceneId,
        currentSceneData: sceneData,
      }),
      updateCharacter: (characterId, updates) => set((state) => {
        if (!state.currentSceneData) return state;
        return {
          currentSceneData: {
            ...state.currentSceneData,
            characters: state.currentSceneData.characters.map(c =>
              c.id === characterId ? { ...c, ...updates } : c
            ),
          },
        };
      }),

      // Variables
      setVariable: (key, value) => set((state) => ({
        variables: { ...state.variables, [key]: value },
      })),
      getVariable: (key) => get().variables[key],

      // Flags
      setFlag: (key, value) => set((state) => ({
        flags: { ...state.flags, [key]: value },
      })),
      getFlag: (key) => get().flags[key] ?? false,

      // Relationships
      changeRelationship: (characterId, delta) => set((state) => {
        const current = state.relationships[characterId] ?? 0;
        const clamped = Math.max(-100, Math.min(100, current + delta));
        return {
          relationships: { ...state.relationships, [characterId]: clamped },
        };
      }),
      getRelationship: (characterId) => get().relationships[characterId] ?? 0,

      // Inventory
      addItem: (item) => set((state) => {
        const existing = state.inventory.find(i => i.id === item.id);
        if (existing) {
          return {
            inventory: state.inventory.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          };
        }
        return { inventory: [...state.inventory, item] };
      }),
      removeItem: (itemId, quantity = 1) => set((state) => ({
        inventory: state.inventory
          .map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i)
          .filter(i => i.quantity > 0),
      })),
      hasItem: (itemId, quantity = 1) => {
        const item = get().inventory.find(i => i.id === itemId);
        return item ? item.quantity >= quantity : false;
      },

      // Conditions
      evaluateConditions: (conditions) => {
        if (!conditions || conditions.length === 0) return true;
        const state = get();
        return conditions.every(c => {
          let value: unknown;
          switch (c.type) {
            case 'flag': value = state.flags[c.key]; break;
            case 'variable': value = state.variables[c.key]; break;
            case 'relationship': value = state.relationships[c.key]; break;
            case 'inventory': value = state.hasItem(c.key); break;
            default: return false;
          }
          return compareValues(value, c.operator, c.value);
        });
      },

      // History
      addHistory: (entry) => set((state) => ({
        history: [...state.history, { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }],
      })),
      clearHistory: () => set({ history: [] }),

      // Playtime
      incrementPlaytime: (seconds) => set((state) => ({
        playtime: state.playtime + seconds,
      })),

      // Chapter
      setChapter: (chapter) => set({ chapter }),

      // Save/Load
      saveGame: (slotId, screenshot) => {
        const state = get();
        const slot: SaveSlot = {
          id: slotId,
          timestamp: Date.now(),
          playtime: state.playtime,
          chapter: state.chapter,
          sceneId: state.currentSceneId ?? '',
          screenshot,
          state: {
            variables: state.variables,
            flags: state.flags,
            inventory: state.inventory,
            relationships: state.relationships,
            currentSceneId: state.currentSceneId,
            history: state.history,
            playtime: state.playtime,
            chapter: state.chapter,
          },
          version: '1.0.0',
        };
        set((s) => {
          const slots = [...s.saveMetadata.slots.filter(s => s.id !== slotId), slot].sort((a, b) => a.id - b.id);
          return { saveMetadata: { ...s.saveMetadata, slots, currentSlot: slotId } };
        });
        // Persist to localStorage separately (zustand persist only stores store state)
        localStorage.setItem(`save_slot_${slotId}`, JSON.stringify(slot));
        return true;
      },

      loadGame: (slotId) => {
        try {
          const saved = localStorage.getItem(`save_slot_${slotId}`);
          if (!saved) return false;
          const slot: SaveSlot = JSON.parse(saved);
          set({
            variables: slot.state.variables,
            flags: slot.state.flags,
            inventory: slot.state.inventory,
            relationships: slot.state.relationships,
            currentSceneId: slot.state.currentSceneId,
            history: slot.state.history,
            playtime: slot.state.playtime,
            chapter: slot.state.chapter,
            saveMetadata: { ...get().saveMetadata, currentSlot: slotId },
          });
          return true;
        } catch {
          return false;
        }
      },

      deleteSave: (slotId) => {
        localStorage.removeItem(`save_slot_${slotId}`);
        set((s) => ({
          saveMetadata: {
            ...s.saveMetadata,
            slots: s.saveMetadata.slots.filter(s => s.id !== slotId),
            currentSlot: s.saveMetadata.currentSlot === slotId ? null : s.saveMetadata.currentSlot,
          },
        }));
      },

      exportSave: (slotId) => {
        const saved = localStorage.getItem(`save_slot_${slotId}`);
        return saved ?? '';
      },

      importSave: (json, slotId) => {
        try {
          const slot: SaveSlot = JSON.parse(json);
          localStorage.setItem(`save_slot_${slotId}`, JSON.stringify(slot));
          set((s) => ({
            saveMetadata: {
              ...s.saveMetadata,
              slots: [...s.saveMetadata.slots.filter(s => s.id !== slotId), slot].sort((a, b) => a.id - b.id),
            },
          }));
          return true;
        } catch {
          return false;
        }
      },

      // Reset
      newGame: () => set((state) => ({
        variables: {},
        flags: {},
        inventory: [],
        relationships: {},
        currentSceneId: null,
        history: [],
        playtime: 0,
        chapter: 'Prologue',
        currentSceneData: null,
        saveMetadata: { ...state.saveMetadata, currentSlot: null },
      })),

      resetAll: () => {
        localStorage.clear();
        set({
          variables: {},
          flags: {},
          inventory: [],
          relationships: {},
          currentSceneId: null,
          history: [],
          playtime: 0,
          chapter: 'Prologue',
          currentSceneData: null,
          settings: {
            textSpeed: 3,
            autoSpeed: 3,
            skipUnread: false,
            volume: { master: 0.8, bgm: 0.7, sfx: 0.8, voice: 1.0 },
            windowed: false,
            language: 'vi',
          },
          assetManifest: null,
          saveMetadata: { slots: [], currentSlot: null, version: '1.0.0' },
        });
      },
    }),
    {
      name: 'novel-game-store',
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist game state - use save slots instead
      }),
    }
  )
);

// Helper
function compareValues(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return Number(actual) > Number(expected);
    case 'lt': return Number(actual) < Number(expected);
    case 'gte': return Number(actual) >= Number(expected);
    case 'lte': return Number(actual) <= Number(expected);
    case 'contains': return String(actual).includes(String(expected));
    default: return false;
  }
}
```

- [ ] **Step 2: Create `useGameState` hook for typed access**

```typescript
import { useGameStore } from '@/engine/StateManager';
import type { GameState, Choice, SceneData, SaveSlot } from '@/types';

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
```

- [ ] **Step 3: Run TypeScript check & verify no runtime errors**

Run: `npx tsc --noEmit && npm run dev`
Expected: No type errors, dev server runs

- [ ] **Step 4: Commit**

```bash
git add src/engine/StateManager.ts src/hooks/useGameState.ts
git commit -m "feat: implement Zustand game state management with save/load"
```

---

### Task 4: Asset Loading & Manifest

**Files:**
- Create: `src/engine/AssetLoader.ts`
- Create: `src/hooks/useAssets.ts`
- Create: `public/assets/manifest.json` (example structure)
- Create: `public/assets/backgrounds/.gitkeep`
- Create: `public/assets/sprites/.gitkeep`
- Create: `public/assets/audio/bgm/.gitkeep`
- Create: `public/assets/audio/sfx/.gitkeep`

**Interfaces:**
- Consumes: Types from Task 2, StateManager from Task 3
- Produces: Asset loading utilities, preloading, manifest parsing

- [ ] **Step 1: Create asset manifest example**

```json
{
  "backgrounds": {
    "temple_exterior": "assets/backgrounds/temple_exterior.webp",
    "temple_interior": "assets/backgrounds/temple_interior.webp",
    "forest_path": "assets/backgrounds/forest_path.webp",
    "village_square": "assets/backgrounds/village_square.webp",
    "black": "assets/backgrounds/black.webp"
  },
  "sprites": {
    "elder_neutral": "assets/sprites/elder_neutral.webp",
    "elder_smile": "assets/sprites/elder_smile.webp",
    "elder_serious": "assets/sprites/elder_serious.webp",
    "protagonist_neutral": "assets/sprites/protagonist_neutral.webp",
    "protagonist_determined": "assets/sprites/protagonist_determined.webp"
  },
  "audio": {
    "bgm": {
      "peaceful": "assets/audio/bgm/peaceful.ogg",
      "tension": "assets/audio/bgm/tension.ogg",
      "battle": "assets/audio/bgm/battle.ogg"
    },
    "sfx": {
      "click": "assets/audio/sfx/click.ogg",
      "page_turn": "assets/audio/sfx/page_turn.ogg",
      "magic": "assets/audio/sfx/magic.ogg"
    }
  },
  "version": "1.0.0"
}
```

- [ ] **Step 2: Implement AssetLoader with preloading & caching**

```typescript
import type { AssetManifest } from '@/types';

class AssetLoader {
  private manifest: AssetManifest | null = null;
  private cache: Map<string, HTMLImageElement | HTMLAudioElement> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  async loadManifest(): Promise<AssetManifest> {
    const response = await fetch('/assets/manifest.json');
    if (!response.ok) throw new Error('Failed to load asset manifest');
    this.manifest = await response.json();
    return this.manifest;
  }

  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  getPath(type: keyof AssetManifest['backgrounds'], key: string): string {
    if (!this.manifest) return '';
    const category = type === 'bgm' || type === 'sfx' ? 'audio' : type;
    const map = this.manifest[category as keyof AssetManifest] as Record<string, string>;
    return map?.[key] ?? '';
  }

  async preloadBackgrounds(keys: string[]): Promise<void> {
    await Promise.all(keys.map(k => this.loadImage(this.getPath('backgrounds', k))));
  }

  async preloadSprites(keys: string[]): Promise<void> {
    await Promise.all(keys.map(k => this.loadImage(this.getPath('sprites', k))));
  }

  async preloadAudio(keys: { bgm?: string[]; sfx?: string[] }): Promise<void> {
    const promises: Promise<void>[] = [];
    if (keys.bgm) promises.push(...keys.bgm.map(k => this.loadAudio(this.getPath('bgm', k))));
    if (keys.sfx) promises.push(...keys.sfx.map(k => this.loadAudio(this.getPath('sfx', k))));
    await Promise.all(promises);
  }

  private loadImage(src: string): Promise<void> {
    if (!src) return Promise.resolve();
    if (this.cache.has(src)) return Promise.resolve();
    if (this.loadingPromises.has(src)) return this.loadingPromises.get(src)!;

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        resolve();
      };
      img.onerror = () => {
        this.loadingPromises.delete(src);
        console.warn(`Failed to load image: ${src}`);
        resolve(); // Don't reject - game continues with missing asset
      };
    });
    this.loadingPromises.set(src, promise);
    return promise;
  }

  private loadAudio(src: string): Promise<void> {
    if (!src) return Promise.resolve();
    if (this.cache.has(src)) return Promise.resolve();
    if (this.loadingPromises.has(src)) return this.loadingPromises.get(src)!;

    const promise = new Promise<void>((resolve) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.oncanplaythrough = () => {
        this.cache.set(src, audio);
        this.loadingPromises.delete(src);
        resolve();
      };
      audio.onerror = () => {
        this.loadingPromises.delete(src);
        console.warn(`Failed to load audio: ${src}`);
        resolve();
      };
      // Trigger load
      audio.load();
    });
    this.loadingPromises.set(src, promise);
    return promise;
  }

  getImage(src: string): HTMLImageElement | null {
    return this.cache.get(src) as HTMLImageElement ?? null;
  }

  getAudio(src: string): HTMLAudioElement | null {
    return this.cache.get(src) as HTMLAudioElement ?? null;
  }

  createAudioInstance(src: string): HTMLAudioElement | null {
    const cached = this.getAudio(src);
    if (cached) return cached.cloneNode(true) as HTMLAudioElement;
    const path = this.getPath(src.includes('bgm') ? 'bgm' : 'sfx', src);
    if (path) return new Audio(path);
    return null;
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

export const assetLoader = new AssetLoader();
```

- [ ] **Step 3: Create React hook for asset loading**

```typescript
import { useEffect, useState } from 'react';
import { assetLoader } from '@/engine/AssetLoader';
import { useGameStore } from '@/engine/StateManager';
import type { AssetManifest } from '@/types';

export function useAssets() {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const setAssetManifest = useGameStore((s) => s.setAssetManifest);

  useEffect(() => {
    let mounted = true;
    assetLoader.loadManifest()
      .then((m) => {
        if (mounted) {
          setManifest(m);
          setAssetManifest(m);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (mounted) {
          setError(e);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [setAssetManifest]);

  const preloadScene = async (sceneData: { background?: string; characters?: Array<{ sprite: string }>; bgm?: string }) => {
    const promises: Promise<void>[] = [];
    if (sceneData.background) promises.push(assetLoader.loadImage(assetLoader.getPath('backgrounds', sceneData.background)));
    if (sceneData.characters) {
      sceneData.characters.forEach(c => promises.push(assetLoader.loadImage(assetLoader.getPath('sprites', c.sprite))));
    }
    if (sceneData.bgm) promises.push(assetLoader.loadAudio(assetLoader.getPath('bgm', sceneData.bgm)));
    await Promise.all(promises);
  };

  return { manifest, loading, error, preloadScene, assetLoader };
}

export function useBackground(key: string) {
  const { manifest } = useAssets();
  return manifest?.backgrounds[key] ? `/${manifest.backgrounds[key]}` : '';
}

export function useSprite(key: string) {
  const { manifest } = useAssets();
  return manifest?.sprites[key] ? `/${manifest.sprites[key]}` : '';
}

export function useBGM(key: string) {
  const { manifest } = useAssets();
  return manifest?.audio.bgm[key] ? `/${manifest.audio.bgm[key]}` : '';
}

export function useSFX(key: string) {
  const { manifest } = useAssets();
  return manifest?.audio.sfx[key] ? `/${manifest.audio.sfx[key]}` : '';
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/engine/AssetLoader.ts src/hooks/useAssets.ts public/assets/manifest.json public/assets/**/.gitkeep
git commit -m "feat: add asset loading system with manifest and preloading"
```

---

### Task 5: Scene Components (UI)

**Files:**
- Create: `src/components/Scene/Background.tsx`
- Create: `src/components/Scene/Character.tsx`
- Create: `src/components/Scene/TextBox.tsx`
- Create: `src/components/Scene/ChoiceButtons.tsx`
- Create: `src/components/Scene/SceneContainer.tsx`
- Create: `src/components/Scene/index.ts`

**Interfaces:**
- Consumes: Types from Task 2, hooks from Tasks 3-4
- Produces: Reusable scene UI components

- [ ] **Step 1: Background component with transitions**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useBackground } from '@/hooks/useAssets';
import type { SceneData } from '@/types';

interface BackgroundProps {
  sceneData: SceneData;
  className?: string;
}

export function Background({ sceneData, className }: BackgroundProps) {
  const bgSrc = useBackground(sceneData.background);
  const [opacity, setOpacity] = useState(0);
  const prevSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (sceneData.transition === 'fade') {
      setOpacity(0);
      prevSrcRef.current = bgSrc;
      // Fade out
      const fadeOut = setTimeout(() => {
        setOpacity(1); // Fade in new
      }, 150);
      return () => clearTimeout(fadeOut);
    } else {
      setOpacity(1);
    }
  }, [bgSrc, sceneData.transition]);

  return (
    <div className={`absolute inset-0 z-0 ${className}`} style={{ opacity }}>
      {bgSrc && (
        <img
          src={bgSrc}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}
      {/* Vignette overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-novel-bg/80 via-transparent to-transparent z-10 pointer-events-none" />
    </div>
  );
}
```

- [ ] **Step 2: Character sprite component with position/expression animations**

```tsx
import { useEffect, useState } from 'react';
import { useSprite } from '@/hooks/useAssets';
import type { CharacterSprite } from '@/types';

interface CharacterProps {
  character: CharacterSprite;
  className?: string;
}

const POSITION_STYLES: Record<CharacterSprite['position'], string> = {
  left: 'left-1/12',
  center: 'left-1/2',
  right: 'right-1/12',
  hidden: 'opacity-0 pointer-events-none',
};

const POSITION_TRANSFORMS: Record<CharacterSprite['position'], string> = {
  left: '-translate-x-0',
  center: '-translate-x-1/2',
  right: '-translate-x-0',
  hidden: '-translate-x-0',
};

export function Character({ character, className }: CharacterProps) {
  const spriteSrc = useSprite(character.sprite);
  const [opacity, setOpacity] = useState(character.position === 'hidden' ? 0 : 1);
  const [transform, setTransform] = useState(POSITION_TRANSFORMS[character.position]);

  useEffect(() => {
    if (character.animation === 'fade') {
      setOpacity(character.position === 'hidden' ? 0 : 1);
    } else if (character.animation === 'slide') {
      setTransform(POSITION_TRANSFORMS[character.position]);
    } else {
      setOpacity(character.position === 'hidden' ? 0 : 1);
      setTransform(POSITION_TRANSFORMS[character.position]);
    }
  }, [character.position, character.animation]);

  if (!spriteSrc || character.position === 'hidden') return null;

  return (
    <div
      className={`absolute bottom-0 z-20 transition-all duration-300 ease-out ${POSITION_STYLES[character.position]} ${className}`}
      style={{ opacity, transform: `translateX(${transform})` }}
    >
      <img
        src={spriteSrc}
        alt={character.id}
        className="max-h-[70vh] object-contain filter drop-shadow-2xl"
      />
    </div>
  );
}
```

- [ ] **Step 3: TextBox with typewriter effect, auto/skip modes**

```tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { ScriptedParagraph } from '@/types';

interface TextBoxProps {
  paragraphs: ScriptedParagraph[];
  onComplete: () => void;
  onParagraphChange?: (index: number) => void;
}

export function TextBox({ paragraphs, onComplete, onParagraphChange }: TextBoxProps) {
  const { settings, addHistory } = useGameStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const skipRef = useRef(false);
  const autoRef = useRef(false);

  const currentPara = paragraphs[currentIndex];
  const textSpeed = settings.textSpeed * 20; // ms per char
  const autoSpeed = settings.autoSpeed * 500; // ms per char for auto

  const typeText = useCallback((text: string, instant = false) => {
    setIsTyping(true);
    setDisplayedText('');
    if (instant || textSpeed <= 0) {
      setDisplayedText(text);
      setIsTyping(false);
      handleTypeComplete();
      return;
    }

    let i = 0;
    const type = () => {
      if (skipRef.current) {
        setDisplayedText(text);
        setIsTyping(false);
        skipRef.current = false;
        handleTypeComplete();
        return;
      }
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingTimeoutRef.current = setTimeout(type, textSpeed);
      } else {
        setIsTyping(false);
        handleTypeComplete();
      }
    };
    type();
  }, [textSpeed]);

  const handleTypeComplete = () => {
    setShowContinue(true);
    if (autoRef.current && currentIndex < paragraphs.length - 1) {
      setTimeout(() => handleContinue(), autoSpeed);
    }
  };

  const handleContinue = () => {
    if (isTyping) {
      skipRef.current = true;
      return;
    }
    if (currentIndex < paragraphs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      onParagraphChange?.(currentIndex + 1);
    } else {
      setIsComplete(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    skipRef.current = true;
  };

  const handleAutoToggle = () => {
    autoRef.current = !autoRef.current;
  };

  // Add to history when paragraph displays
  useEffect(() => {
    if (currentPara && displayedText === currentPara.text) {
      addHistory({
        sceneId: '', // filled by SceneManager
        speaker: currentPara.speaker,
        text: currentPara.text,
        type: currentPara.speaker ? 'dialog' : 'narrative',
      });
    }
  }, [displayedText, currentPara, addHistory]);

  // Start typing when paragraph changes
  useEffect(() => {
    setShowContinue(false);
    if (currentPara) {
      typeText(currentPara.text);
    }
  }, [currentIndex, typeText]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleContinue();
      } else if (e.code === 'KeyS') {
        handleSkip();
      } else if (e.code === 'KeyA') {
        handleAutoToggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTyping, handleContinue, handleSkip, handleAutoToggle]);

  // Cleanup
  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  if (!currentPara) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {/* Speaker name */}
        {currentPara.speaker && (
          <div className="mb-2 text-novel-accent font-medium text-lg px-2">
            {currentPara.speaker}
          </div>
        )}

        {/* Dialog box */}
        <div className="novel-panel rounded-xl p-5 md:p-6 relative bg-novel-panel/95 backdrop-blur-sm border border-novel-accent/20">
          <p className="novel-text text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
            {displayedText}
          </p>

          {/* Continue indicator */}
          {showContinue && !isComplete && (
            <div className="absolute bottom-3 right-3 animate-bounce text-novel-accent/70">
              ▼
            </div>
          )}

          {/* Auto/Skip indicators */}
          {(autoRef.current || skipRef.current) && (
            <div className="absolute top-3 right-3 text-xs text-novel-muted flex gap-2 items-center">
              {autoRef.current && <span className="text-novel-accent">⏵ AUTO</span>}
              {skipRef.current && <span>⏩ SKIP</span>}
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="mt-3 text-xs text-novel-muted text-center">
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">Space</kbd>{' '}
          Next &nbsp;
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">S</kbd>{' '}
          Skip &nbsp;
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">A</kbd>{' '}
          Auto
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: ChoiceButtons component with condition evaluation**

```tsx
import { useGameStore } from '@/engine/StateManager';
import type { Choice } from '@/types';

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onSelect, disabled }: ChoiceButtonsProps) {
  const evaluateConditions = useGameStore((s) => s.evaluateConditions);

  const availableChoices = choices.filter(c => {
    if (c.hidden) return false;
    if (c.disabled) return true; // Show but disabled
    return evaluateConditions(c.conditions || []);
  });

  if (availableChoices.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto space-y-3">
        {availableChoices.map((choice, index) => (
          <button
            key={choice.id}
            onClick={() => !choice.disabled && onSelect(choice.id)}
            disabled={disabled || choice.disabled}
            className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200
              novel-panel bg-novel-panel/90 backdrop-blur-sm
              ${choice.disabled
                ? 'border-novel-muted/30 text-novel-muted cursor-not-allowed'
                : 'border-novel-accent/30 text-novel-text hover:border-novel-accent hover:bg-novel-accent/10 focus:ring-2 focus:ring-novel-accent/50'
              }`}
            tabIndex={choice.disabled ? -1 : 0}
          >
            <span className="flex items-center gap-3">
              <span className="text-novel-accent font-mono text-lg">{index + 1}.</span>
              <span className="text-lg md:text-xl leading-relaxed">{choice.text}</span>
            </span>
            {choice.disabled && (
              <span className="absolute right-4 text-sm text-novel-muted">🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: SceneContainer - main scene orchestrator**

```tsx
import { useEffect, useState } from 'react';
import { Background } from './Background';
import { Character } from './Character';
import { TextBox } from './TextBox';
import { ChoiceButtons } from './ChoiceButtons';
import { useGameStore } from '@/engine/StateManager';
import type { SceneData, Choice, ScriptedParagraph } from '@/types';

interface SceneContainerProps {
  sceneData: SceneData;
  content: ScriptedParagraph[];
  choices: Choice[];
  onChoicesReady: (choices: Choice[]) => void;
  onChoiceSelect: (choiceId: string) => void;
  onSceneComplete: () => void;
}

export function SceneContainer({
  sceneData,
  content,
  choices,
  onChoicesReady,
  onChoiceSelect,
  onSceneComplete,
}: SceneContainerProps) {
  const [showChoices, setShowChoices] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);

  useEffect(() => {
    onChoicesReady(choices);
  }, [choices, onChoicesReady]);

  const handleTextComplete = () => {
    setShowChoices(true);
  };

  const handleChoiceSelect = (choiceId: string) => {
    setShowChoices(false);
    onChoiceSelect(choiceId);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden novel-bg">
      {/* Background */}
      <Background sceneData={sceneData} />

      {/* Characters */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {sceneData.characters.map((char) => (
          <Character key={char.id} character={char} />
        ))}
      </div>

      {/* Text Box */}
      <TextBox
        paragraphs={currentContent}
        onComplete={handleTextComplete}
      />

      {/* Choices */}
      {showChoices && choices.length > 0 && (
        <ChoiceButtons
          choices={choices}
          onSelect={handleChoiceSelect}
        />
      )}

      {/* Scene complete callback */}
      {showChoices && choices.length === 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-6 pointer-events-none">
          <div className="max-w-xl mx-auto text-center text-novel-muted">
            <button
              onClick={onSceneComplete}
              className="px-8 py-3 rounded-xl border-2 border-novel-accent/30 text-novel-text hover:border-novel-accent hover:bg-novel-accent/10 transition-colors"
            >
              Tiếp tục ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create index.ts exports**

```typescript
export { Background } from './Background';
export { Character } from './Character';
export { TextBox } from './TextBox';
export { ChoiceButtons } from './ChoiceButtons';
export { SceneContainer } from './SceneContainer';
```

- [ ] **Step 7: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add src/components/Scene/
git commit -m "feat: add scene UI components (Background, Character, TextBox, ChoiceButtons, SceneContainer)"
```

---

### Task 6: AI Narrator Service (Gemini API)

**Files:**
- Create: `src/engine/AINarrator.ts`
- Create: `src/hooks/useAINarrator.ts`

**Interfaces:**
- Consumes: Types from Task 2, StateManager from Task 3
- Produces: `generateScene` function, `useAINarrator` hook

- [ ] **Step 1: Create system prompt template (in separate file for maintainability)**

```typescript
// src/engine/prompts.ts
export const SYSTEM_PROMPT = `Bạn là Narrator của một Visual Novel fantasy Việt Nam. Hãy kể chuyện theo phong cách văn học, giàu cảm xúc, mô tả cảnh sống động.

=== THẾ GIỚI (WORLD LORE) ===
- Tên thế giới: Thanh Vân Cửu Trọng (Nine Heavens of Green Clouds)
- Hệ pháp lực: Tu chân (Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Đại Thừa → Động Tịch → Thăng Tiên)
- Môn phái chính: Thanh Vân Tông (chính đạo), Huyết Ma Tông (ma đạo), Vô Cực Các (trung lập)
- Địa điểm quan trọng: Thanh Vân Sơn, Ma Uyên, Tiên Môn, Phàm Giới

=== NHÂN VẬT CHÍNH ===
1. **Nhân chính (Player)**: Tên do player đặt, có thể là nam/nữ. Bẩm sinh "Thiên Linh Căn" (tài chất tu tiên hiếm gặp). Tính cách: player quyết định qua choices.
2. **Lão Tổ Thanh Vân (Elder)**: Trưởng lão Thanh Vân Tông, tu vị Hóa Thần sơ kỳ. Tính cách: nghiêm khắc nhưng thương yêu đệ tử, nói chuyện chậm rãi, dùng "lão phu" tự xưng.
3. **Tiểu Lan (Junior Sister)**: Đệ tử cùng môn, Trúc Cơ trung kỳ. Tính cách: hoạt bát, ham chơi, gọi player là "Sư huynh/Sư tỷ", dùng emoji trong dialog.
4. **Huyết Y (Rival)**: Đệ tử Huyết Ma Tông, Kim Đan sơ kỳ. Tính cách: cao ngạo, khinh thường chính đạo, nhưng có luật lệ riêng.

=== QUY TẮC KỆ CHUYỆN ===
- Không break character. Luôn nói chuyện như narrator/nhân vật.
- Mô tả cảnh: 3-5 câu, tập trung vào giác quan (thấy, nghe, ngửi, cảm giác).
- Dialog: tự nhiên, phù hợp nhân vật. Elder dùng văn ngôn, Tiểu Lan dùng tiếng lóng.
- Choice: Tối đa 4 lựa chọn, mỗi cái dẫn hướng khác nhau (khám phá, chiến đấu, giao tiếp, suy nghĩ).
- State changes: Chỉ thay đổi khi hợp lý (relationship ±5-15, flags khi trigger event quan trọng).

=== ĐỊNH DẠNG TRẢ VỀ (BẮT BUỘC JSON) ===
{
  "narrative": "Mô tả cảnh + dialog NPC (có thể nhiều đoạn, cách nhau bằng \\n\\n)",
  "choices": [
    { "id": "c1", "text": "Lựa chọn 1", "conditions": {} },
    { "id": "c2", "text": "Lựa chọn 2", "conditions": { "type": "flag", "key": "met_elder", "operator": "eq", "value": true } }
  ],
  "stateChanges": {
    "variables": { "cultivation_exp": 10 },
    "flags": { "first_meeting": true },
    "relationships": { "elder": 5, "lan": -2 }
  },
  "sceneData": {
    "background": "temple_interior",
    "characters": [
      { "id": "elder", "sprite": "elder_serious", "position": "center" }
    ]
  }
}`;

export function buildUserPrompt(gameState: any, sceneContext?: any, playerInput?: string): string {
  return `
=== TRẠNG THÁI HIỆN TẠI ===
Chương: ${gameState.chapter}
Scene: ${gameState.currentSceneId}
Playtime: ${Math.floor(gameState.playtime / 60)} phút

Biến số: ${JSON.stringify(gameState.variables)}
Flags: ${JSON.stringify(gameState.flags)}
Mối quan hệ: ${JSON.stringify(gameState.relationships)}
Túi đồ: ${JSON.stringify(gameState.inventory.map((i: any) => `${i.name} x${i.quantity}`))}

=== LỊCH SỬ GẦN ĐÂY (5 entry cuối) ===
${gameState.history.slice(-5).map((h: any) => `${h.speaker || 'Narrator'}: ${h.text}`).join('\n')}

=== SCENE HIỆN TẠI ===
${sceneContext ? JSON.stringify(sceneContext) : 'Không có'}

${playerInput ? `=== HÀNH ĐỘNG NGƯỜI CHƠI ===
${playerInput}` : ''}

=== YÊU CẦU ===
${playerInput ? 'Tiếp tục câu chuyện dựa trên hành động người chơi.' : 'Bắt đầu scene mới hoặc tiếp tục từ điểm dừng.'}
Hãy trả về JSON theo đúng format đã quy định.
`.trim();
}
```

- [ ] **Step 2: Implement AINarrator service with Gemini API**

```typescript
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import type { GameState, AINarratorResponse, SceneData, Choice, StateChanges } from '@/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

class AINarrator {
  private apiKey: string;
  private abortController: AbortController | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set. AI Narrator will not work.');
    }
  }

  async generateScene(
    gameState: GameState,
    sceneContext?: SceneData,
    playerInput?: string
  ): Promise<AINarratorResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse();
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), 30000);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Hiểu rồi. Tôi sẽ trả về JSON theo format yêu cầu.' }] },
            { role: 'user', parts: [{ text: buildUserPrompt(gameState, sceneContext, playerInput) }] },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('Empty response');

      return this.parseResponse(text);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('AI Narrator error:', error);
      return this.getFallbackResponse(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private parseResponse(text: string): AINarratorResponse {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      return {
        narrative: parsed.narrative || '...',
        choices: Array.isArray(parsed.choices) ? parsed.choices : [],
        stateChanges: parsed.stateChanges || {},
        sceneData: parsed.sceneData || {},
        internalMonologue: parsed.internalMonologue,
      };
    } catch (e) {
      console.error('Failed to parse AI response:', e, text);
      return this.getFallbackResponse('Parse error');
    }
  }

  private getFallbackResponse(error?: string): AINarratorResponse {
    return {
      narrative: error
        ? `[Hệ thống: AI Narrator tạm thời không khả dụng (${error}). Vui lòng thử lại sau.]
        \n\nGió rít qua khe cửa sổ cổ, mang theo mùi hương thảo dược nhẹ nhàng. Lão Tổ ngồi đối diện, ánh mắt sâu thẳm như biển lớn quan sát từng động tác của ngươi.`
        : 'Gió rít qua khe cửa sổ cổ, mang theo mùi hương thảo dược nhẹ nhàng. Lão Tổ ngồi đối diện, ánh mắt sâu thẳm như biển lớn quan sát từng động tác của ngươi.',
      choices: [
        { id: 'wait', text: 'Đứng im lặng chờ Lão Tổ nói', conditions: [] },
        { id: 'ask', text: 'Hỏi: "Lão Tổ kêu ta đến có việc gì?"', conditions: [] },
        { id: 'bow', text: 'Cúi đầu hành lễ, không nói lời nào', conditions: [] },
      ],
      stateChanges: {},
      sceneData: {},
    };
  }

  cancel(): void {
    this.abortController?.abort();
  }
}

export const aiNarrator = new AINarrator();
```

- [ ] **Step 3: Create React hook for AI Narrator with React Query**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiNarrator } from '@/engine/AINarrator';
import { useGameStore } from '@/engine/StateManager';
import type { GameState, SceneData, AINarratorResponse, Choice } from '@/types';

export function useAINarrator() {
  const queryClient = useQueryClient();
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
  const setChapter = useGameStore((s) => s.setChapter);

  const generateSceneMutation = useMutation({
    mutationFn: async ({ sceneContext, playerInput }: { sceneContext?: SceneData; playerInput?: string }) => {
      return aiNarrator.generateScene(gameState, sceneContext, playerInput);
    },
    onSuccess: (response) => {
      // Apply state changes
      if (response.stateChanges.variables) {
        Object.entries(response.stateChanges.variables).forEach(([key, value]) => {
          applyStateChanges.setVariable(key, value);
        });
      }
      if (response.stateChanges.flags) {
        Object.entries(response.stateChanges.flags).forEach(([key, value]) => {
          applyStateChanges.setFlag(key, value);
        });
      }
      if (response.stateChanges.relationships) {
        Object.entries(response.stateChanges.relationships).forEach(([charId, delta]) => {
          applyStateChanges.changeRelationship(charId, delta);
        });
      }
      if (response.stateChanges.inventoryAdd) {
        response.stateChanges.inventoryAdd.forEach(item => applyStateChanges.addItem(item));
      }
      if (response.stateChanges.inventoryRemove) {
        response.stateChanges.inventoryRemove.forEach(id => applyStateChanges.removeItem(id));
      }

      // Add narrative to history
      addHistory({
        sceneId: gameState.currentSceneId || '',
        speaker: null,
        text: response.narrative,
        type: 'narrative',
      });

      // Update scene if provided
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
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/engine/AINarrator.ts src/engine/prompts.ts src/hooks/useAINarrator.ts
git commit -m "feat: add AI Narrator service with Gemini API integration"
```

---

### Task 7: Story Script Engine (Scripted Nodes)

**Files:**
- Create: `src/engine/StoryScript.ts`
- Create: `src/data/story/nodes/prologue.json` (example)
- Create: `src/data/story/characters/index.json`
- Create: `src/data/story/world/lore.json`

**Interfaces:**
- Consumes: Types from Task 2, AINarrator from Task 6
- Produces: Story node loading, navigation, scripted content playback

- [ ] **Step 1: Create example scripted story node**

```json
{
  "id": "prologue_01",
  "type": "scripted",
  "title": "Chương 1: Nhập Môn",
  "sceneData": {
    "background": "temple_exterior",
    "characters": [
      { "id": "elder", "sprite": "elder_neutral", "position": "center" }
    ],
    "bgm": "peaceful",
    "transition": "fade"
  },
  "content": {
    "paragraphs": [
      {
        "speaker": null,
        "text": "Thanh Vân Sơn sương mù bao phủ, những ngọn thông già vươn cao chạm mây. Không khí trong lành, mát lạnh, mang theo mùi hương thông và đất ẩm.",
        "delay": 1000
      },
      {
        "speaker": null,
        "text": "Ngươi đứng trước cổng núi Thanh Vân Tông, trái tim đập nhanh. Hôm nay là ngày Đại Bàn - lễ hội tuyển đệ tử hàng năm. Ngươi - một phàm nhân từ villages dưới chân núi - đã vượt qua bao thử thách để đến đây.",
        "delay": 1500
      },
      {
        "speaker": "Lão Tổ Thanh Vân",
        "text": "Hmm... Một thân Phàm Cốt, lại mang Thiên Linh Căn. Thật là hiếm gặp.",
        "characterId": "elder",
        "expression": "elder_serious",
        "delay": 500
      },
      {
        "speaker": "Lão Tổ Thanh Vân",
        "text": "Lão phu là Lão Tổ Thanh Vân, trưởng lão ngoại môn. Ngươi tên là gì? Và ngươi đến đây để làm gì?",
        "characterId": "elder",
        "expression": "elder_neutral"
      }
    ]
  },
  "transitions": [
    {
      "targetNodeId": "prologue_02_intro",
      "choiceId": "introduce_self",
      "type": "direct"
    },
    {
      "targetNodeId": "ai_bridge_elder_reaction",
      "choiceId": "ask_question",
      "type": "ai_bridge"
    },
    {
      "targetNodeId": "prologue_02_silent",
      "choiceId": "stay_silent",
      "type": "direct"
    }
  ],
  "conditions": [],
  "metadata": {
    "chapter": "Chương 1: Nhập Môn",
    "estimatedDuration": 5,
    "tags": ["prologue", "elder", "introduction"]
  }
}
```

- [ ] **Step 2: Create character profiles**

```json
{
  "elder": {
    "id": "elder",
    "name": "Lão Tổ Thanh Vân",
    "title": "Trưởng lão ngoại môn Thanh Vân Tông",
    "cultivation": "Hóa Thần sơ kỳ",
    "personality": "Nghiêm khắc, công chính, thương yêu đệ tử nhưng không biểu hiện ra ngoài. Nói chuyện chậm rãi, dùng 'lão phu', văn phong trang trọng.",
    "sprites": {
      "neutral": "elder_neutral",
      "smile": "elder_smile",
      "serious": "elder_serious",
      "angry": "elder_angry",
      "surprised": "elder_surprised"
    },
    "voice": "low_male"
  },
  "lan": {
    "id": "lan",
    "name": "Tiểu Lan",
    "title": "Đệ tử nội môn, Trúc Cơ trung kỳ",
    "personality": "Hoạt bát, ham chơi, thích trêu chọc sư huynh/sư tỷ. Nói nhanh, dùng từ lóng, emoji. Thích ăn ngon.",
    "sprites": {
      "neutral": "lan_neutral",
      "happy": "lan_happy",
      "pout": "lan_pout",
      "excited": "lan_excited",
      "shy": "lan_shy"
    },
    "voice": "high_female"
  },
  "huyet_y": {
    "id": "huyet_y",
    "name": "Huyết Y",
    "title": "Đệ tử Huyết Ma Tông, Kim Đan sơ kỳ",
    "personality": "Cao ngạo, khinh thường chính đạo, tuân thủ quy tắc ma đạo riêng. Nói ít, hành động quyết đoán.",
    "sprites": {
      "neutral": "huyet_y_neutral",
      "smirk": "huyet_y_smock",
      "cold": "huyet_y_cold",
      "battle": "huyet_y_battle"
    },
    "voice": "mid_male"
  }
}
```

- [ ] **Step 3: Create world lore data**

```json
{
  "worldName": "Thanh Vân Cửu Trọng",
  "cultivationRealms": [
    { "id": "lianqi", "name": "Luyện Khí", "stages": 9, "description": "Hấp thu linh khí, rèn luyện thân thể" },
    { "id": "zhuzhi", "name": "Trúc Cơ", "stages": 9, "description": "Kết tinh linh cơ, nền tảng đại đạo" },
    { "id": "jindan", "name": "Kim Đan", "stages": 9, "description": "Kết đan trong cơ thể, bắt đầu bất tử" },
    { "id": "yuanying", "name": "Nguyên Anh", "stages": 9, "description": "Nhân anh thoát xác, thần thức hóa hình" },
    { "id": "huashen", "name": "Hóa Thần", "stages": 9, "description": "Thần hồn hợp nhất, cảm ứng thiên địa" },
    { "id": "lianxu", "name": "Luyện Hư", "stages": 9, "description": "Rèn hư nhập vi, chạm đến pháp tắc" },
    { "id": "dacheng", "name": "Đại Thừa", "stages": 9, "description": "Đại đạo thành tựu, chuẩn bị độ kiếp" },
    { "id": "dongji", "name": "Động Tịch", "stages": 9, "description": "Mở động phủ, tạo thế giới nhỏ" },
    { "id": "shengxian", "name": "Thăng Tiên", "stages": 1, "description": "Bay thăng Tiên Giới, vĩnh hằng bất diệt" }
  ],
  "sects": [
    {
      "id": "thanh_van",
      "name": "Thanh Vân Tông",
      "alignment": "Chính đạo",
      "specialty": "Kiếm thuật, Phong Lôi pháp, Trận pháp",
      "location": "Thanh Vân Sơn",
      "reputation": "Uy danh cao, giáo dục đệ tử nghiêm ngặt"
    },
    {
      "id": "huyet_ma",
      "name": "Huyết Ma Tông",
      "alignment": "Ma đạo",
      "specialty": "Huyết pháp, Độc thuật, Tàn khốc",
      "location": "Ma Uyên",
      "reputation": "Tàn bạo, quyền lực là trên hết"
    },
    {
      "id": "wuji",
      "name": "Vô Cực Các",
      "alignment": "Trung lập",
      "specialty": "Thương mại, Trí mạng, Kiếm thuật tự do",
      "location": "Vô Cực Hải",
      "reputation": "Tự do, thực dụng, giàu có"
    }
  ],
  "locations": [
    { "id": "thanh_van_mountain", "name": "Thanh Vân Sơn", "type": "Sect", "description": "Chốn tu tiên chính đạo, sương mù năm tháng" },
    { "id": "ma_uyen", "name": "Ma Uyên", "type": "Sect", "description": "Lộng lẫy huyết sắc, tiếng kêu rên ngày đêm" },
    { "id": "mortal_village", "name": "Phàm Giới", "type": "Village", "description": "Những ngôi làng phàm nhân dưới chân núi" }
  ]
}
```

- [ ] **Step 4: Implement StoryScript engine**

```typescript
import type { StoryNode, ScriptedParagraph, Choice, SceneData, GameState } from '@/types';

class StoryScript {
  private nodes: Map<string, StoryNode> = new Map();
  private currentNodeId: string | null = null;
  private loaded = false;

  async loadAllNodes(): Promise<void> {
    if (this.loaded) return;

    // In production, use import.meta.glob or dynamic imports
    // For now, load index and fetch individually
    try {
      const indexResponse = await fetch('/data/story/nodes/index.json');
      const index: string[] = await indexResponse.json();

      await Promise.all(
        index.map(async (nodeId) => {
          const response = await fetch(`/data/story/nodes/${nodeId}.json`);
          if (response.ok) {
            const node: StoryNode = await response.json();
            this.nodes.set(nodeId, node);
          }
        })
      );

      this.loaded = true;
      console.log(`Loaded ${this.nodes.size} story nodes`);
    } catch (error) {
      console.error('Failed to load story nodes:', error);
    }
  }

  getNode(nodeId: string): StoryNode | undefined {
    return this.nodes.get(nodeId);
  }

  getCurrentNode(): StoryNode | undefined {
    return this.currentNodeId ? this.nodes.get(this.currentNodeId) : undefined;
  }

  setCurrentNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.currentNodeId = nodeId;
      return true;
    }
    return false;
  }

  getAvailableTransitions(gameState: GameState): Array<{ node: StoryNode; transition: NodeTransition }> {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return [];

    return currentNode.transitions
      .map(t => {
        const targetNode = this.nodes.get(t.targetNodeId);
        return targetNode ? { node: targetNode, transition: t } : null;
      })
      .filter((t): t is { node: StoryNode; transition: NodeTransition } =>
        t !== null && this.evaluateConditions(t.transition.conditions, gameState)
      );
  }

  private evaluateConditions(conditions: NodeTransition['conditions'], gameState: GameState): boolean {
    if (!conditions || conditions.length === 0) return true;
    // Reuse condition evaluation logic from StateManager
    return conditions.every(c => {
      let value: unknown;
      switch (c.type) {
        case 'flag': value = gameState.flags[c.key]; break;
        case 'variable': value = gameState.variables[c.key]; break;
        case 'relationship': value = gameState.relationships[c.key]; break;
        case 'inventory': value = gameState.inventory.some(i => i.id === c.key); break;
        default: return false;
      }
      return this.compareValues(value, c.operator, c.value);
    });
  }

  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'contains': return String(actual).includes(String(expected));
      default: return false;
    }
  }

  // Convert scripted content to choices for UI
  getChoicesFromNode(node: StoryNode): Choice[] {
    return node.transitions.map((t, i) => ({
      id: t.choiceId,
      text: this.getChoiceText(t.choiceId, node),
      conditions: t.conditions,
    }));
  }

  private getChoiceText(choiceId: string, node: StoryNode): string {
    // Map choiceId to display text - could be stored in node metadata
    const choiceTexts: Record<string, string> = {
      'introduce_self': 'Giới thiệu bản thân: "Tên tôi là..."',
      'ask_question': 'Hỏi: "Lão Tổ là ai? Tại sao lão ở đây?"',
      'stay_silent': 'Cúi đầu im lặng, chờ lệnh',
      'accept': 'Đồng ý nhập môn',
      'refuse': 'Từ chối, muốn về làng',
      'explore': 'Khám phá xung quanh',
      'train': 'Bắt đầu tu luyện ngay',
      'talk_lan': 'Tìm Tiểu Lan nói chuyện',
      'train_sword': 'Tập kiếm thuật',
      'meditate': 'Tĩnh tọa tu luyện',
    };
    return choiceTexts[choiceId] || choiceId;
  }

  // Get scripted paragraphs for TextBox
  getParagraphs(node: StoryNode): ScriptedParagraph[] {
    return node.content.paragraphs;
  }

  getSceneData(node: StoryNode): SceneData {
    return node.sceneData;
  }

  // Check if node is AI bridge (needs AI to generate transition)
  isAIBridge(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    return node?.type === 'ai_bridge';
  }

  // Get all nodes for debug/menu
  getAllNodes(): StoryNode[] {
    return Array.from(this.nodes.values());
  }
}

export const storyScript = new StoryScript();
```

- [ ] **Step 5: Create node index file**

```json
[
  "prologue_01",
  "prologue_02_intro",
  "prologue_02_silent",
  "ai_bridge_elder_reaction",
  "chapter1_01_sect_tour",
  "chapter1_02_meet_lan",
  "chapter1_03_cultivation_basics",
  "chapter1_ending_choice"
]
```

- [ ] **Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/engine/StoryScript.ts src/data/story/
git commit -m "feat: add story script engine with scripted nodes, characters, world lore"
```

---

### Task 8: Scene Manager - Main Game Loop

**Files:**
- Create: `src/engine/SceneManager.ts`
- Create: `src/hooks/useSceneManager.ts`

**Interfaces:**
- Consumes: StateManager (Task 3), AssetLoader (Task 4), AINarrator (Task 6), StoryScript (Task 7), Scene components (Task 5)
- Produces: Central scene orchestration, navigation, game flow control

- [ ] **Step 1: Implement SceneManager**

```typescript
import { storyScript } from './StoryScript';
import { aiNarrator } from './AINarrator';
import { assetLoader } from './AssetLoader';
import { useGameStore } from './StateManager';
import type { GameState, SceneData, Choice, StoryNode, ScriptedParagraph } from '@/types';

type ScenePhase = 'loading' | 'scripted' | 'ai_generating' | 'ai_bridge' | 'choices' | 'transitioning' | 'ended';

interface SceneManagerState {
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

  private listeners: Set<() => void> = new Set();
  private subscribers: Array<(state: SceneManagerState) => void> = [];

  // Subscribe to state changes
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

  // Initialize game - load assets, story nodes, start first scene
  async initialize(startNodeId = 'prologue_01'): Promise<void> {
    this.setPhase('loading');

    // Load story nodes
    await storyScript.loadAllNodes();

    // Load asset manifest
    await assetLoader.loadManifest();

    // Start first scene
    await this.startNode(startNodeId);
  }

  // Start a scripted story node
  async startNode(nodeId: string): Promise<void> {
    const node = storyScript.getNode(nodeId);
    if (!node) {
      console.error(`Node not found: ${nodeId}`);
      return;
    }

    this.state.currentNode = node;
    storyScript.setCurrentNode(nodeId);

    // Preload assets for this scene
    await assetLoader.preloadScene(node.sceneData);

    // Set scene in game store
    const gameStore = useGameStore.getState();
    gameStore.setScene(nodeId, node.sceneData);
    gameStore.setChapter(node.metadata?.chapter || gameStore.chapter);

    // Load scripted content
    this.state.scriptedParagraphs = storyScript.getParagraphs(node);
    this.state.currentParagraphIndex = 0;
    this.state.displayedParagraphs = [];
    this.state.choices = storyScript.getChoicesFromNode(node);

    // Evaluate choice conditions
    const gameState = this.getGameState();
    this.state.choices = this.state.choices.filter(c =>
      !c.hidden && gameStore.evaluateConditions(c.conditions || [])
    );

    this.setPhase('scripted');
  }

  // Advance to next paragraph in scripted content
  nextParagraph(): boolean {
    if (this.state.phase !== 'scripted') return false;
    if (this.state.currentParagraphIndex >= this.state.scriptedParagraphs.length - 1) {
      // Scripted content complete, show choices
      this.setPhase('choices');
      return false;
    }

    this.state.currentParagraphIndex++;
    this.notify();
    return true;
  }

  // Handle choice selection
  async selectChoice(choiceId: string): Promise<void> {
    if (this.state.phase !== 'choices') return;

    const choice = this.state.choices.find(c => c.id === choiceId);
    if (!choice) return;

    this.state.pendingChoice = choice;
    this.setPhase('transitioning');

    const currentNode = this.state.currentNode;
    if (!currentNode) return;

    // Find transition
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

    // Handle based on transition type
    if (transition.type === 'ai_bridge') {
      // AI generates bridge scene
      await this.generateAIBridge(choiceId, targetNode);
    } else {
      // Direct transition to next scripted node
      await this.startNode(transition.targetNodeId);
    }
  }

  // Generate AI bridge between scripted nodes
  private async generateAIBridge(choiceId: string, targetNode: StoryNode): Promise<void> {
    this.setPhase('ai_generating');

    const gameState = this.getGameState();
    const playerInput = `Player chọn: ${choiceId}. Mô tả phản ứng của NPC và chuyển cảnh đến ${targetNode.title}.`;

    try {
      const response = await aiNarrator.generateScene(gameState, undefined, playerInput);

      // Apply AI response to game state (handled by useAINarrator hook)
      // But we need to update scene data here
      const currentScene = useGameStore.getState().currentSceneData;
      const newSceneData: SceneData = {
        background: response.sceneData.background || currentScene?.background || 'black',
        characters: response.sceneData.characters || currentScene?.characters || [],
        bgm: response.sceneData.bgm || currentScene?.bgm,
        transition: 'fade',
      };

      useGameStore.getState().setScene(`ai_bridge_${choiceId}`, newSceneData);

      // Store AI narrative for display
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
      // Fallback: direct transition
      await this.startNode(targetNode.id);
    }
  }

  // Complete AI bridge, move to target node
  async completeAIBridge(targetNodeId: string): Promise<void> {
    await this.startNode(targetNodeId);
  }

  // Get current paragraph for display
  getCurrentParagraph(): ScriptedParagraph | null {
    if (this.state.currentParagraphIndex < this.state.scriptedParagraphs.length) {
      return this.state.scriptedParagraphs[this.state.currentParagraphIndex];
    }
    return null;
  }

  // Get displayed paragraphs (for history effect)
  getDisplayedParagraphs(): ScriptedParagraph[] {
    return this.state.scriptedParagraphs.slice(0, this.state.currentParagraphIndex + 1);
  }

  // Get available choices
  getChoices(): Choice[] {
    return this.state.choices;
  }

  // Get game state for AI
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

  // Skip current text (for skip mode)
  skipText(): void {
    if (this.state.phase === 'scripted' || this.state.phase === 'ai_bridge') {
      this.state.currentParagraphIndex = this.state.scriptedParagraphs.length - 1;
      this.notify();
    }
  }

  // Check if can advance
  canAdvance(): boolean {
    return this.state.phase === 'scripted' || this.state.phase === 'ai_bridge';
  }

  // Check if showing choices
  isShowingChoices(): boolean {
    return this.state.phase === 'choices';
  }

  // Save/Load support
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

- [ ] **Step 2: Create React hook for SceneManager**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { sceneManager } from '@/engine/SceneManager';
import { useAINarrator } from '@/hooks/useAINarrator';
import { useGameStore } from '@/engine/StateManager';
import type { SceneManagerState, Choice } from '@/types';

export function useSceneManager() {
  const [state, setState] = useState<SceneManagerState>(sceneManager.getState());
  const { generateScene, isLoading: aiLoading } = useAINarrator();
  const gameStore = useGameStore();

  // Subscribe to scene manager
  useEffect(() => {
    const unsubscribe = sceneManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // Initialize game on mount
  useEffect(() => {
    sceneManager.initialize().catch(console.error);
  }, []);

  // Wrapped actions
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

  // Expose state + actions
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
    aiLoading,
  };
}
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/engine/SceneManager.ts src/hooks/useSceneManager.ts
git commit -m "feat: add SceneManager for game flow orchestration"
```

---

### Task 9: Main App Component & Routing

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/UI/SaveLoadMenu.tsx`
- Create: `src/components/UI/HistoryLog.tsx`
- Create: `src/components/UI/SettingsMenu.tsx`
- Create: `src/components/UI/StatsPanel.tsx`
- Create: `src/components/UI/TopBar.tsx`
- Create: `src/components/UI/index.ts`
- Create: `src/components/Layout.tsx`

**Interfaces:**
- Consumes: All hooks and components from Tasks 3-8
- Produces: Complete game UI layout

- [ ] **Step 1: Create Layout component**

```tsx
import { useSceneManager } from '@/hooks/useSceneManager';
import { SceneContainer } from '@/components/Scene';
import { TopBar } from '@/components/UI/TopBar';
import { SaveLoadMenu } from '@/components/UI/SaveLoadMenu';
import { HistoryLog } from '@/components/UI/HistoryLog';
import { SettingsMenu } from '@/components/UI/SettingsMenu';
import { StatsPanel } from '@/components/UI/StatsPanel';
import { useGameStore } from '@/engine/StateManager';

export function Layout() {
  const {
    phase,
    currentParagraph,
    displayedParagraphs,
    choices,
    canAdvance,
    isShowingChoices,
    nextParagraph,
    selectChoice,
    skipText,
    aiLoading,
  } = useSceneManager();

  const { settings, setSettings } = useGameStore((s) => ({
    settings: s.settings,
    setSettings: s.setSettings,
  }));

  const showSaveLoad = useGameStore((s) => s.saveMetadata.slots.length > 0); // Simplified
  const showHistory = useGameStore((s) => s.history.length > 0);

  // For scripted content, combine all displayed paragraphs
  const scriptedContent = displayedParagraphs.length > 0
    ? displayedParagraphs
    : currentParagraph ? [currentParagraph] : [];

  const handleKeyDown = (e: KeyboardEvent) => {
    // Global shortcuts
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Quick save
    }
    if (e.key === 'Escape') {
      // Close menus
    }
  };

  // Disable global keys when typing in inputs
  // (handled by individual components)

  return (
    <div className="relative w-full h-screen novel-bg overflow-hidden">
      {/* Top Bar */}
      <TopBar
        chapter={useGameStore.getState().chapter}
        playtime={useGameStore.getState().playtime}
        onSave={() => { /* open save menu */ }}
        onLoad={() => { /* open load menu */ }}
        onSettings={() => { /* open settings */ }}
        onHistory={() => { /* open history */ }}
        onStats={() => { /* open stats */ }}
      />

      {/* Main Scene */}
      {phase !== 'loading' && (
        <SceneContainer
          sceneData={useGameStore.getState().currentSceneData || {
            background: 'black',
            characters: [],
          }}
          content={scriptedContent}
          choices={choices}
          onChoicesReady={() => {}}
          onChoiceSelect={selectChoice}
          onSceneComplete={nextParagraph}
        />
      )}

      {/* Loading Screen */}
      {phase === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center novel-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-novel-accent border-t-transparent mx-auto mb-4" />
            <p className="text-novel-text text-xl">Đang tải thế giới...</p>
          </div>
        </div>
      )}

      {/* AI Generating Overlay */}
      {aiLoading && phase === 'ai_generating' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 novel-panel rounded-xl border border-novel-accent/30 animate-pulse">
          <div className="flex items-center gap-3 text-novel-text">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-novel-accent border-t-transparent" />
            AI Narrator đang viết tiếp câu chuyện...
          </div>
        </div>
      )}

      {/* Modals */}
      <SaveLoadMenu />
      <HistoryLog />
      <SettingsMenu />
      <StatsPanel />
    </div>
  );
}
```

- [ ] **Step 2: Create TopBar component**

```tsx
interface TopBarProps {
  chapter: string;
  playtime: number;
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onStats: () => void;
}

export function TopBar({ chapter, playtime, onSave, onLoad, onSettings, onHistory, onStats }: TopBarProps) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto flex items-center justify-between">
        {/* Chapter title */}
        <div className="text-novel-text font-serif text-lg">
          {chapter}
        </div>

        {/* Center: playtime */}
        <div className="text-novel-muted text-sm font-mono">
          {formatTime(playtime)}
        </div>

        {/* Right: menu buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onHistory}
            className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text"
            title="Lịch sử (H)"
          >
            📜
          </button>
          <button
            onClick={onStats}
            className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text"
            title="Thống kê"
          >
            📊
          </button>
          <button
            onClick={onSave}
            className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-accent"
            title="Lưu game (Ctrl+S)"
          >
            💾
          </button>
          <button
            onClick={onLoad}
            className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text"
            title="Tải game"
          >
            📁
          </button>
          <button
            onClick={onSettings}
            className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text"
            title="Cài đặt (ESC)"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create SaveLoadMenu component**

```tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { SaveSlot } from '@/types';

export function SaveLoadMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const { saveMetadata, saveGame, loadGame, deleteSave, exportSave, importSave } = useGameStore();

  const slots = saveMetadata.slots;
  const currentSlot = saveMetadata.currentSlot;

  const formatSlot = (slot: SaveSlot | undefined) => {
    if (!slot) return 'Trống';
    const date = new Date(slot.timestamp).toLocaleString('vi-VN');
    const time = Math.floor(slot.playtime / 60);
    return `${slot.chapter} - ${date} (${time}ph)`;
  };

  const handleSave = (slotId: number) => {
    // Capture screenshot
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    // Note: In real implementation, use html2canvas or similar
    // For now, skip screenshot
    saveGame(slotId);
    setIsOpen(false);
  };

  const handleLoad = (slotId: number) => {
    if (loadGame(slotId)) {
      setIsOpen(false);
      // Scene will reload via game store changes
    }
  };

  const handleDelete = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xóa slot này?')) {
      deleteSave(slotId);
    }
  };

  const handleExport = (slotId: number) => {
    const json = exportSave(slotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel_save_slot_${slotId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (slotId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && importSave(e.target.result as string, slotId)) {
        alert('Import thành công!');
      } else {
        alert('File save không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-novel-text">
            {mode === 'save' ? 'Lưu Game' : 'Tải Game'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('save')}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'save' ? 'bg-novel-accent text-white' : 'bg-novel-bg/50 text-novel-text'}`}
            >
              Lưu
            </button>
            <button
              onClick={() => setMode('load')}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'load' ? 'bg-novel-accent text-white' : 'bg-novel-bg/50 text-novel-text'}`}
            >
              Tải
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(slotId => {
            const slot = slots.find(s => s.id === slotId);
            const isCurrent = currentSlot === slotId;
            return (
              <div
                key={slotId}
                className={`relative p-4 rounded-xl border-2 transition-colors ${
                  isCurrent ? 'border-novel-accent bg-novel-accent/5' : 'border-novel-muted/20 hover:border-novel-accent/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-novel-accent">Slot {slotId}</span>
                  {isCurrent && <span className="text-xs text-novel-accent bg-novel-accent/10 px-2 py-0.5 rounded">Đang chơi</span>}
                </div>
                <p className="text-novel-text text-sm mb-2">{formatSlot(slot)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => mode === 'save' ? handleSave(slotId) : handleLoad(slotId)}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium
                      bg-novel-accent/20 text-novel-text hover:bg-novel-accent/30"
                  >
                    {mode === 'save' ? 'Lưu' : 'Tải'}
                  </button>
                  {slot && (
                    <>
                      <button
                        onClick={(e) => handleExport(slotId)}
                        className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-novel-text"
                        title="Xuất file"
                      >
                        📤
                      </button>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        id={`import-${slotId}`}
                        onChange={(e) => e.target.files?.[0] && handleImport(slotId, e.target.files[0])}
                      />
                      <label
                        htmlFor={`import-${slotId}`}
                        className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-novel-text cursor-pointer"
                        title="Nhập file"
                      >
                        📥
                      </label>
                      <button
                        onClick={(e) => handleDelete(slotId, e)}
                        className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-red-400"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create HistoryLog component**

```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function HistoryLog() {
  const [isOpen, setIsOpen] = useState(false);
  const { history, clearHistory } = useGameStore();

  const reversedHistory = [...history].reverse();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden novel-panel rounded-2xl border border-novel-accent/30 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-novel-accent/20">
          <h2 className="text-xl font-serif text-novel-text">Lịch sử</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { if (confirm('Xóa lịch sử?')) clearHistory(); }}
              className="px-3 py-1 rounded-lg text-sm text-novel-muted hover:text-red-400"
            >
              Xóa tất cả
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {reversedHistory.length === 0 ? (
            <p className="text-novel-muted text-center py-8">Chưa có lịch sử</p>
          ) : (
            reversedHistory.map((entry, i) => (
              <div
                key={entry.id}
                className={`p-3 rounded-lg border-l-4 ${entry.type === 'dialog' ? 'border-novel-accent bg-novel-accent/5' : 'border-novel-muted/30 bg-novel-bg/30'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-novel-muted text-xs font-mono shrink-0 mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                  <div className="flex-1 min-w-0">
                    {entry.speaker && (
                      <p className="text-novel-accent font-medium text-sm">{entry.speaker}</p>
                    )}
                    <p className="text-novel-text whitespace-pre-wrap">{entry.text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create SettingsMenu component**

```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, setSettings } = useGameStore((s) => ({
    settings: s.settings,
    setSettings: s.setSettings,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-md novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-novel-text">Cài đặt</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Text Speed */}
          <div>
            <label className="block text-novel-text text-sm mb-2">Tốc độ chữ: {settings.textSpeed}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.textSpeed}
              onChange={(e) => setSettings({ textSpeed: Number(e.target.value) })}
              className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent"
            />
          </div>

          {/* Auto Speed */}
          <div>
            <label className="block text-novel-text text-sm mb-2">Tốc độ tự động: {settings.autoSpeed}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={settings.autoSpeed}
              onChange={(e) => setSettings({ autoSpeed: Number(e.target.value) })}
              className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent"
            />
          </div>

          {/* Skip Unread */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.skipUnread}
              onChange={(e) => setSettings({ skipUnread: e.target.checked })}
              className="w-4 h-4 accent-novel-accent rounded"
            />
            <span className="text-novel-text">Bỏ qua đoạn đã đọc (Skip mode)</span>
          </label>

          {/* Volume */}
          <div className="space-y-4">
            <h3 className="text-novel-text font-medium">Âm thanh</h3>
            {(['master', 'bgm', 'sfx', 'voice'] as const).map(key => (
              <div key={key}>
                <label className="block text-novel-text text-sm mb-1 capitalize">
                  {key}: {Math.round(settings.volume[key] * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume[key]}
                  onChange={(e) => setSettings({ volume: { ...settings.volume, [key]: Number(e.target.value) } })}
                  className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent"
                />
              </div>
            ))}
          </div>

          {/* Language */}
          <div>
            <label className="block text-novel-text text-sm mb-2">Ngôn ngữ</label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ language: e.target.value as 'vi' | 'en' })}
              className="w-full px-3 py-2 rounded-lg bg-novel-bg/50 border border-novel-muted/30 text-novel-text focus:border-novel-accent focus:outline-none"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm('Khôi phục cài đặt mặc định?')) {
                setSettings({
                  textSpeed: 3,
                  autoSpeed: 3,
                  skipUnread: false,
                  volume: { master: 0.8, bgm: 0.7, sfx: 0.8, voice: 1.0 },
                  windowed: false,
                  language: 'vi',
                });
              }
            }}
            className="w-full py-2 px-4 rounded-lg bg-novel-muted/20 text-novel-muted hover:bg-novel-muted/30 transition-colors"
          >
            Khôi phục mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create StatsPanel component**

```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { variables, flags, relationships, inventory, playtime, chapter } = useGameStore();

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-novel-text">Thống kê</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* General */}
          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Chung</h3>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-novel-muted">Chương: </span><span className="text-novel-text">{chapter}</span></div>
              <div><span className="text-novel-muted">Thời gian: </span><span className="text-novel-text">{formatTime(playtime)}</span></div>
              <div><span className="text-novel-muted">Biến số: </span><span className="text-novel-text">{Object.keys(variables).length}</span></div>
              <div><span className="text-novel-muted">Flags: </span><span className="text-novel-text">{Object.keys(flags).filter(k => flags[k]).length}/{Object.keys(flags).length}</span></div>
            </div>
          </div>

          {/* Relationships */}
          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Mối quan hệ</h3>
            {Object.entries(relationships).length === 0 ? (
              <p className="text-novel-muted">Chưa gặp ai</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(relationships).map(([charId, value]) => (
                  <div key={charId} className="flex items-center gap-3">
                    <span className="w-32 text-novel-text text-sm capitalize">{charId}</span>
                    <div className="flex-1 h-2 bg-novel-bg/50 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300"
                        style={{ width: `${(value + 100) / 2}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-novel-text text-sm font-mono">
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inventory */}
          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Túi đồ</h3>
            {inventory.length === 0 ? (
              <p className="text-novel-muted">Trống</p>
            ) : (
              <div className="space-y-2">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-novel-bg/50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-novel-text">{item.name}</span>
                      <span className="text-novel-muted text-xs">{item.type}</span>
                    </div>
                    <span className="text-novel-text font-mono">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variables */}
          <details className="border border-novel-muted/20 rounded-lg overflow-hidden">
            <summary className="p-3 cursor-pointer text-novel-accent font-medium">
              Biến số ({Object.keys(variables).length})
            </summary>
            <div className="p-3 max-h-64 overflow-y-auto">
              {Object.entries(variables).length === 0 ? (
                <p className="text-novel-muted">Không có</p>
              ) : (
                <dl className="space-y-1">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <dt className="text-novel-muted font-mono">{key}</dt>
                      <dd className="text-novel-text">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </details>

          {/* Flags */}
          <details className="border border-novel-muted/20 rounded-lg overflow-hidden">
            <summary className="p-3 cursor-pointer text-novel-accent font-medium">
              Flags ({Object.keys(flags).filter(k => flags[k]).length}/{Object.keys(flags).length})
            </summary>
            <div className="p-3 max-h-64 overflow-y-auto">
              <dl className="space-y-1">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-novel-muted font-mono">{key}</dt>
                    <dd className={value ? 'text-green-400' : 'text-red-400'}>
                      {value ? '✓ Bật' : '✗ Tắt'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create UI index.ts**

```typescript
export { TopBar } from './TopBar';
export { SaveLoadMenu } from './SaveLoadMenu';
export { HistoryLog } from './HistoryLog';
export { SettingsMenu } from './SettingsMenu';
export { StatsPanel } from './StatsPanel';
```

- [ ] **Step 8: Update App.tsx**

```tsx
import { Layout } from '@/components/Layout';
import '@/styles/globals.css'; // Create this file

function App() {
  return <Layout />;
}

export default App;
```

- [ ] **Step 9: Create global styles**

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-serif: 'Noto Serif JP', serif;
  }

  * {
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #1a1a2e;
  }
  ::-webkit-scrollbar-thumb {
    background: #e94560;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #ff6b7a;
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid #e94560;
    outline-offset: 2px;
  }

  /* Selection */
  ::selection {
    background: #e94560;
    color: white;
  }
}

@layer components {
  .novel-bg {
    background-color: #1a1a2e;
  }

  .novel-panel {
    background-color: #16213e;
  }

  .novel-text {
    color: #eaeaea;
    line-height: 1.8;
  }

  .novel-accent {
    color: #e94560;
  }

  .novel-muted {
    color: #8b8b8b;
  }

  /* Textbox specific */
  .textbox-text {
    font-family: var(--font-serif);
    font-size: 1.125rem;
    line-height: 2;
    letter-spacing: 0.02em;
  }

  @media (min-width: 768px) {
    .textbox-text {
      font-size: 1.25rem;
    }
  }

  /* Button styles */
  .btn-choice {
    @apply w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200;
    @apply bg-novel-panel/90 backdrop-blur-sm;
    @apply border-novel-accent/30 text-novel-text;
    @apply hover:border-novel-accent hover:bg-novel-accent/10;
    @apply focus:ring-2 focus:ring-novel-accent/50 focus:outline-none;
  }

  .btn-choice:disabled {
    @apply border-novel-muted/30 text-novel-muted cursor-not-allowed;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slide-up {
    animation: slideUp 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
```

- [ ] **Step 10: Update main.tsx to import styles**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 11: Run TypeScript check and dev server**

Run: `npx tsc --noEmit && npm run dev`
Expected: No type errors, game loads at localhost:5173

- [ ] **Step 12: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx src/components/UI/ src/styles/globals.css src/main.tsx
git commit -m "feat: add main app layout with all UI components"
```

---

### Task 10: Save/Load Integration & Persistence

**Files:**
- Modify: `src/engine/StateManager.ts` (enhance save/load)
- Create: `src/hooks/useAutoSave.ts`

**Interfaces:**
- Consumes: StateManager from Task 3
- Produces: Auto-save on choices, save versioning, migration

- [ ] **Step 1: Add auto-save hook**

```typescript
import { useEffect } from 'react';
import { useGameStore } from '@/engine/StateManager';
import { sceneManager } from '@/engine/SceneManager';

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
```

- [ ] **Step 2: Add to Layout.tsx**

```tsx
import { useAutoSave } from '@/hooks/useAutoSave';

export function Layout() {
  useAutoSave();
  // ... rest of component
}
```

- [ ] **Step 3: Add save version migration (in StateManager)**

```typescript
// In StateManager.ts, add to loadGame:
loadGame: (slotId) => {
  try {
    const saved = localStorage.getItem(`save_slot_${slotId}`);
    if (!saved) return false;
    const slot: SaveSlot = JSON.parse(saved);

    // Migration logic for future versions
    if (slot.version !== '1.0.0') {
      console.warn(`Save version mismatch: ${slot.version}, migrating...`);
      // Add migration steps here
    }

    // ... rest of loadGame
  }
}
```

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAutoSave.ts src/components/Layout.tsx src/engine/StateManager.ts
git commit -m "feat: add auto-save and save versioning"
```

---

### Task 11: Polish & Bug Fixes

**Files:**
- Various fixes across codebase
- Create: `src/components/Scene/TransitionOverlay.tsx` (scene transitions)
- Create: `public/robots.txt`, `public/sitemap.xml` (for deployment)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Polished, deployable game

- [ ] **Step 1: Add scene transition overlay**

```tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function TransitionOverlay() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const currentSceneId = useGameStore((s) => s.currentSceneId);

  useEffect(() => {
    // Show transition when scene changes
    setDirection('out');
    setVisible(true);
    const timer = setTimeout(() => {
      setDirection('in');
      const timer2 = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer2);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentSceneId]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-novel-bg transition-opacity duration-300 ${
        direction === 'in' ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
}
```

- [ ] **Step 2: Add to Layout.tsx**

```tsx
import { TransitionOverlay } from '@/components/Scene/TransitionOverlay';

// In Layout component, add before closing div:
<TransitionOverlay />
```

- [ ] **Step 3: Add keyboard shortcuts help modal**

```tsx
// src/components/UI/HelpModal.tsx
import { useState } from 'react';

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'Space / Enter / →', action: 'Tiếp tục / Chọn' },
    { key: 'S', action: 'Bỏ qua văn bản (Skip)' },
    { key: 'A', action: 'Bật/tắt Auto' },
    { key: 'H', action: 'Mở lịch sử' },
    { key: 'Esc', action: 'Đóng menu / Mở cài đặt' },
    { key: 'Ctrl+S', action: 'Lưu game nhanh' },
    { key: '1-4', action: 'Chọn lựa chọn nhanh' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-md novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-novel-text">Phím tắt</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
        </div>
        <dl className="space-y-3">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-novel-muted/10">
              <kbd className="px-2 py-1 bg-novel-bg/50 rounded border border-novel-muted/30 text-novel-text text-sm font-mono">{key}</kbd>
              <span className="text-novel-muted text-sm">{action}</span>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add to TopBar or Layout**

- [ ] **Step 5: Create deployment files**

```txt
# public/robots.txt
User-agent: *
Disallow: /

# public/sitemap.xml (optional for personal use)
```

- [ ] **Step 6: Build and verify production build**

Run: `npm run build`
Expected: Successful build in `dist/`

- [ ] **Step 7: Test locally with preview**

Run: `npm run preview`
Expected: Game works at localhost:4173

- [ ] **Step 8: Commit final polish**

```bash
git add .
git commit -m "polish: add transitions, help modal, deployment files"
```

---

### Task 12: Documentation & Asset Guide

**Files:**
- Create: `README.md`
- Create: `ASSETS_GUIDE.md`
- Create: `STORY_AUTHORING.md`
- Create: `.env.example` (if not created)

**Interfaces:**
- Consumes: All implementation
- Produces: Documentation for future reference

- [ ] **Step 1: Create README.md**

```markdown
# Interactive Visual Novel

Personal-use Visual Novel engine with AI Narrator (Gemini 1.5 Flash) for deep branching stories.

## Features
- Visual Novel UI: backgrounds, character sprites, textbox, choices
- Hybrid story: scripted nodes + AI improvisation
- Deep branching with variables, flags, relationships, inventory
- Save/Load system (10 slots + export/import JSON)
- AI Narrator via Gemini 1.5 Flash API
- Auto-save, history log, stats panel
- Keyboard shortcuts, settings, accessibility

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and add your Gemini API key
cp .env.example .env
# Edit .env: VITE_GEMINI_API_KEY=your_key_here

# Start dev server
npm run dev

# Build for production
npm run build
npm run preview
```

## Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create API key
3. Add to `.env`

## Project Structure
```
src/
├── components/     # React UI components
├── engine/         # Core game logic (StateManager, SceneManager, AINarrator, StoryScript, AssetLoader)
├── hooks/          # React hooks
├── types/          # TypeScript types
├── data/story/     # Story content (JSON)
└── styles/         # Global CSS
public/assets/      # Game assets (backgrounds, sprites, audio)
```

## Adding Assets
See [ASSETS_GUIDE.md](ASSETS_GUIDE.md)

## Writing Story Content
See [STORY_AUTHORING.md](STORY_AUTHORING.md)

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space / Enter / → | Continue / Select |
| S | Skip text |
| A | Toggle Auto |
| H | History log |
| Esc | Close menu / Settings |
| Ctrl+S | Quick save |
| 1-4 | Quick choice select |

## Deployment
Deploy `dist/` folder to Vercel, Netlify, or GitHub Pages.

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

## License
Personal use only.
```

- [ ] **Step 2: Create ASSETS_GUIDE.md**

```markdown
# Asset Guide

## Directory Structure
```
public/assets/
├── manifest.json          # Auto-generated or manual
├── backgrounds/           # 1920x1080 WebP
│   ├── temple_exterior.webp
│   ├── temple_interior.webp
│   └── black.webp         # Required fallback
├── sprites/               # Transparent WebP, ~800px height
│   ├── elder_neutral.webp
│   ├── elder_smile.webp
│   └── protagonist_neutral.webp
└── audio/
    ├── bgm/               # OGG, loopable, ~1-3 min
    │   ├── peaceful.ogg
    │   └── tension.ogg
    └── sfx/               # OGG, short
        ├── click.ogg
        └── page_turn.ogg
```

## Manifest Format
```json
{
  "backgrounds": { "key": "assets/backgrounds/file.webp" },
  "sprites": { "key": "assets/sprites/file.webp" },
  "audio": {
    "bgm": { "key": "assets/audio/bgm/file.ogg" },
    "sfx": { "key": "assets/audio/sfx/file.ogg" }
  },
  "version": "1.0.0"
}
```

## Asset Sources (Free/CC0)
- **Backgrounds**: itch.io (search "free background"), OpenGameArt, Unsplash (edit to 1920x1080)
- **Sprites**: itch.io "free character sprites", OpenGameArt, Picrew (for personal use)
- **Audio**: Freesound.org, OpenGameArt, Incompetech (Kevin MacLeod)

## Naming Conventions
- Backgrounds: `{location}_{variant}.webp` (e.g., `temple_interior_night.webp`)
- Sprites: `{character}_{emotion}.webp` (e.g., `elder_serious.webp`)
- BGM: `{mood}.ogg` (e.g., `battle.ogg`)
- SFX: `{action}.ogg` (e.g., `magic_cast.ogg`)

## Optimization
- Use WebP for images (90% quality)
- Use OGG for audio (128kbps)
- Keep backgrounds < 500KB, sprites < 200KB
- Total assets target: < 50MB for fast loading
```

- [ ] **Step 3: Create STORY_AUTHORING.md**

```markdown
# Story Authoring Guide

## Scripted Nodes (JSON)

Each major story beat is a `.json` file in `src/data/story/nodes/`.

### Node Structure
```json
{
  "id": "unique_node_id",
  "type": "scripted|ai_bridge|ending",
  "title": "Display title",
  "sceneData": { ... },
  "content": { "paragraphs": [...] },
  "transitions": [...],
  "conditions": [...],
  "metadata": { "chapter": "...", "tags": [...] }
}
```

### SceneData
```json
{
  "background": "asset_key",
  "characters": [
    { "id": "elder", "sprite": "elder_serious", "position": "center" }
  ],
  "bgm": "peaceful",
  "transition": "fade"
}
```

### Paragraphs
```json
{
  "speaker": "Character Name" or null for narrator,
  "text": "Dialog or narrative text. Use \\n\\n for paragraph breaks.",
  "characterId": "elder",
  "expression": "elder_serious",
  "delay": 1000,
  "autoAdvance": false
}
```

### Transitions
```json
{
  "targetNodeId": "next_node_id",
  "choiceId": "choice_identifier",
  "type": "direct|ai_bridge",
  "conditions": [...]
}
```

### Conditions
```json
{
  "type": "flag|variable|relationship|inventory",
  "key": "variable_name",
  "operator": "eq|neq|gt|lt|gte|lte|contains",
  "value": true|"string"|123
}
```

## Hybrid Story Design

### Scripted Nodes (You Write)
- Major plot points
- Character introductions
- Key revelations
- Branch merges
- Endings

### AI Bridges (AI Generates)
- Transitions between scripted nodes
- Reactions to player free-form choices
- Minor conversations
- Exploration scenes

### Best Practices
1. **Keep scripted nodes focused** - One major beat per node
2. **Use ai_bridge for flexibility** - Let AI handle "what happens next" after choices
3. **Define clear conditions** - Use flags/variables to gate content
4. **Test branches** - Play through each path
5. **Track variables** - Document what each flag/variable means

## Adding New Nodes
1. Create `src/data/story/nodes/your_node_id.json`
2. Add to `src/data/story/nodes/index.json`
3. Reference in transitions from other nodes
4. Test in game

## Character Profiles
Edit `src/data/story/characters/index.json` to add/modify characters.
Sprites referenced must exist in `public/assets/sprites/`.

## World Lore
Edit `src/data/story/world/lore.json` for cultivation realms, sects, locations.
```

- [ ] **Step 4: Create .env.example**

```env
# Gemini API Key (get from https://aistudio.google.com/)
VITE_GEMINI_API_KEY=your_api_key_here
```

- [ ] **Step 5: Commit documentation**

```bash
git add README.md ASSETS_GUIDE.md STORY_AUTHORING.md .env.example
git commit -m "docs: add README, asset guide, story authoring guide"
```

---

## Plan Complete

**Total Tasks:** 12
**Estimated Time:** 2-3 days for full implementation

### Execution Recommendation

**Use Subagent-driven development** because:
- Tasks have clear interfaces and dependencies (Task 1→2→3→4→5→6→7→8→9→10→11→12)
- Each task produces testable deliverables
- Independent review per task catches integration issues early
- Story/asset tasks (7, 12) can run in parallel with engine tasks

### Review Focus Tests (from spec)

| # | Risk | Test Location |
|---|------|---------------|
| 1 | AI JSON parse failure | Task 6: `AINarrator.parseResponse()` unit test |
| 2 | Save corruption | Task 3: `StateManager.loadGame()` with malformed JSON |
| 3 | Asset loading failure | Task 4: `AssetLoader.loadImage()` with 404 |
| 4 | Invalid state changes | Task 6: `useAINarrator` onSuccess validation |
| 5 | Rate limit handling | Task 6: `AINarrator.generateScene()` retry logic |

---

**Ready for execution. Please confirm:**
1. Plan captures requirements correctly?
2. Execute via **Subagent-driven** (recommended) or **Native**?
3. Any tasks to add/remove/modify?