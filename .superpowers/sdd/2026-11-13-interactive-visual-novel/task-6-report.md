## Status: DONE

## Commits
- eb56313 feat: add AI Narrator service with Gemini API (prompts, AINarrator, useAINarrator hook)

## Test Summary
- npx tsc --noEmit: PASS
- npm run dev: PASS

## Concerns
- Minor deviation from brief: Removed unused `queryClient` import and unused type imports (`GameState`, `AINarratorResponse`) to satisfy TypeScript strict mode.
- Fixed type safety issues in `onSuccess` handler: added undefined checks for `value` and `delta` before passing to state setters.
- Fallback response includes Vietnamese narrative when API key not set or API fails.
- React Query provides automatic retry with exponential backoff (default 3 retries).
- API key expected in `.env` as `VITE_GEMINI_API_KEY`.