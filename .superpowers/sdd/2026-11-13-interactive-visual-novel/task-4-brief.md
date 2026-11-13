# Task 4: Asset Loading & Manifest

## Goal
Implement asset loading system with manifest parsing, preloading, and React hooks for easy asset access in components.

## Files to Create
- `src/engine/AssetLoader.ts` - Asset loading class with caching
- `src/hooks/useAssets.ts` - React hooks for asset loading
- `public/assets/manifest.json` - Example manifest structure
- `public/assets/backgrounds/.gitkeep` - Placeholder
- `public/assets/sprites/.gitkeep` - Placeholder
- `public/assets/audio/bgm/.gitkeep` - Placeholder
- `public/assets/audio/sfx/.gitkeep` - Placeholder

## Dependencies
- Types from Task 2 (`src/types/index.ts`)
- StateManager from Task 3 (`src/engine/StateManager.ts`)

## Exact Implementation (from plan)

### public/assets/manifest.json
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

### AssetLoader.ts
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

### useAssets.ts
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

## Global Constraints
- Assets self-hosted in `/public/assets/`
- Manifest at `/assets/manifest.json`
- Graceful handling of missing assets (warn but don't crash)
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-4-report.md`