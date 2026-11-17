import { useGameStore } from '@/engine/StateManager';

interface TopBarProps {
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onStats: () => void;
  onFree: () => void;
}

export function TopBar({ onSave, onLoad, onSettings, onHistory, onStats, onFree }: TopBarProps) {
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
          <button onClick={onFree} className="p-2 rounded-lg hover:bg-novel-panel/50 transition-colors text-novel-text" title="Nhập vai tự do">
            ✍️
          </button>
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