import { useEffect, useRef, useState } from 'react';
import { useBackground } from '@/hooks/useAssets';
import type { SceneData } from '@/types';

interface BackgroundProps {
  sceneData: SceneData;
  className?: string;
}

export function Background({ sceneData, className }: BackgroundProps) {
  const bgSrc = useBackground(sceneData.background);
  const [opacity, setOpacity] = useState(0);
  const prevSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (sceneData.transition === 'fade') {
      setOpacity(0);
      prevSrcRef.current = bgSrc;
      const fadeOut = setTimeout(() => {
        setOpacity(1);
      }, 150);
      return () => clearTimeout(fadeOut);
    } else {
      setOpacity(1);
    }
  }, [bgSrc, sceneData.transition]);

  return (
    <div className={`absolute inset-0 z-0 ${className}`} style={{ opacity }}>
      {bgSrc && (
        <img
          src={bgSrc}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-novel-bg/80 via-transparent to-transparent z-10 pointer-events-none" />
    </div>
  );
}