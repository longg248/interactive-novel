import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, InventoryItem,
  Condition, SceneData, HistoryEntry,
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
  saveGame: (slotId: number, screenshot?: string) => boolean;
  loadGame: (slotId: number) => boolean;
  deleteSave: (slotId: number) => void;
  exportSave: (slotId: number) => string; // JSON string
  importSave: (json: string, slotId: number) => boolean;
  refreshSlots: () => void;

  // Reset
  newGame: () => void;
  resetAll: () => void;
}

const SAVE_VERSION = '1.0.0';
const MAX_SLOT_ID = 10; // slot 0 = autosave, 1..10 = manual

function isValidSlot(v: unknown): v is SaveSlot {
  if (!v || typeof v !== 'object') return false;
  const s = v as Partial<SaveSlot>;
  const st = s.state as Partial<GameState> | undefined;
  return (
    typeof s.id === 'number' &&
    typeof s.timestamp === 'number' &&
    !!st &&
    typeof st === 'object' &&
    typeof st.variables === 'object' && st.variables !== null &&
    typeof st.flags === 'object' && st.flags !== null &&
    typeof st.relationships === 'object' && st.relationships !== null &&
    Array.isArray(st.inventory) &&
    Array.isArray(st.history) &&
    typeof st.playtime === 'number' &&
    typeof st.chapter === 'string'
  );
}

/** Read every save_slot_N from localStorage (slot list is not persisted by zustand). */
function readSlotsFromStorage(): SaveSlot[] {
  const slots: SaveSlot[] = [];
  try {
    for (let id = 0; id <= MAX_SLOT_ID; id++) {
      const raw = localStorage.getItem(`save_slot_${id}`);
      if (!raw) continue;
      const parsed: unknown = JSON.parse(raw);
      if (isValidSlot(parsed)) slots.push({ ...parsed, id });
    }
  } catch (e) {
    console.warn('Could not read save slots:', e);
  }
  return slots;
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
      saveMetadata: { slots: readSlotsFromStorage(), currentSlot: null, version: SAVE_VERSION },

      // Settings
      setSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // Assets
      setAssetManifest: (manifest) => set({ assetManifest: manifest }),
      getAssetPath: (type, key) => {
        const manifest = get().assetManifest;
        if (!manifest) return '';
        let map: Record<string, string> | undefined;
        if (type === 'bgm') map = manifest.audio.bgm;
        else if (type === 'sfx') map = manifest.audio.sfx;
        else map = manifest[type];
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
        if (!state.currentSceneId) return false; // nothing to save yet
        const slot: SaveSlot = {
          id: slotId,
          timestamp: Date.now(),
          playtime: state.playtime,
          chapter: state.chapter,
          sceneId: state.currentSceneId,
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
          version: SAVE_VERSION,
        };
        try {
          localStorage.setItem(`save_slot_${slotId}`, JSON.stringify(slot));
        } catch (e) {
          // Quota exceeded / storage blocked: report instead of pretending it worked.
          console.error('Save failed:', e);
          return false;
        }
        set((s) => {
          const slots = [...s.saveMetadata.slots.filter((x) => x.id !== slotId), slot].sort((a, b) => a.id - b.id);
          return {
            saveMetadata: {
              ...s.saveMetadata,
              slots,
              // Autosave (slot 0) must not change which manual slot is "current".
              currentSlot: slotId === 0 ? s.saveMetadata.currentSlot : slotId,
            },
          };
        });
        return true;
      },

      loadGame: (slotId) => {
        try {
          const saved = localStorage.getItem(`save_slot_${slotId}`);
          if (!saved) return false;
          const slot = JSON.parse(saved) as unknown;
          if (!isValidSlot(slot)) return false;

          // Migration logic for future versions
          if (slot.version !== '1.0.0') {
            console.warn(`Save version mismatch: ${slot.version}, migrating...`);
            // Add migration steps here for future versions
            // For now, just update version
            slot.version = '1.0.0';
          }

          set({
            variables: slot.state.variables,
            flags: slot.state.flags,
            inventory: slot.state.inventory,
            relationships: slot.state.relationships,
            currentSceneId: slot.state.currentSceneId,
            history: slot.state.history,
            playtime: slot.state.playtime,
            chapter: slot.state.chapter,
            saveMetadata: {
              ...get().saveMetadata,
              currentSlot: slotId === 0 ? get().saveMetadata.currentSlot : slotId,
            },
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
          const parsed: unknown = JSON.parse(json);
          if (!isValidSlot(parsed)) return false;
          const slot: SaveSlot = { ...parsed, id: slotId, version: SAVE_VERSION };
          localStorage.setItem(`save_slot_${slotId}`, JSON.stringify(slot));
          set((s) => ({
            saveMetadata: {
              ...s.saveMetadata,
              slots: [...s.saveMetadata.slots.filter((x) => x.id !== slotId), slot].sort((a, b) => a.id - b.id),
            },
          }));
          return true;
        } catch {
          return false;
        }
      },

      refreshSlots: () => set((s) => ({ saveMetadata: { ...s.saveMetadata, slots: readSlotsFromStorage() } })),

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
        try {
          for (let id = 0; id <= MAX_SLOT_ID; id++) localStorage.removeItem(`save_slot_${id}`);
          localStorage.removeItem('novel-game-store');
        } catch { /* storage unavailable */ }
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