import { useState } from 'react';
import { useGameStore } from '@/engine/StateManager';
import type { SaveSlot } from '@/types';

interface SaveLoadMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SaveLoadMenu({ isOpen, onClose }: SaveLoadMenuProps) {
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
    onClose();
  };

  const handleLoad = (slotId: number) => {
    if (loadGame(slotId)) {
      onClose();
    }
  };

  const handleDelete = (slotId: number) => {
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
      <div className="absolute inset-0" onClick={onClose} />
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
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">
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
                      <button onClick={() => handleExport(slotId)} className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-novel-text" title="Xuất file">
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
                      <button onClick={() => handleDelete(slotId)} className="px-3 py-2 rounded-lg text-sm text-novel-muted hover:text-red-400" title="Xóa">
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