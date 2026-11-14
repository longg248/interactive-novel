import { useEffect, useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function TransitionOverlay() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const currentSceneId = useGameStore((s) => s.currentSceneId);

  useEffect(() => {
    // Show transition when scene changes
    setDirection('out');
    setVisible(true);
    const timer = setTimeout(() => {
      setDirection('in');
      const timer2 = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer2);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentSceneId]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-novel-bg transition-opacity duration-300 ${
        direction === 'in' ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
}