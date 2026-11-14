# Task 12: Documentation & Asset Guide

## Goal
Create comprehensive documentation for the project: README, ASSETS_GUIDE, STORY_AUTHORING guide.

## Files to Create
- `README.md` - Main project documentation
- `ASSETS_GUIDE.md` - Asset management guide
- `STORY_AUTHORING.md` - Story content creation guide
- Update `.env.example` if needed

## Exact Implementation (from plan)

### README.md
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

### ASSETS_GUIDE.md
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

### STORY_AUTHORING.md
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

## Global Constraints
- Documentation in project root
- Markdown format
- Cross-referenced between guides

## Verification
1. Files created and readable
2. Cross-links work

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-12-report.md`