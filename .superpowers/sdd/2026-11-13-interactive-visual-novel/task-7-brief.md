# Task 7: Story Script Engine (Scripted Nodes)

## Goal
Implement story script engine for loading/navigating scripted story nodes, plus example story data (nodes, characters, world lore).

## Files to Create
- `src/engine/StoryScript.ts` - Story node loading and navigation
- `src/data/story/nodes/index.json` - Node index
- `src/data/story/nodes/prologue_01.json` - Example scripted node
- `src/data/story/characters/index.json` - Character profiles
- `src/data/story/world/lore.json` - World lore data

## Dependencies
- Types from Task 2 (`src/types/index.ts`)

## Exact Implementation (from plan)

### StoryScript.ts
```typescript
import type { StoryNode, ScriptedParagraph, Choice, SceneData, GameState, NodeTransition } from '@/types';

class StoryScript {
  private nodes: Map<string, StoryNode> = new Map();
  private currentNodeId: string | null = null;
  private loaded = false;

  async loadAllNodes(): Promise<void> {
    if (this.loaded) return;

    try {
      const indexResponse = await fetch('/data/story/nodes/index.json');
      const index: string[] = await indexResponse.json();

      await Promise.all(
        index.map(async (nodeId) => {
          const response = await fetch(`/data/story/nodes/${nodeId}.json`);
          if (response.ok) {
            const node: StoryNode = await response.json();
            this.nodes.set(nodeId, node);
          }
        })
      );

      this.loaded = true;
      console.log(`Loaded ${this.nodes.size} story nodes`);
    } catch (error) {
      console.error('Failed to load story nodes:', error);
    }
  }

  getNode(nodeId: string): StoryNode | undefined {
    return this.nodes.get(nodeId);
  }

  getCurrentNode(): StoryNode | undefined {
    return this.currentNodeId ? this.nodes.get(this.currentNodeId) : undefined;
  }

  setCurrentNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.currentNodeId = nodeId;
      return true;
    }
    return false;
  }

  getAvailableTransitions(gameState: GameState): Array<{ node: StoryNode; transition: NodeTransition }> {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return [];

    return currentNode.transitions
      .map(t => {
        const targetNode = this.nodes.get(t.targetNodeId);
        return targetNode ? { node: targetNode, transition: t } : null;
      })
      .filter((t): t is { node: StoryNode; transition: NodeTransition } =>
        t !== null && this.evaluateConditions(t.transition.conditions, gameState)
      );
  }

  private evaluateConditions(conditions: NodeTransition['conditions'], gameState: GameState): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => {
      let value: unknown;
      switch (c.type) {
        case 'flag': value = gameState.flags[c.key]; break;
        case 'variable': value = gameState.variables[c.key]; break;
        case 'relationship': value = gameState.relationships[c.key]; break;
        case 'inventory': value = gameState.inventory.some(i => i.id === c.key); break;
        default: return false;
      }
      return this.compareValues(value, c.operator, c.value);
    });
  }

  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'neq': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'contains': return String(actual).includes(String(expected));
      default: return false;
    }
  }

  getChoicesFromNode(node: StoryNode): Choice[] {
    return node.transitions.map((t, i) => ({
      id: t.choiceId,
      text: this.getChoiceText(t.choiceId, node),
      conditions: t.conditions,
    }));
  }

  private getChoiceText(choiceId: string, node: StoryNode): string {
    const choiceTexts: Record<string, string> = {
      'introduce_self': 'Giới thiệu bản thân: "Tên tôi là..."',
      'ask_question': 'Hỏi: "Lão Tổ là ai? Tại sao lão ở đây?"',
      'stay_silent': 'Cúi đầu im lặng, chờ lệnh',
      'accept': 'Đồng ý nhập môn',
      'refuse': 'Từ chối, muốn về làng',
      'explore': 'Khám phá xung quanh',
      'train': 'Bắt đầu tu luyện ngay',
      'talk_lan': 'Tìm Tiểu Lan nói chuyện',
      'train_sword': 'Tập kiếm thuật',
      'meditate': 'Tĩnh tọa tu luyện',
    };
    return choiceTexts[choiceId] || choiceId;
  }

  getParagraphs(node: StoryNode): ScriptedParagraph[] {
    return node.content.paragraphs;
  }

  getSceneData(node: StoryNode): SceneData {
    return node.sceneData;
  }

  isAIBridge(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    return node?.type === 'ai_bridge';
  }

  getAllNodes(): StoryNode[] {
    return Array.from(this.nodes.values());
  }
}

export const storyScript = new StoryScript();
```

