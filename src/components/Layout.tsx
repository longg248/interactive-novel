import { useSceneManager } from '@/hooks/useSceneManager';
import { SceneContainer, TransitionOverlay } from '@/components/Scene';
import { TopBar, SaveLoadMenu, HistoryLog, SettingsMenu, StatsPanel, HelpModal } from '@/components/UI';
import { useGameStore } from '@/engine/StateManager';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useUIStore } from '@/engine/UIState';
import { useEffect } from 'react';

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

  const {
    showSaveLoad,
    showHistory,
    showSettings,
    showStats,
    showHelp,
    openSaveLoad,
    openHistory,
    openSettings,
    openStats,
    openHelp,
    closeAll,
  } = useUIStore();

  const scriptedContent = displayedParagraphs.length > 0
    ? displayedParagraphs
    : currentParagraph ? [currentParagraph] : [];

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        openSaveLoad();
      }
      if (e.key === 'Escape') {
        closeAll();
      }
      if (e.key === 'h' || e.key === 'H') {
        if (!showSaveLoad && !showSettings && !showStats) {
          openHistory();
        }
      }
      if (e.key === '?') {
        openHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSaveLoad, showSettings, showStats, openSaveLoad, openHistory, openSettings, openStats, openHelp, closeAll]);

  return (
    <div className="relative w-full h-screen novel-bg overflow-hidden">
      <TopBar
        onSave={openSaveLoad}
        onLoad={openSaveLoad}
        onSettings={openSettings}
        onHistory={openHistory}
        onStats={openStats}
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

      <TransitionOverlay />
      <SaveLoadMenu isOpen={showSaveLoad} onClose={() => useUIStore.getState().closeSaveLoad()} />
      <HistoryLog isOpen={showHistory} onClose={() => useUIStore.getState().closeHistory()} />
      <SettingsMenu isOpen={showSettings} onClose={() => useUIStore.getState().closeSettings()} />
      <StatsPanel isOpen={showStats} onClose={() => useUIStore.getState().closeStats()} />
      <HelpModal isOpen={showHelp} onClose={() => useUIStore.getState().closeHelp()} />
    </div>
  );
}