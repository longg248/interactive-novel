# Interactive Visual Novel - Design Document

## Project Overview
Personal-use Visual Novel engine with AI Narrator (Gemini 1.5 Flash) for deep branching stories. Self-hosted assets, static deployment.

## Core Features

### 1. Scene System
- Background image + character sprites (multiple positions)
- Textbox with name, dialog, auto/skip modes
- Choice buttons (max 4 per scene)
- Transitions (fade, slide)

### 2. State Management
- Variables: `{ key: string, value: string|number|boolean }`
- Flags: `{ key: string, value: boolean }` (for conditionals)
- Inventory: array of item IDs
- Relationship meters: `{ characterId: number }` (-100 to 100)
- Playtime statistics

### 3. AI Narrator (Gemini 1.5 Flash)
**System Prompt includes:**
- World lore, geography, factions
- Character profiles (personality, speech patterns, secrets)
- Story rules (magic system, tech level, taboos)
- Current story arc & major plot points

**Structured Output (JSON):**
```json
{
  "narrative": "Mô tả cảnh + dialog NPC",
  "choices": [
    { "id": "c1", "text": "Lựa chọn 1", "conditions": {} },
    { "id": "c2", "text": "Lựa chọn 2", "conditions": { "flag": "met_elder", "value": true } }
  ],
  "stateChanges": {
    "variables": { "trust_elder": 10 },
    "flags": { "learned_secret": true },
    "relationship": { "elder": 5 }
  },
  "sceneData": {
    "background": "temple_interior",
    "characters": [{ "id": "elder", "sprite": "elder_smile", "position": "center" }]
  }
}
```

### 4. Hybrid Story Architecture
- **Scripted Nodes** (JSON): Major plot beats, fixed scenes, character introductions, endings
- **AI Improvisation**: Transitions, minor dialog, reactions to free-form choices, filler scenes
- **Routing**: Scripted node → AI bridge → Next scripted node

### 5. Save/Load System
- Auto-save at every choice
- Manual save slots (10)
- Export/Import JSON (backup/share)
- Save metadata: timestamp, playtime, current chapter, screenshot (canvas)

### 6. Asset Management
- `/public/assets/backgrounds/` - WebP, 1920x1080
- `/public/assets/sprites/` - WebP, transparent, named `{char}_{emotion}`
- `/public/assets/audio/` - BGM (ogg), SFX (ogg)
- Manifest JSON for preloading

## Technical Stack
- **React 18 + TypeScript + Vite**
- **Zustand** for state management
- **React Query** for AI API calls (caching, retry)
- **Tailwind CSS** for styling
- **Gemini API** (Google AI Studio key)
- **localStorage** for saves
- Deploy: Vercel/Netlify (static)

## File Structure
```
src/
├── components/
│   ├── Scene/
│   │   ├── Background.tsx
│   │   ├── Character.tsx
│   │   ├── TextBox.tsx
│   │   ├── ChoiceButtons.tsx
│   │   └── SceneContainer.tsx
│   ├── UI/
│   │   ├── SaveLoadMenu.tsx
│   │   ├── HistoryLog.tsx
│   │   ├── SettingsMenu.tsx
│   │   └── StatsPanel.tsx
│   └── Layout.tsx
├── engine/
│   ├── SceneManager.ts
│   ├── StateManager.ts
│   ├── AINarrator.ts
│   ├── StoryScript.ts
│   └── SaveManager.ts
├── data/
│   ├── story/
│   │   ├── nodes/          # Scripted story nodes
│   │   ├── characters/     # Character profiles
│   │   └── world/          # Lore, locations
│   └── assets/
│       └── manifest.json
├── hooks/
│   ├── useGameState.ts
│   ├── useAINarrator.ts
│   └── useAssets.ts
├── types/
│   └── index.ts
└── App.tsx
```

## API Integration (Gemini)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` (model mặc định `gemini-3.1-flash-lite`, đổi qua `VITE_GEMINI_MODEL`)
- Key stored in `.env` (VITE_GEMINI_API_KEY)
- Request: system prompt + conversation history + current state
- Response parsing: strict JSON, fallback to text if parse fails
- Rate limit handling: exponential backoff, queue

## Non-Goals
- Multiplayer/online features
- Complex RPG combat
- AI image generation
- Mobile app wrapper
- Editor/authoring tools (edit JSON directly)

## Constraints
- Free tier only (Gemini 1.5 Flash: 1500 req/day)
- No backend - all client-side
- Assets self-hosted (git LFS or separate CDN)
- Personal use - no analytics, auth, payments