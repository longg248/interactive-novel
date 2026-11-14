## Status: DONE

## Commits
- 845f85e feat: add StoryScript engine and story data (nodes, characters, world lore)

## Test Summary
- npx tsc --noEmit: PASS
- npm run dev: PASS

## Concerns
- Fixed unused variable warnings in StoryScript.ts (removed unused `i` index and `node` parameter).
- Story nodes loaded from `/data/story/nodes/` via fetch - works with Vite dev server and static deployment.
- Hybrid architecture: scripted nodes (direct transitions) + AI bridges (type: 'ai_bridge') for dynamic content.
- Example node `prologue_01.json` demonstrates scripted content with character dialog, delays, and transitions.
- Character profiles and world lore stored as JSON for easy editing.