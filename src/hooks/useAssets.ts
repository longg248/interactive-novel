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
        if (mounted && m) {
          setManifest(m);
          setAssetManifest(m);
          setLoading(false);
        } else if (mounted) {
          setError(new Error('Manifest is null'));
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
    await assetLoader.preloadScene(sceneData);
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