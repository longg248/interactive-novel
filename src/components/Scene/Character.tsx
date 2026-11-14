import { useEffect, useState } from 'react';
import { useSprite } from '@/hooks/useAssets';
import type { CharacterSprite } from '@/types';

interface CharacterProps {
  character: CharacterSprite;
  className?: string;
}

// Inline positioning: Tailwind has no `left-1/12`, so the old classes did nothing.
const POSITION_STYLE: Record<CharacterSprite['position'], React.CSSProperties> = {
  left: { left: '8%' },
  center: { left: '50%', transform: 'translateX(-50%)' },
  right: { right: '8%' },
  hidden: { left: '50%', transform: 'translateX(-50%)' },
};

export function Character({ character, className = '' }: CharacterProps) {
  const spriteSrc = useSprite(character.sprite);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  // New image => forget a previous load error; fade in on mount.
  useEffect(() => {
    setFailed(false);
  }, [spriteSrc]);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!spriteSrc || failed || character.position === 'hidden') return null;

  return (
    <div
      className={`absolute bottom-0 z-20 transition-opacity duration-300 ease-out ${className}`}
      style={{ ...POSITION_STYLE[character.position], opacity: visible ? 1 : 0 }}
    >
      <img
        src={spriteSrc}
        alt={character.id}
        onError={() => setFailed(true)}
        className="max-h-[70vh] object-contain filter drop-shadow-2xl"
      />
    </div>
  );
}
