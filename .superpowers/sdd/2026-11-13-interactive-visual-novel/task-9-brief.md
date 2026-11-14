# Task 9: Main App Component & Routing

## Goal
Create the main app layout with all UI components: TopBar, SaveLoadMenu, HistoryLog, SettingsMenu, StatsPanel, and integrate SceneContainer.

## Files to Create
- `src/components/UI/TopBar.tsx`
- `src/components/UI/SaveLoadMenu.tsx`
- `src/components/UI/HistoryLog.tsx`
- `src/components/UI/SettingsMenu.tsx`
- `src/components/UI/StatsPanel.tsx`
- `src/components/UI/index.ts`
- `src/components/Layout.tsx`
- Update `src/App.tsx`

## Dependencies
- Scene components from Task 5
- SceneManager hook from Task 8
- StateManager hooks from Task 3
- Types from Task 2

## Exact Implementation (from plan)

### TopBar.tsx
```tsx
import { useGameStore } from '@/engine/StateManager';

interface TopBarProps {
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onStats: () => void;
}

export function TopBar({ onSave, onLoad, onSettings, onHistory, onStats }: TopBarProps) {
  const chapter = useGameStore((s) => s.chapter);
  const playtime = useGameStore((s) => s.playtime);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto flex items-center justify-between">
        <div className="text-novel-text font-serif text-lg">
          {chapter}
        </div>
        <div className="text-novel-muted text-sm font-mono">
          {formatTime(playtime)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onHistory} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text" title="Lịch sử (H)">
            📜
          </button>
          <button onClick={onStats} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text" title="Thống kê">
            📊
          </button>
          <button onClick={onSave} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-accent" title="Lưu game (Ctrl+S)">
            💾
          </button>
          <button onClick={onLoad} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text" title="Tải game">
            📁
          </button>
          <button onClick={onSettings} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text" title="Cài đặt (ESC)">
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
}
```

