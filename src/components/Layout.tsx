import { useSceneManager } from '@/hooks/useSceneManager';
import { SceneContainer } from '@/components/Scene';
import { TopBar, SaveLoadMenu, HistoryLog, SettingsMenu, StatsPanel } from '@/components/UI';
import { useGameStore } from '@/engine/StateManager';
import { useAutoSave } from '@/hooks/useAutoSave';

export function Layout() {
  useAutoSave();
  
  const {
    phase,
    currentParagraph,
    displayedParagraphs,
    choices,
    nextParagraph,
    selectChoice,
  } = useSceneManager();

  const scriptedContent = displayedParagraphs.length > 0
    ? displayedParagraphs
    : currentParagraph ? [currentParagraph] : [];

  return (
    <div className="relative w-full h-screen novel-bg overflow-hidden">
      <TopBar
        onSave={() => {}}
        onLoad={() => {}}
        onSettings={() => {}}
        onHistory={() => {}}
        onStats={() => {}}
      />

      {phase !== 'loading' && (
        <SceneContainer
          sceneData={useGameStore.getState().currentSceneData || { background: 'black', characters: [] }}
          content={scriptedContent}
          choices={choices}
          onChoicesReady={() => {}}
          onChoiceSelect={selectChoice}
          onSceneComplete={nextParagraph}
        />
      )}

      {phase === 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center novel-bg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-novel-accent border-t-transparent mx-auto mb-4" />
            <p className="text-novel-text text-xl">Đang tải thế giới...</p>
          </div>
        </div>
      )}

      <SaveLoadMenu />
      <HistoryLog />
      <SettingsMenu />
      <StatsPanel />
    </div>
  );
}