# Task 11: Polish & Bug Fixes

## Goal
Add scene transition overlay, help modal for keyboard shortcuts, verify production build, and fix any remaining issues.

## Files to Create/Modify
- `src/components/Scene/TransitionOverlay.tsx` - Scene transition effect
- `src/components/UI/HelpModal.tsx` - Keyboard shortcuts help
- Modify `src/components/Layout.tsx` - Add TransitionOverlay and HelpModal
- `public/robots.txt` - For deployment
- `public/sitemap.xml` - For deployment (optional)

## Dependencies
- All previous tasks

## Exact Implementation (from plan)

### TransitionOverlay.tsx
```tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '@/engine/StateManager';

export function TransitionOverlay() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const currentSceneId = useGameStore((s) => s.currentSceneId);

  useEffect(() => {
    // Show transition when scene changes
    setDirection('out');
    setVisible(true);
    const timer = setTimeout(() => {
      setDirection('in');
      const timer2 = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer2);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentSceneId]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-novel-bg transition-opacity duration-300 ${
        direction === 'in' ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
}
```

### HelpModal.tsx
```tsx
import { useState } from 'react';

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

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
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-md novel-panel rounded-2xl border border-novel-accent/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-novel-text">Phím tắt</h2>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-novel-bg/50 text-novel-muted">✕</button>
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
```

### Layout.tsx - Add TransitionOverlay and HelpModal
```tsx
import { TransitionOverlay } from '@/components/Scene/TransitionOverlay';
import { HelpModal } from '@/components/UI/HelpModal';

// In Layout component, add before closing div:
// <TransitionOverlay />
// <HelpModal />
```

### robots.txt
```
User-agent: *
Disallow: /
```

### sitemap.xml (optional, basic)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-domain.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## Global Constraints
- Transition overlay shows on scene change
- Help modal accessible via keyboard shortcut (?) or menu
- Production build verified
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run build` - should produce `dist/` successfully
3. Run `npm run preview` - should work at localhost:4173

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-11-report.md`