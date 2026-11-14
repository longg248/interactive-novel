# Task 10: Save/Load Integration & Persistence

## Goal
Add auto-save functionality, save versioning/migration, and improve save/load integration.

## Files to Create/Modify
- `src/hooks/useAutoSave.ts` - Auto-save hook
- Modify `src/engine/StateManager.ts` - Add save version migration
- Modify `src/components/Layout.tsx` - Add useAutoSave hook

## Dependencies
- StateManager from Task 3
- SceneManager from Task 8

## Exact Implementation (from plan)

### useAutoSave.ts
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

### StateManager.ts - Add save version migration in loadGame
```typescript
// In loadGame method, add after parsing slot:
if (slot.version !== '1.0.0') {
  console.warn(`Save version mismatch: ${slot.version}, migrating...`);
  // Add migration steps here for future versions
  // For now, just update version
  slot.version = '1.0.0';
}
```

### Layout.tsx - Add useAutoSave
```tsx
import { useAutoSave } from '@/hooks/useAutoSave';

export function Layout() {
  useAutoSave();
  // ... rest of component
}
```

## Global Constraints
- Save slots in localStorage with version field
- Auto-save on beforeunload and every 5 minutes
- Migration logic for future save format changes
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-10-report.md`