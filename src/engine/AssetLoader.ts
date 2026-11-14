import type { AssetManifest } from '@/types';
import { assetUrl } from './paths';

class AssetLoader {
  private manifest: AssetManifest | null = null;
  private cache: Map<string, HTMLImageElement | HTMLAudioElement> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  private manifestPromise: Promise<AssetManifest> | null = null;

  loadManifest(): Promise<AssetManifest> {
    if (this.manifestPromise) return this.manifestPromise;
    this.manifestPromise = (async () => {
      const response = await fetch(assetUrl('assets/manifest.json'));
      if (!response.ok) throw new Error('Failed to load asset manifest');
      const manifest = (await response.json()) as AssetManifest;
      this.manifest = manifest;
      return manifest;
    })().catch((e: unknown) => {
      this.manifestPromise = null; // allow retry
      throw e instanceof Error ? e : new Error(String(e));
    });
    return this.manifestPromise;
  }

  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  getPath(type: 'backgrounds' | 'sprites' | 'bgm' | 'sfx', key: string): string {
    if (!this.manifest) return '';
    const category = type === 'bgm' || type === 'sfx' ? 'audio' : type;
    const map = this.manifest[category as keyof AssetManifest] as Record<string, string>;
    const path = map?.[key];
    return path ? assetUrl(path) : '';
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

  // Public methods for direct loading (used by hooks)
  loadImage(src: string): Promise<void> {
    return this._loadImage(src);
  }

  loadAudio(src: string): Promise<void> {
    return this._loadAudio(src);
  }

  async preloadScene(sceneData: {
    background?: string;
    characters?: Array<{ sprite: string }>;
    bgm?: string;
  }): Promise<void> {
    const promises: Promise<void>[] = [];
    if (sceneData.background) {
      promises.push(this._loadImage(this.getPath('backgrounds', sceneData.background)));
    }
    if (sceneData.characters) {
      sceneData.characters.forEach(c => {
        promises.push(this._loadImage(this.getPath('sprites', c.sprite)));
      });
    }
    if (sceneData.bgm) {
      promises.push(this._loadAudio(this.getPath('bgm', sceneData.bgm)));
    }
    await Promise.all(promises);
  }

  private _loadImage(src: string): Promise<void> {
    if (!src) return Promise.resolve();
    if (this.cache.has(src)) return Promise.resolve();
    if (this.loadingPromises.has(src)) return this.loadingPromises.get(src)!;

    const promise = new Promise<void>((resolve) => {
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

  private _loadAudio(src: string): Promise<void> {
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