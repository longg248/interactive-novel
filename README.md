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