# Story Authoring Guide

## Scripted Nodes (JSON)

Each major story beat is a `.json` file in `src/data/story/nodes/`.

### Node Structure
```json
{
  "id": "unique_node_id",
  "type": "scripted|ai_bridge|ending",
  "title": "Display title",
  "sceneData": { ... },
  "content": { "paragraphs": [...] },
  "transitions": [...],
  "conditions": [...],
  "metadata": { "chapter": "...", "tags": [...] }
}
```

### SceneData
```json
{
  "background": "asset_key",
  "characters": [
    { "id": "elder", "sprite": "elder_serious", "position": "center" }
  ],
  "bgm": "peaceful",
  "transition": "fade"
}
```

### Paragraphs
```json
{
  "speaker": "Character Name" or null for narrator,
  "text": "Dialog or narrative text. Use \\n\\n for paragraph breaks.",
  "characterId": "elder",
  "expression": "elder_serious",
  "delay": 1000,
  "autoAdvance": false
}
```

### Transitions
```json
{
  "targetNodeId": "next_node_id",
  "choiceId": "choice_identifier",
  "type": "direct|ai_bridge",
  "conditions": [...]
}
```

### Conditions
```json
{
  "type": "flag|variable|relationship|inventory",
  "key": "variable_name",
  "operator": "eq|neq|gt|lt|gte|lte|contains",
  "value": true|"string"|123
}
```

## Hybrid Story Design

### Scripted Nodes (You Write)
- Major plot points
- Character introductions
- Key revelations
- Branch merges
- Endings

### AI Bridges (AI Generates)
- Transitions between scripted nodes
- Reactions to player free-form choices
- Minor conversations
- Exploration scenes

### Best Practices
1. **Keep scripted nodes focused** - One major beat per node
2. **Use ai_bridge for flexibility** - Let AI handle "what happens next" after choices
3. **Define clear conditions** - Use flags/variables to gate content
4. **Test branches** - Play through each path
5. **Track variables** - Document what each flag/variable means

## Adding New Nodes
1. Create `src/data/story/nodes/your_node_id.json`
2. Add to `src/data/story/nodes/index.json`
3. Reference in transitions from other nodes
4. Test in game

## Character Profiles
Edit `src/data/story/characters/index.json` to add/modify characters.
Sprites referenced must exist in `public/assets/sprites/`.

## World Lore
Edit `src/data/story/world/lore.json` for cultivation realms, sects, locations.