import { useGameStore } from '@/engine/StateManager';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
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
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-novel-text">Thống kê</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
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