### SaveLoadMenu.tsx
```tsx
import { useState, useEffect } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { SaveSlot } from '@/types';

export function SaveLoadMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const { saveMetadata, saveGame, loadGame, deleteSave, exportSave, importSave } = useGameStore();

  const slots = saveMetadata.slots;
  const currentSlot = saveMetadata.currentSlot;

  const formatSlot = (slot: SaveSlot | undefined) => {
    if (!slot) return 'Trống';
    const date = new Date(slot.timestamp).toLocaleString('vi-VN');
    const time = Math.floor(slot.playtime / 60);
    return `${slot.chapter} - ${date} (${time}ph)`;
  };

  const handleSave = (slotId: number) => {
    saveGame(slotId);
    setIsOpen(false);
  };

  const handleLoad = (slotId: number) => {
    if (loadGame(slotId)) {
      setIsOpen(false);
    }
  };

  const handleDelete = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Xóa slot này?')) {
      deleteSave(slotId);
    }
  };

  const handleExport = (slotId: number) => {
    const json = exportSave(slotId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novel_save_slot_${slotId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (slotId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && importSave(e.target.result as string, slotId)) {
        alert('Import thành công!');
      } else {
        alert('File save không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif text-novel-text">
            {mode === 'save' ? 'Lưu Game' : 'Tải Game'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode('save')}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'save' ? 'bg-novel-accent text-white' : 'bg-novel-bg/50 text-novel-text'}`}
            >
              Lưu
            </button>
            <button
              onClick={() => setMode('load')}
              className={`px-4 py-2 rounded-lg text-sm ${mode === 'load' ? 'bg-novel-accent text-white' : 'bg-novel-bg/50 text-novel-text'}`}
            >
              Tải
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">
              ✕
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(slotId => {
            const slot = slots.find(s => s.id === slotId);
            const isCurrent = currentSlot === slotId;
            return (
              <div
                key={slotId}
                className={`relative p-4 rounded-xl border-2 transition-colors ${
                  isCurrent ? 'border-novel-accent bg-novel-accent/5' : 'border-novel-muted/20 hover:border-novel-accent/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-novel-accent">Slot {slotId}</span>
                  {isCurrent && <span className="text-xs text-novel-accent bg-novel-accent/10 px-2 py-0.5 rounded">Đang chơi</span>}
                </div>
                <p className="text-novel-text text-sm mb-2">{formatSlot(slot)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => mode === 'save' ? handleSave(slotId) : handleLoad(slotId)}
                    className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-novel-accent/20 text-novel-text hover:bg-novel-accent/30"
                  >
                    {mode === 'save' ? 'Lưu' : 'Tải'}
                  </button>
                  {slot && (
                    <>
                      <button onClick={(e) => handleExport(slotId)} className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-novel-text" title="Xuất file">
                        📤
                      </button>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        id={`import-${slotId}`}
                        onChange={(e) => e.target.files?.[0] && handleImport(slotId, e.target.files[0])}
                      />
                      <label htmlFor={`import-${slotId}`} className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-novel-text cursor-pointer" title="Nhập file">
                        📥
                      </label>
                      <button onClick={(e) => handleDelete(slotId, e)} className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-red-400" title="Xóa">
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### HistoryLog.tsx
```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function HistoryLog() {
  const [isOpen, setIsOpen] = useState(false);
  const { history, clearHistory } = useGameStore();

  const reversedHistory = [...history].reverse();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden novel-panel rounded-2xl border border-novel-accent/30 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-novel-accent/20">
          <h2 className="text-xl font-serif text-novel-text">Lịch sử</h2>
          <div className="flex gap-2">
            <button onClick={() => { if (confirm('Xóa lịch sử?')) clearHistory(); }} className="px-3 py-1 rounded-lg text-sm text-novel-muted hover:text-red-400">
              Xóa tất cả
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {reversedHistory.length === 0 ? (
            <p className="text-novel-muted text-center py-8">Chưa có lịch sử</p>
          ) : (
            reversedHistory.map((entry, i) => (
              <div key={entry.id} className={`p-3 rounded-lg border-l-4 ${entry.type === 'dialog' ? 'border-novel-accent bg-novel-accent/5' : 'border-novel-muted/30 bg-novel-bg/30'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-novel-muted text-xs font-mono shrink-0 mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                  <div className="flex-1 min-w-0">
                    {entry.speaker && <p className="text-novel-accent font-medium text-sm">{entry.speaker}</p>}
                    <p className="text-novel-text whitespace-pre-wrap">{entry.text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

### SettingsMenu.tsx
```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, setSettings } = useGameStore((s) => ({
    settings: s.settings,
    setSettings: s.setSettings,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-md novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-novel-text">Cài đặt</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-novel-text text-sm mb-2">Tốc độ chữ: {settings.textSpeed}</label>
            <input type="range" min="1" max="5" value={settings.textSpeed} onChange={(e) => setSettings({ textSpeed: Number(e.target.value) })} className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent" />
          </div>

          <div>
            <label className="block text-novel-text text-sm mb-2">Tốc độ tự động: {settings.autoSpeed}</label>
            <input type="range" min="1" max="5" value={settings.autoSpeed} onChange={(e) => setSettings({ autoSpeed: Number(e.target.value) })} className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.skipUnread} onChange={(e) => setSettings({ skipUnread: e.target.checked })} className="w-4 h-4 accent-novel-accent rounded" />
            <span className="text-novel-text">Bỏ qua đoạn đã đọc (Skip mode)</span>
          </label>

          <div className="space-y-4">
            <h3 className="text-novel-text font-medium">Âm thanh</h3>
            {(['master', 'bgm', 'sfx', 'voice'] as const).map(key => (
              <div key={key}>
                <label className="block text-novel-text text-sm mb-1 capitalize">{key}: {Math.round(settings.volume[key] * 100)}%</label>
                <input type="range" min="0" max="1" step="0.1" value={settings.volume[key]} onChange={(e) => setSettings({ volume: { ...settings.volume, [key]: Number(e.target.value) } })} className="w-full h-2 bg-novel-bg/50 rounded-lg appearance-none accent-novel-accent" />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-novel-text text-sm mb-2">Ngôn ngữ</label>
            <select value={settings.language} onChange={(e) => setSettings({ language: e.target.value as 'vi' | 'en' })} className="w-full px-3 py-2 rounded-lg bg-novel-bg/50 border border-novel-muted/30 text-novel-text focus:border-novel-accent focus:outline-none">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <button onClick={() => { if (confirm('Khôi phục cài đặt mặc định?')) setSettings({ textSpeed: 3, autoSpeed: 3, skipUnread: false, volume: { master: 0.8, bgm: 0.7, sfx: 0.8, voice: 1.0 }, windowed: false, language: 'vi' }); }} className="w-full py-2 px-4 rounded-lg bg-novel-muted/20 text-novel-muted hover:bg-novel-muted/30 transition-colors">
            Khôi phục mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
```

### StatsPanel.tsx
```tsx
import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { variables, flags, relationships, inventory, playtime, chapter } = useGameStore();

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-novel-text">Thống kê</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Chung</h3>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><span className="text-novel-muted">Chương: </span><span className="text-novel-text">{chapter}</span></div>
              <div><span className="text-novel-muted">Thời gian: </span><span className="text-novel-text">{formatTime(playtime)}</span></div>
              <div><span className="text-novel-muted">Biến số: </span><span className="text-novel-text">{Object.keys(variables).length}</span></div>
              <div><span className="text-novel-muted">Flags: </span><span className="text-novel-text">{Object.keys(flags).filter(k => flags[k]).length}/{Object.keys(flags).length}</span></div>
            </div>
          </div>

          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Mối quan hệ</h3>
            {Object.entries(relationships).length === 0 ? (
              <p className="text-novel-muted">Chưa gặp ai</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(relationships).map(([charId, value]) => (
                  <div key={charId} className="flex items-center gap-3">
                    <span className="w-32 text-novel-text text-sm capitalize">{charId}</span>
                    <div className="flex-1 h-2 bg-novel-bg/50 rounded overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300" style={{ width: `${(value + 100) / 2}%` }} />
                    </div>
                    <span className="w-12 text-right text-novel-text text-sm font-mono">{value > 0 ? '+' : ''}{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-novel-accent font-medium mb-3 border-b border-novel-accent/20 pb-2">Túi đồ</h3>
            {inventory.length === 0 ? (
              <p className="text-novel-muted">Trống</p>
            ) : (
              <div className="space-y-2">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-novel-bg/50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-novel-text">{item.name}</span>
                      <span className="text-novel-muted text-xs">{item.type}</span>
                    </div>
                    <span className="text-novel-text font-mono">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <details className="border border-novel-muted/20 rounded-lg overflow-hidden">
            <summary className="p-3 cursor-pointer text-novel-accent font-medium">Biến số ({Object.keys(variables).length})</summary>
            <div className="p-3 max-h-64 overflow-y-auto">
              {Object.entries(variables).length === 0 ? (
                <p className="text-novel-muted">Không có</p>
              ) : (
                <dl className="space-y-1">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <dt className="text-novel-muted font-mono">{key}</dt>
                      <dd className="text-novel-text">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </details>

          <details className="border border-novel-muted/20 rounded-lg overflow-hidden">
            <summary className="p-3 cursor-pointer text-novel-accent font-medium">Flags ({Object.keys(flags).filter(k => flags[k]).length}/{Object.keys(flags).length})</summary>
            <div className="p-3 max-h-64 overflow-y-auto">
              <dl className="space-y-1">
                {Object.entries(flags).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-novel-muted font-mono">{key}</dt>
                    <dd className={value ? 'text-green-400' : 'text-red-400'}>{value ? '✓ Bật' : '✗ Tắt'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
```

### index.ts
```typescript
export { TopBar } from './TopBar';
export { SaveLoadMenu } from './SaveLoadMenu';
export { HistoryLog } from './HistoryLog';
export { SettingsMenu } from './SettingsMenu';
export { StatsPanel } from './StatsPanel';
```

### Layout.tsx
```tsx
import { useSceneManager } from '@/hooks/useSceneManager';
import { SceneContainer } from '@/components/Scene';
import { TopBar, SaveLoadMenu, HistoryLog, SettingsMenu, StatsPanel } from '@/components/UI';
import { useGameStore } from '@/engine/StateManager';
import { useState } from 'react';

export function Layout() {
  const {
    phase,
    currentParagraph,
    displayedParagraphs,
    choices,
    nextParagraph,
    selectChoice,
    skipText,
    canAdvance,
    isShowingChoices,
  } = useSceneManager();

  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const scriptedContent = displayedParagraphs.length > 0
    ? displayedParagraphs
    : currentParagraph ? [currentParagraph] : [];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      setShowSaveLoad(true);
    }
    if (e.key === 'Escape') {
      setShowSaveLoad(false);
      setShowHistory(false);
      setShowSettings(false);
      setShowStats(false);
    }
    if (e.key === 'h' || e.key === 'H') {
      if (!showSaveLoad && !showSettings && !showStats) setShowHistory(true);
    }
  };

  return (
    <div className="relative w-full h-screen novel-bg overflow-hidden">
      <TopBar
        onSave={() => setShowSaveLoad(true)}
        onLoad={() => setShowSaveLoad(true)}
        onSettings={() => setShowSettings(true)}
        onHistory={() => setShowHistory(true)}
        onStats={() => setShowStats(true)}
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
```

### App.tsx
```tsx
import { Layout } from '@/components/Layout';
import '@/styles/globals.css';

function App() {
  return <Layout />;
}

export default App;
```

## Global Constraints
- Modal components render conditionally (only when open)
- Keyboard shortcuts: Ctrl+S save, Esc close, H history
- All modals close on backdrop click
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-9-report.md`