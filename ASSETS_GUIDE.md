# Asset Guide

## Directory Structure
```
public/assets/
├── manifest.json          # Auto-generated or manual
├── backgrounds/           # 1920x1080 WebP
│   ├── temple_exterior.webp
│   ├── temple_interior.webp
│   └── black.webp         # Required fallback
├── sprites/               # Transparent WebP, ~800px height
│   ├── elder_neutral.webp
│   ├── elder_smile.webp
│   └── protagonist_neutral.webp
└── audio/
    ├── bgm/               # OGG, loopable, ~1-3 min
    │   ├── peaceful.ogg
    │   └── tension.ogg
    └── sfx/               # OGG, short
        ├── click.ogg
        └── page_turn.ogg
```

## Manifest Format
```json
{
  "backgrounds": { "key": "assets/backgrounds/file.webp" },
  "sprites": { "key": "assets/sprites/file.webp" },
  "audio": {
    "bgm": { "key": "assets/audio/bgm/file.ogg" },
    "sfx": { "key": "assets/audio/sfx/file.ogg" }
  },
  "version": "1.0.0"
}
```

## Asset Sources (Free/CC0)
- **Backgrounds**: itch.io (search "free background"), OpenGameArt, Unsplash (edit to 1920x1080)
- **Sprites**: itch.io "free character sprites", OpenGameArt, Picrew (for personal use)
- **Audio**: Freesound.org, OpenGameArt, Incompetech (Kevin MacLeod)

## Naming Conventions
- Backgrounds: `{location}_{variant}.webp` (e.g., `temple_interior_night.webp`)
- Sprites: `{character}_{emotion}.webp` (e.g., `elder_serious.webp`)
- BGM: `{mood}.ogg` (e.g., `battle.ogg`)
- SFX: `{action}.ogg` (e.g., `magic_cast.ogg`)

## Optimization
- Use WebP for images (90% quality)
- Use OGG for audio (128kbps)
- Keep backgrounds < 500KB, sprites < 200KB
- Total assets target: < 50MB for fast loading