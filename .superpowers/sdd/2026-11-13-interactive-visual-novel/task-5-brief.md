# Task 5: Scene Components (UI)

## Goal
Create reusable React components for the Visual Novel scene: Background, Character sprites, TextBox with typewriter effect, ChoiceButtons, and SceneContainer orchestrator.

## Files to Create
- `src/components/Scene/Background.tsx`
- `src/components/Scene/Character.tsx`
- `src/components/Scene/TextBox.tsx`
- `src/components/Scene/ChoiceButtons.tsx`
- `src/components/Scene/SceneContainer.tsx`
- `src/components/Scene/index.ts`

## Dependencies
- Types from Task 2 (`src/types/index.ts`)
- Hooks from Tasks 3-4 (`useGameState`, `useAssets`)
- Tailwind CSS classes (novel-* colors)

## Exact Implementation (from plan)

### Background.tsx
```tsx
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
```

### Character.tsx
```tsx
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
```

### TextBox.tsx
```tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { ScriptedParagraph } from '@/types';

interface TextBoxProps {
  paragraphs: ScriptedParagraph[];
  onComplete: () => void;
  onParagraphChange?: (index: number) => void;
}

export function TextBox({ paragraphs, onComplete, onParagraphChange }: TextBoxProps) {
  const { settings, addHistory } = useGameStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const skipRef = useRef(false);
  const autoRef = useRef(false);

  const currentPara = paragraphs[currentIndex];
  const textSpeed = settings.textSpeed * 20;
  const autoSpeed = settings.autoSpeed * 500;

  const typeText = useCallback((text: string, instant = false) => {
    setIsTyping(true);
    setDisplayedText('');
    if (instant || textSpeed <= 0) {
      setDisplayedText(text);
      setIsTyping(false);
      handleTypeComplete();
      return;
    }

    let i = 0;
    const type = () => {
      if (skipRef.current) {
        setDisplayedText(text);
        setIsTyping(false);
        skipRef.current = false;
        handleTypeComplete();
        return;
      }
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        typingTimeoutRef.current = setTimeout(type, textSpeed);
      } else {
        setIsTyping(false);
        handleTypeComplete();
      }
    };
    type();
  }, [textSpeed]);

  const handleTypeComplete = () => {
    setShowContinue(true);
    if (autoRef.current && currentIndex < paragraphs.length - 1) {
      setTimeout(() => handleContinue(), autoSpeed);
    }
  };

  const handleContinue = () => {
    if (isTyping) {
      skipRef.current = true;
      return;
    }
    if (currentIndex < paragraphs.length - 1) {
      setCurrentIndex(prev => prev + 1);
      onParagraphChange?.(currentIndex + 1);
    } else {
      setIsComplete(true);
      onComplete();
    }
  };

  const handleSkip = () => {
    skipRef.current = true;
  };

  const handleAutoToggle = () => {
    autoRef.current = !autoRef.current;
  };

  useEffect(() => {
    if (currentPara && displayedText === currentPara.text) {
      addHistory({
        sceneId: '',
        speaker: currentPara.speaker,
        text: currentPara.text,
        type: currentPara.speaker ? 'dialog' : 'narrative',
      });
    }
  }, [displayedText, currentPara, addHistory]);

  useEffect(() => {
    setShowContinue(false);
    if (currentPara) {
      typeText(currentPara.text);
    }
  }, [currentIndex, typeText]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleContinue();
      } else if (e.code === 'KeyS') {
        handleSkip();
      } else if (e.code === 'KeyA') {
        handleAutoToggle();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTyping, handleContinue, handleSkip, handleAutoToggle]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  if (!currentPara) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {currentPara.speaker && (
          <div className="mb-2 text-novel-accent font-medium text-lg px-2">
            {currentPara.speaker}
          </div>
        )}

        <div className="novel-panel rounded-xl p-5 md:p-6 relative bg-novel-panel/95 backdrop-blur-sm border border-novel-accent/20">
          <p className="novel-text text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
            {displayedText}
          </p>

          {showContinue && !isComplete && (
            <div className="absolute bottom-3 right-3 animate-bounce text-novel-accent/70">
              ▼
            </div>
          )}

          {(autoRef.current || skipRef.current) && (
            <div className="absolute top-3 right-3 text-xs text-novel-muted flex gap-2 items-center">
              {autoRef.current && <span className="text-novel-accent">⏵ AUTO</span>}
              {skipRef.current && <span>⏩ SKIP</span>}
            </div>
          )}
        </div>

        <div className="mt-3 text-xs text-novel-muted text-center">
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">Space</kbd>{' '}
          Next &nbsp;
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">S</kbd>{' '}
          Skip &nbsp;
          <kbd className="px-2 py-0.5 bg-novel-bg/50 rounded border border-novel-accent/10">A</kbd>{' '}
          Auto
        </div>
      </div>
    </div>
  );
}
```

