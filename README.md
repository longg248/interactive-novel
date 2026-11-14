# Interactive Visual Novel

Personal-use Visual Novel engine with AI Narrator (Gemini 1.5 Flash) for deep branching stories.

## Features
- Visual Novel UI: backgrounds, character sprites, textbox, choices
- Hybrid story: scripted nodes + AI improvisation
- Deep branching with variables, flags, relationships, inventory
- Save/Load system (10 slots + export/import JSON)
- AI Narrator via Gemini 1.5 Flash API
- Auto-save, history log, stats panel
- Keyboard shortcuts, settings, accessibility

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file and add your Gemini API key
cp .env.example .env
# Edit .env: VITE_GEMINI_API_KEY=your_key_here

# Start dev server
npm run dev

# Build for production
npm run build
npm run preview
```

## Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create API key
3. Add to `.env`

## Project Structure
```
src/
├── components/     # React UI components
├── engine/         # Core game logic (StateManager, SceneManager, AINarrator, StoryScript, AssetLoader)
├── hooks/          # React hooks
├── types/          # TypeScript types
├── data/story/     # Story content (JSON)
└── styles/         # Global CSS
public/assets/      # Game assets (backgrounds, sprites, audio)
```

## Adding Assets
See [ASSETS_GUIDE.md](ASSETS_GUIDE.md)

## Writing Story Content
See [STORY_AUTHORING.md](STORY_AUTHORING.md)

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space / Enter / → | Continue / next paragraph |
| Click vào khung chữ | Continue (mouse support) |
| S | Skip typing - hiện nguyên đoạn |
| A | Bật/tắt Auto |
| 1-9 | Chọn lựa chọn nhanh |
| H | Mở lịch sử |
| ? | Mở bảng phím tắt |
| Esc | Đóng menu |
| Ctrl+S | Mở Save/Load |

## Story Content

Các node truyện nằm trong `public/data/story/nodes/`. Mỗi node là một file JSON,
được liệt kê trong `public/data/story/nodes/index.json`.

Kiểm tra tính toàn vẹn của đồ thị truyện (node tồn tại, transition hợp lệ, không có
node mồ côi / không tới được):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-story.ps1
```

Xem [STORY_AUTHORING.md](STORY_AUTHORING.md) để biết cấu trúc node, condition và
cách viết choice.

## Hình ảnh & âm thanh

Game **chạy được ngay** với story hiện có, nhưng chưa có artwork. Thêm file vào
`public/assets/` theo tên trong `public/assets/manifest.json`:

| Loại | Đường dẫn | Kích thước gợi ý |
|------|-----------|-----------------|
| Background | `public/assets/backgrounds/*.webp` | 1920x1080 |
| Sprite | `public/assets/sprites/*.webp` | cao ~800px, nền trong suốt |
| BGM | `public/assets/audio/bgm/*.ogg` | loopable 1-3 phút |
| SFX | `public/assets/audio/sfx/*.ogg` | ngắn |

Thêm key mới vào `public/assets/manifest.json` rồi trỏ tới từ node truyện.
Xem [ASSETS_GUIDE.md](ASSETS_GUIDE.md) để biết nguồn asset miễn phí.


## Deployment
Deploy `dist/` folder to Vercel, Netlify, or GitHub Pages.

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

## License
Personal use only.