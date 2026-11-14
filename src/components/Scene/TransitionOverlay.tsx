import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function TransitionOverlay() {
  const [visible, setVisible] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const currentSceneId = useGameStore((s) => s.currentSceneId);
  const first = useRef(true);

  useEffect(() => {
    // No black flash on the very first render.
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    setOpaque(true);
    const t1 = window.setTimeout(() => setOpaque(false), 300);
    const t2 = window.setTimeout(() => setVisible(false), 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [currentSceneId]);

  if (!visible) return null;

  // pointer-events-none: the overlay must never swallow clicks on choices.
  return (
    <div
      className={`fixed inset-0 z-50 bg-novel-bg pointer-events-none transition-opacity duration-300 ${
        opaque ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
