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

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const autoTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const skipRef = useRef(false);
  const autoRef = useRef(false);

  // Refs keep the typewriter callbacks reading current values instead of the
  // ones captured when the callback was created.
  const paragraphsRef = useRef(paragraphs);
  const indexRef = useRef(currentIndex);
  const continueRef = useRef<() => void>(() => undefined);
  const completeRef = useRef(onComplete);
  paragraphsRef.current = paragraphs;
  indexRef.current = currentIndex;
  completeRef.current = onComplete;

  const currentPara = paragraphs[currentIndex];
  const textSpeed = settings.textSpeed * 20;
  const autoSpeed = settings.autoSpeed * 500;

  const handleTypeComplete = useCallback(() => {
    setShowContinue(true);
    if (autoRef.current && indexRef.current < paragraphsRef.current.length - 1) {
      autoTimeoutRef.current = window.setTimeout(() => continueRef.current(), autoSpeed);
    }
  }, [autoSpeed]);

  const typeText = useCallback(
    (text: string) => {
      setIsTyping(true);
      setDisplayedText('');

      if (textSpeed <= 0) {
        setDisplayedText(text);
        setIsTyping(false);
        handleTypeComplete();
        return;
      }

      let i = 0;
      const type = () => {
        if (skipRef.current) {
          skipRef.current = false;
          setDisplayedText(text);
          setIsTyping(false);
          handleTypeComplete();
          return;
        }
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i += 1;
          typingTimeoutRef.current = window.setTimeout(type, textSpeed);
        } else {
          setIsTyping(false);
          handleTypeComplete();
        }
      };
      type();
    },
    [textSpeed, handleTypeComplete]
  );

  const handleContinue = useCallback(() => {
    if (isTyping) {
      skipRef.current = true;
      return;
    }
    const list = paragraphsRef.current;
    const idx = indexRef.current;
    if (idx < list.length - 1) {
      const next = idx + 1;
      setCurrentIndex(next);
      indexRef.current = next;
      onParagraphChange?.(next);
    } else {
      setIsComplete(true);
      completeRef.current();
    }
  }, [isTyping, onParagraphChange]);

  continueRef.current = handleContinue;

  // History: record a paragraph once its full text has been shown.
  useEffect(() => {
    if (currentPara && currentPara.text.length > 0 && displayedText === currentPara.text) {
      addHistory({
        sceneId: '',
        speaker: currentPara.speaker,
        text: currentPara.text,
        type: currentPara.speaker ? 'dialog' : 'narrative',
      });
    }
  }, [displayedText, currentPara, addHistory]);

  // Type the paragraph at currentIndex.
  useEffect(() => {
    setShowContinue(false);
    if (currentPara) {
      typeText(currentPara.text);
    }
  }, [currentIndex, currentPara, typeText]);

  // Keyboard: Space/Enter/Right advance, S skips typing, A toggles auto.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
        e.preventDefault();
        continueRef.current();
      } else if (e.code === 'KeyS') {
        skipRef.current = true;
      } else if (e.code === 'KeyA') {
        autoRef.current = !autoRef.current;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(autoTimeoutRef.current);
    },
    []
  );

  if (!currentPara) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 p-6 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        {currentPara.speaker && (
          <div className="mb-2 text-novel-accent font-medium text-lg px-2">
            {currentPara.speaker}
          </div>
        )}

        <div
          onClick={() => continueRef.current()}
          className="novel-panel rounded-xl p-5 md:p-6 relative bg-novel-panel/95 backdrop-blur-sm border border-novel-accent/20 cursor-pointer select-none"
        >
          <p className="text-novel-text text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
            {displayedText}
          </p>

          {showContinue && !isComplete && (
            <div className="absolute bottom-3 right-3 animate-bounce text-novel-accent/70">
              ▼
            </div>
          )}

          {autoRef.current && (
            <div className="absolute top-3 right-3 text-xs text-novel-muted flex gap-2 items-center">
              <span className="text-novel-accent">⏵ AUTO</span>
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