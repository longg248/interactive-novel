import { useEffect, useState } from 'react';
import { Background } from './Background';
import { Character } from './Character';
import { TextBox } from './TextBox';
import { ChoiceButtons } from './ChoiceButtons';
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
        paragraphs={content}
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