import { useEffect, useMemo, useState } from 'react';
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
  const [paraIndex, setParaIndex] = useState(0);

  // A paragraph may switch a character's expression (stored as a sprite key).
  const characters = useMemo(() => {
    const para = content[paraIndex];
    if (!para?.characterId || !para.expression) return sceneData.characters;
    return sceneData.characters.map((c) =>
      c.id === para.characterId ? { ...c, sprite: para.expression as string } : c
    );
  }, [sceneData.characters, content, paraIndex]);

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
        {characters.map((char) => (
          <Character key={char.id} character={char} />
        ))}
      </div>

      <TextBox paragraphs={content} onComplete={handleTextComplete} onParagraphChange={setParaIndex} />

      {showChoices && choices.length > 0 && (
        <ChoiceButtons choices={choices} onSelect={handleChoiceSelect} />
      )}
    </div>
  );
}