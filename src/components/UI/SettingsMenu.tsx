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