### prologue_01.json
```json
{
  "id": "prologue_01",
  "type": "scripted",
  "title": "Chương 1: Nhập Môn",
  "sceneData": {
    "background": "temple_exterior",
    "characters": [
      { "id": "elder", "sprite": "elder_neutral", "position": "center" }
    ],
    "bgm": "peaceful",
    "transition": "fade"
  },
  "content": {
    "paragraphs": [
      {
        "speaker": null,
        "text": "Thanh Vân Sơn sương mù bao phủ, những ngọn thông già vươn cao chạm mây. Không khí trong lành, mát lạnh, mang theo mùi hương thông và đất ẩm.",
        "delay": 1000
      },
      {
        "speaker": null,
        "text": "Ngươi đứng trước cổng núi Thanh Vân Tông, trái tim đập nhanh. Hôm nay là ngày Đại Bàn - lễ hội tuyển đệ tử hàng năm. Ngươi - một phàm nhân từ villages dưới chân núi - đã vượt qua bao thử thách để đến đây.",
        "delay": 1500
      },
      {
        "speaker": "Lão Tổ Thanh Vân",
        "text": "Hmm... Một thân Phàm Cốt, lại mang Thiên Linh Căn. Thật là hiếm gặp.",
        "characterId": "elder",
        "expression": "elder_serious",
        "delay": 500
      },
      {
        "speaker": "Lão Tổ Thanh Vân",
        "text": "Lão phu là Lão Tổ Thanh Vân, trưởng lão ngoại môn. Ngươi tên là gì? Và ngươi đến đây để làm gì?",
        "characterId": "elder",
        "expression": "elder_neutral"
      }
    ]
  },
  "transitions": [
    {
      "targetNodeId": "prologue_02_intro",
      "choiceId": "introduce_self",
      "type": "direct"
    },
    {
      "targetNodeId": "ai_bridge_elder_reaction",
      "choiceId": "ask_question",
      "type": "ai_bridge"
    },
    {
      "targetNodeId": "prologue_02_silent",
      "choiceId": "stay_silent",
      "type": "direct"
    }
  ],
  "conditions": [],
  "metadata": {
    "chapter": "Chương 1: Nhập Môn",
    "estimatedDuration": 5,
    "tags": ["prologue", "elder", "introduction"]
  }
}
```

### characters/index.json
```json
{
  "elder": {
    "id": "elder",
    "name": "Lão Tổ Thanh Vân",
    "title": "Trưởng lão ngoại môn Thanh Vân Tông",
    "cultivation": "Hóa Thần sơ kỳ",
    "personality": "Nghiêm khắc, công chính, thương yêu đệ tử nhưng không biểu hiện ra ngoài. Nói chuyện chậm rãi, dùng 'lão phu', văn phong trang trọng.",
    "sprites": {
      "neutral": "elder_neutral",
      "smile": "elder_smile",
      "serious": "elder_serious",
      "angry": "elder_angry",
      "surprised": "elder_surprised"
    },
    "voice": "low_male"
  },
  "lan": {
    "id": "lan",
    "name": "Tiểu Lan",
    "title": "Đệ tử nội môn, Trúc Cơ trung kỳ",
    "personality": "Hoạt bát, ham chơi, thích trêu chọc sư huynh/sư tỷ. Nói nhanh, dùng từ lóng, emoji. Thích ăn ngon.",
    "sprites": {
      "neutral": "lan_neutral",
      "happy": "lan_happy",
      "pout": "lan_pout",
      "excited": "lan_excited",
      "shy": "lan_shy"
    },
    "voice": "high_female"
  },
  "huyet_y": {
    "id": "huyet_y",
    "name": "Huyết Y",
    "title": "Đệ tử Huyết Ma Tông, Kim Đan sơ kỳ",
    "personality": "Cao ngạo, khinh thường chính đạo, tuân thủ quy tắc ma đạo riêng. Nói ít, hành động quyết đoán.",
    "sprites": {
      "neutral": "huyet_y_neutral",
      "smirk": "huyet_y_smock",
      "cold": "huyet_y_cold",
      "battle": "huyet_y_battle"
    },
    "voice": "mid_male"
  }
}
```

