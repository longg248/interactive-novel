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