### ChoiceButtons.tsx
```tsx
import { useGameStore } from '@/engine/StateManager';
import type { Choice } from '@/types';

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onSelect, disabled }: ChoiceButtonsProps) {
  const evaluateConditions = useGameStore((s) => s.evaluateConditions);

  const availableChoices = choices.filter(c => {
    if (c.hidden) return false;
    if (c.disabled) return true;
    return evaluateConditions(c.conditions || []);
  });

  if (availableChoices.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto space-y-3">
        {availableChoices.map((choice, index) => (
          <button
            key={choice.id}
            onClick={() => !choice.disabled && onSelect(choice.id)}
            disabled={disabled || choice.disabled}
            className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200
              novel-panel bg-novel-panel/90 backdrop-blur-sm
              ${choice.disabled
                ? 'border-novel-muted/30 text-novel-muted cursor-not-allowed'
                : 'border-novel-accent/30 text-novel-text hover:border-novel-accent hover:bg-novel-accent/10 focus:ring-2 focus:ring-novel-accent/50'
              }`}
            tabIndex={choice.disabled ? -1 : 0}
          >
            <span className="flex items-center gap-3">
              <span className="text-novel-accent font-mono text-lg">{index + 1}.</span>
              <span className="text-lg md:text-xl leading-relaxed">{choice.text}</span>
            </span>
            {choice.disabled && (
              <span className="absolute right-4 text-sm text-novel-muted">🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### SceneContainer.tsx
```tsx
import { useEffect, useState } from 'react';
import { Background } from './Background';
import { Character } from './Character';
import { TextBox } from './TextBox';
import { ChoiceButtons } from './ChoiceButtons';
import { useGameStore } from '@/engine/StateManager';
import type { SceneData, Choice, ScriptedParagraph } from '@/types';

interface SceneContainerProps {
  sceneData: SceneData;
  content: ScriptedParagraph[];
  choices: Choice[];
  onChoicesReady: (choices: Choice[]) => void;
  onChoiceSelect: (choiceId: string) => void;
  onSceneComplete: () => void;
}

export function SceneContainer({
  sceneData,
  content,
  choices,
  onChoicesReady,
  onChoiceSelect,
  onSceneComplete,
}: SceneContainerProps) {
  const [showChoices, setShowChoices] = useState(false);
  const [currentContent, setCurrentContent] = useState(content);

  useEffect(() => {
    onChoicesReady(choices);
  }, [choices, onChoicesReady]);

  const handleTextComplete = () => {
    setShowChoices(true);
  };

  const handleChoiceSelect = (choiceId: string) => {
    setShowChoices(false);
    onChoiceSelect(choiceId);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden novel-bg">
      <Background sceneData={sceneData} />

      <div className="absolute inset-0 z-10 pointer-events-none">
        {sceneData.characters.map((char) => (
          <Character key={char.id} character={char} />
        ))}
      </div>

      <TextBox
        paragraphs={currentContent}
        onComplete={handleTextComplete}
      />

      {showChoices && choices.length > 0 && (
        <ChoiceButtons
          choices={choices}
          onSelect={handleChoiceSelect}
        />
      )}

      {showChoices && choices.length === 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-6 pointer-events-none">
          <div className="max-w-xl mx-auto text-center text-novel-muted">
            <button
              onClick={onSceneComplete}
              className="px-8 py-3 rounded-xl border-2 border-novel-accent/30 text-novel-text hover:border-novel-accent hover:bg-novel-accent/10 transition-colors"
            >
              Tiếp tục ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### index.ts
```typescript
export { Background } from './Background';
export { Character } from './Character';
export { TextBox } from './TextBox';
export { ChoiceButtons } from './ChoiceButtons';
export { SceneContainer } from './SceneContainer';
```

## Global Constraints
- Use Tailwind classes with novel-* color palette
- Typewriter effect with configurable speed
- Keyboard shortcuts: Space/Enter → continue, S → skip, A → auto
- Accessible: proper tabIndex, disabled states
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-5-report.md`