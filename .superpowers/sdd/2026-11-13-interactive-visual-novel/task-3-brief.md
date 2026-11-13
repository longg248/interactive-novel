# Task 3: State Management (Zustand Store)

## Goal
Implement Zustand store for game state management with all actions, plus React hooks for typed access. Includes save/load system using localStorage.

## Files to Create
- `src/engine/StateManager.ts` - Zustand store with all game state & actions
- `src/hooks/useGameState.ts` - Typed hooks for components

## Dependencies
- Types from Task 2 (`src/types/index.ts`)

## Exact Implementation (from plan)

### StateManager.ts
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, GameVariables, GameFlags, InventoryItem,
  Relationships, Choice, Condition, SceneData, HistoryEntry,
  SaveSlot, SaveMetadata, GameSettings, AssetManifest,
  CharacterSprite
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

### useGameState.ts
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

## Global Constraints
- Zustand with persist middleware for settings only
- Save slots in localStorage (not in Zustand persist)
- TypeScript strict mode
- All types from `@/types`

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-3-report.md`