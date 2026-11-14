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
    paragraphs,
    choices,
    completeScriptedContent,
    selectChoice,
  } = useSceneManager();

  const currentSceneId = useGameStore((s) => s.currentSceneId);

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
          key={currentSceneId ?? 'scene'}
          sceneData={useGameStore.getState().currentSceneData || { background: 'black', characters: [] }}
          content={paragraphs}
          choices={choices}
          onChoicesReady={() => {}}
          onChoiceSelect={selectChoice}
          onSceneComplete={completeScriptedContent}
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

      {phase === 'ended' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center novel-bg/90 backdrop-blur-sm pointer-events-none">
          <div className="text-center pointer-events-auto">
            <p className="text-novel-accent font-serif text-3xl mb-2">HẾT CHƯƠNG</p>
            <p className="text-novel-muted text-sm mb-6 max-w-md">
              Câu chuyện còn tiếp. Hãy tải lại game để bắt đầu một nhánh khác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl border-2 border-novel-accent/40 text-novel-text hover:border-novel-accent hover:bg-novel-accent/10 transition-colors"
              >
                Chơi lại từ đầu
              </button>
              <button
                onClick={openSaveLoad}
                className="px-6 py-3 rounded-xl border-2 border-novel-muted/30 text-novel-text hover:border-novel-accent/40 transition-colors"
              >
                Tải bản lưu
              </button>
            </div>
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