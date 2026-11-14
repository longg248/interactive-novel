import { useEffect, useMemo } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { Choice } from '@/types';

interface ChoiceButtonsProps {
  choices: Choice[];
  onSelect: (choiceId: string) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onSelect, disabled }: ChoiceButtonsProps) {
  const evaluateConditions = useGameStore((s) => s.evaluateConditions);

  const availableChoices = useMemo(
    () =>
      choices.filter(c => {
        if (c.hidden) return false;
        if (c.disabled) return true;
        return evaluateConditions(c.conditions || []);
      }),
    [choices, evaluateConditions]
  );

  // Number keys pick a choice directly.
  useEffect(() => {
    if (disabled) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const choice = availableChoices[n - 1];
      if (choice && !choice.disabled) {
        e.preventDefault();
        onSelect(choice.id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [availableChoices, onSelect, disabled]);

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