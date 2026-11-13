import { useEffect, useState } from 'react';
import { useSprite } from '@/hooks/useAssets';
import type { CharacterSprite } from '@/types';

interface CharacterProps {
  character: CharacterSprite;
  className?: string;
}

const POSITION_STYLES: Record<CharacterSprite['position'], string> = {
  left: 'left-1/12',
  center: 'left-1/2',
  right: 'right-1/12',
  hidden: 'opacity-0 pointer-events-none',
};

const POSITION_TRANSFORMS: Record<CharacterSprite['position'], string> = {
  left: '-translate-x-0',
  center: '-translate-x-1/2',
  right: '-translate-x-0',
  hidden: '-translate-x-0',
};

export function Character({ character, className }: CharacterProps) {
  const spriteSrc = useSprite(character.sprite);
  const [opacity, setOpacity] = useState(character.position === 'hidden' ? 0 : 1);
  const [transform, setTransform] = useState(POSITION_TRANSFORMS[character.position]);

  useEffect(() => {
    if (character.animation === 'fade') {
      setOpacity(character.position === 'hidden' ? 0 : 1);
    } else if (character.animation === 'slide') {
      setTransform(POSITION_TRANSFORMS[character.position]);
    } else {
      setOpacity(character.position === 'hidden' ? 0 : 1);
      setTransform(POSITION_TRANSFORMS[character.position]);
    }
  }, [character.position, character.animation]);

  if (!spriteSrc || character.position === 'hidden') return null;

  return (
    <div
      className={`absolute bottom-0 z-20 transition-all duration-300 ease-out ${POSITION_STYLES[character.position]} ${className}`}
      style={{ opacity, transform: `translateX(${transform})` }}
    >
      <img
        src={spriteSrc}
        alt={character.id}
        className="max-h-[70vh] object-contain filter drop-shadow-2xl"
      />
    </div>
  );
}