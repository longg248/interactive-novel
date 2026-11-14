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

  // The TextBox has shown every paragraph: reveal the choices and let the
  // scene manager know the scripted content is done.
  const handleTextComplete = () => {
    setShowChoices(true);
    onSceneComplete();
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

      <TextBox paragraphs={content} onComplete={handleTextComplete} />

      {showChoices && choices.length > 0 && (
        <ChoiceButtons choices={choices} onSelect={handleChoiceSelect} />
      )}
    </div>
  );
}