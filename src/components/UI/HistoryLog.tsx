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
            reversedHistory.map((entry) => (
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