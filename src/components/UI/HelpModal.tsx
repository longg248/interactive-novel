interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const shortcuts = [
    { key: 'Space / Enter / →', action: 'Tiếp tục / Chọn' },
    { key: 'S', action: 'Bỏ qua văn bản (Skip)' },
    { key: 'A', action: 'Bật/tắt Auto' },
    { key: 'H', action: 'Mở lịch sử' },
    { key: 'Esc', action: 'Đóng menu / Mở cài đặt' },
    { key: 'Ctrl+S', action: 'Lưu game nhanh' },
    { key: '1-4', action: 'Chọn lựa chọn nhanh' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 novel-bg/95 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-novel-text">Phím tắt</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
        </div>
        <dl className="space-y-3">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-novel-muted/10">
              <kbd className="px-2 py-1 bg-novel-bg/50 rounded border border-novel-muted/30 text-novel-text text-sm font-mono">{key}</kbd>
              <span className="text-novel-muted text-sm">{action}</span>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}