## Status: DONE

## Commits
- 9577f51 feat: add auto-save hook, save version migration, and useAutoSave in Layout

## Test Summary
- npx tsc --noEmit: PASS
- npm run dev: PASS

## Concerns
- Auto-save triggers on `beforeunload` and every 5 minutes
- Save version migration logic added to `loadGame` - ready for future format changes
- Modals still self-managed (no external open/close control from TopBar)
- useAutoSave hook added to Layout component