import { useEffect, useRef, useState } from 'react';
import { HELP_TEXT, useRoleplayStore } from '@/engine/RoleplayStore';
import type { OutputLength } from '@/engine/prompts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LENGTHS: Array<{ id: OutputLength; label: string }> = [
  { id: 'short', label: 'Ngắn' },
  { id: 'medium', label: 'Vừa' },
  { id: 'long', label: 'Dài' },
];

export function FreeRoleplay({ isOpen, onClose }: Props) {
  const messages = useRoleplayStore((s) => s.messages);
  const memories = useRoleplayStore((s) => s.memories);
  const worldNote = useRoleplayStore((s) => s.worldNote);
  const length = useRoleplayStore((s) => s.length);
  const busy = useRoleplayStore((s) => s.busy);
  const canRetry = useRoleplayStore((s) => s.lastFailedInput !== null);
  const { submit, retry, removeMemory, setWorldNote, setLength, clear } = useRoleplayStore.getState();

  const [input, setInput] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, busy, isOpen]);

  if (!isOpen) return null;

  const send = () => {
    const text = input;
    setInput('');
    void submit(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col novel-bg">
      <div className="flex items-center justify-between p-3 border-b border-novel-accent/20">
        <h2 className="text-novel-text font-serif text-lg">Nhập vai tự do</h2>
        <div className="flex items-center gap-2">
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLength(l.id)}
              className={`px-3 py-1 rounded-lg text-sm ${length === l.id ? 'bg-novel-accent text-white' : 'bg-novel-panel/50 text-novel-text'}`}
            >
              {l.label}
            </button>
          ))}
          <button onClick={() => setShowPanel((v) => !v)} className="px-3 py-1 rounded-lg text-sm bg-novel-panel/50 text-novel-text">
            Ghi nhớ ({memories.length})
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-novel-panel/50 text-novel-muted" aria-label="Đóng">
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <p className="text-novel-muted text-sm whitespace-pre-wrap">
              Bắt đầu bằng cách gõ hành động của bạn, ví dụ: "Ta bước vào cổng Thanh Vân Tông."{'\n\n'}
              {HELP_TEXT}
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-xl px-4 py-2 bg-novel-accent/20 text-novel-text whitespace-pre-wrap'
                  : m.role === 'ai'
                    ? 'max-w-[90%] rounded-xl px-4 py-3 novel-panel text-novel-text leading-relaxed whitespace-pre-wrap'
                    : 'text-xs text-novel-muted text-center whitespace-pre-wrap'
              }
            >
              {m.text}
            </div>
          ))}
          {busy && <div className="text-novel-muted text-sm animate-pulse">Người dẫn truyện đang viết...</div>}
          {canRetry && !busy && (
            <button onClick={() => void retry()} className="px-4 py-2 rounded-lg border border-novel-accent/40 text-novel-text text-sm">
              Thử lại
            </button>
          )}
          <div ref={endRef} />
        </div>

        {showPanel && (
          <aside className="w-72 shrink-0 border-l border-novel-accent/20 p-3 overflow-y-auto space-y-3">
            <h3 className="text-novel-text text-sm font-medium">Ghi nhớ (AI luôn nhớ)</h3>
            {memories.length === 0 && <p className="text-novel-muted text-xs">Dùng /nho &lt;nội dung&gt; để thêm.</p>}
            {memories.map((m, i) => (
              <div key={`${i}-${m}`} className="text-xs text-novel-text flex gap-2">
                <span className="flex-1 break-words">{i + 1}. {m}</span>
                <button onClick={() => removeMemory(i)} className="text-novel-muted hover:text-red-400" aria-label="Xóa ghi nhớ">🗑️</button>
              </div>
            ))}
            <h3 className="text-novel-text text-sm font-medium pt-2">Thiết lập thêm</h3>
            <textarea
              value={worldNote}
              onChange={(e) => setWorldNote(e.target.value)}
              placeholder="Tên nhân vật của bạn, bối cảnh, giọng văn..."
              rows={6}
              className="w-full rounded-lg bg-novel-bg/60 border border-novel-accent/20 p-2 text-xs text-novel-text"
            />
            <button onClick={() => confirm('Xóa toàn bộ cuộc trò chuyện?') && clear()} className="text-xs text-novel-muted hover:text-red-400">
              Xóa cuộc trò chuyện
            </button>
          </aside>
        )}
      </div>

      <div className="p-3 border-t border-novel-accent/20">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            maxLength={1000}
            rows={2}
            placeholder="Gõ hành động hoặc lời thoại... (Enter để gửi, Shift+Enter xuống dòng)"
            className="flex-1 rounded-xl bg-novel-panel/60 border border-novel-accent/30 p-3 text-novel-text resize-none"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="px-5 rounded-xl bg-novel-accent text-white disabled:opacity-40"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