### world/lore.json
```json
{
  "worldName": "Thanh Vân Cửu Trọng",
  "cultivationRealms": [
    { "id": "lianqi", "name": "Luyện Khí", "stages": 9, "description": "Hấp thu linh khí, rèn luyện thân thể" },
    { "id": "zhuzhi", "name": "Trúc Cơ", "stages": 9, "description": "Kết tinh linh cơ, nền tảng đại đạo" },
    { "id": "jindan", "name": "Kim Đan", "stages": 9, "description": "Kết đan trong cơ thể, bắt đầu bất tử" },
    { "id": "yuanying", "name": "Nguyên Anh", "stages": 9, "description": "Nhân anh thoát xác, thần thức hóa hình" },
    { "id": "huashen", "name": "Hóa Thần", "stages": 9, "description": "Thần hồn hợp nhất, cảm ứng thiên địa" },
    { "id": "lianxu", "name": "Luyện Hư", "stages": 9, "description": "Rèn hư nhập vi, chạm đến pháp tắc" },
    { "id": "dacheng", "name": "Đại Thừa", "stages": 9, "description": "Đại đạo thành tựu, chuẩn bị độ kiếp" },
    { "id": "dongji", "name": "Động Tịch", "stages": 9, "description": "Mở động phủ, tạo thế giới nhỏ" },
    { "id": "shengxian", "name": "Thăng Tiên", "stages": 1, "description": "Bay thăng Tiên Giới, vĩnh hằng bất diệt" }
  ],
  "sects": [
    {
      "id": "thanh_van",
      "name": "Thanh Vân Tông",
      "alignment": "Chính đạo",
      "specialty": "Kiếm thuật, Phong Lôi pháp, Trận pháp",
      "location": "Thanh Vân Sơn",
      "reputation": "Uy danh cao, giáo dục đệ tử nghiêm ngặt"
    },
    {
      "id": "huyet_ma",
      "name": "Huyết Ma Tông",
      "alignment": "Ma đạo",
      "specialty": "Huyết pháp, Độc thuật, Tàn khốc",
      "location": "Ma Uyên",
      "reputation": "Tàn bạo, quyền lực là trên hết"
    },
    {
      "id": "wuji",
      "name": "Vô Cực Các",
      "alignment": "Trung lập",
      "specialty": "Thương mại, Trí mạng, Kiếm thuật tự do",
      "location": "Vô Cực Hải",
      "reputation": "Tự do, thực dụng, giàu có"
    }
  ],
  "locations": [
    { "id": "thanh_van_mountain", "name": "Thanh Vân Sơn", "type": "Sect", "description": "Chốn tu tiên chính đạo, sương mù năm tháng" },
    { "id": "ma_uyen", "name": "Ma Uyên", "type": "Sect", "description": "Lộng lẫy huyết sắc, tiếng kêu rên ngày đêm" },
    { "id": "mortal_village", "name": "Phàm Giới", "type": "Village", "description": "Những ngôi làng phàm nhân dưới chân núi" }
  ]
}
```

### index.json
```json
[
  "prologue_01",
  "prologue_02_intro",
  "prologue_02_silent",
  "ai_bridge_elder_reaction",
  "chapter1_01_sect_tour",
  "chapter1_02_meet_lan",
  "chapter1_03_cultivation_basics",
  "chapter1_ending_choice"
]
```

## Global Constraints
- Story nodes loaded from JSON files in `public/data/story/nodes/`
- Character profiles and world lore in `public/data/story/`
- Hybrid: scripted nodes + AI bridges
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-7-report.md`