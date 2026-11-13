# Task 6: AI Narrator Service (Gemini API)

## Goal
Implement AI Narrator service using Gemini 1.5 Flash API with structured JSON output, system prompt for world lore, and React Query hook for API calls.

## Files to Create
- `src/engine/prompts.ts` - System prompt template and user prompt builder
- `src/engine/AINarrator.ts` - Gemini API service class
- `src/hooks/useAINarrator.ts` - React Query hook for AI generation

## Dependencies
- Types from Task 2 (`src/types/index.ts`)
- StateManager from Task 3 (`src/engine/StateManager.ts`)
- `@tanstack/react-query` for caching/retry

## Exact Implementation (from plan)

### prompts.ts
```typescript
export const SYSTEM_PROMPT = `Bạn là Narrator của một Visual Novel fantasy Việt Nam. Hãy kể chuyện theo phong cách văn học, giàu cảm xúc, mô tả cảnh sống động.

=== THẾ GIỚI (WORLD LORE) ===
- Tên thế giới: Thanh Vân Cửu Trọng (Nine Heavens of Green Clouds)
- Hệ pháp lực: Tu chân (Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh → Hóa Thần → Luyện Hư → Đại Thừa → Động Tịch → Thăng Tiên)
- Môn phái chính: Thanh Vân Tông (chính đạo), Huyết Ma Tông (ma đạo), Vô Cực Các (trung lập)
- Địa điểm quan trọng: Thanh Vân Sơn, Ma Uyên, Tiên Môn, Phàm Giới

=== NHÂN VẬT CHÍNH ===
1. **Nhân chính (Player)**: Tên do player đặt, có thể là nam/nữ. Bẩm sinh "Thiên Linh Căn" (tài chất tu tiên hiếm gặp). Tính cách: player quyết định qua choices.
2. **Lão Tổ Thanh Vân (Elder)**: Trưởng lão Thanh Vân Tông, tu vị Hóa Thần sơ kỳ. Tính cách: nghiêm khắc nhưng thương yêu đệ tử, nói chuyện chậm rãi, dùng "lão phu" tự xưng.
3. **Tiểu Lan (Junior Sister)**: Đệ tử cùng môn, Trúc Cơ trung kỳ. Tính cách: hoạt bát, ham chơi, gọi player là "Sư huynh/Sư tỷ", dùng emoji trong dialog.
4. **Huyết Y (Rival)**: Đệ tử Huyết Ma Tông, Kim Đan sơ kỳ. Tính cách: cao ngạo, khinh thường chính đạo, nhưng có luật lệ riêng.

=== QUY TẮC KỆ CHUYỆN ===
- Không break character. Luôn nói chuyện như narrator/nhân vật.
- Mô tả cảnh: 3-5 câu, tập trung vào giác quan (thấy, nghe, ngửi, cảm giác).
- Dialog: tự nhiên, phù hợp nhân vật. Elder dùng văn ngôn, Tiểu Lan dùng tiếng lóng.
- Choice: Tối đa 4 lựa chọn, mỗi cái dẫn hướng khác nhau (khám phá, chiến đấu, giao tiếp, suy nghĩ).
- State changes: Chỉ thay đổi khi hợp lý (relationship ±5-15, flags khi trigger event quan trọng).

=== ĐỊNH DẠNG TRẢ VỀ (BẮT BUỘC JSON) ===
{
  "narrative": "Mô tả cảnh + dialog NPC (có thể nhiều đoạn, cách nhau bằng \\n\\n)",
  "choices": [
    { "id": "c1", "text": "Lựa chọn 1", "conditions": {} },
    { "id": "c2", "text": "Lựa chọn 2", "conditions": { "type": "flag", "key": "met_elder", "operator": "eq", "value": true } }
  ],
  "stateChanges": {
    "variables": { "cultivation_exp": 10 },
    "flags": { "first_meeting": true },
    "relationships": { "elder": 5, "lan": -2 }
  },
  "sceneData": {
    "background": "temple_interior",
    "characters": [
      { "id": "elder", "sprite": "elder_serious", "position": "center" }
    ]
  }
}`;

export function buildUserPrompt(gameState: any, sceneContext?: any, playerInput?: string): string {
  return `
=== TRẠNG THÁI HIỆN TẠI ===
Chương: ${gameState.chapter}
Scene: ${gameState.currentSceneId}
Playtime: ${Math.floor(gameState.playtime / 60)} phút

Biến số: ${JSON.stringify(gameState.variables)}
Flags: ${JSON.stringify(gameState.flags)}
Mối quan hệ: ${JSON.stringify(gameState.relationships)}
Túi đồ: ${JSON.stringify(gameState.inventory.map((i: any) => `${i.name} x${i.quantity}`))}

=== LỊCH SỬ GẦN ĐÂY (5 entry cuối) ===
${gameState.history.slice(-5).map((h: any) => `${h.speaker || 'Narrator'}: ${h.text}`).join('\n')}

=== SCENE HIỆN TẠI ===
${sceneContext ? JSON.stringify(sceneContext) : 'Không có'}

${playerInput ? `=== HÀNH ĐỘNG NGƯỜI CHƠI ===
${playerInput}` : ''}

=== YÊU CẦU ===
${playerInput ? 'Tiếp tục câu chuyện dựa trên hành động người chơi.' : 'Bắt đầu scene mới hoặc tiếp tục từ điểm dừng.'}
Hãy trả về JSON theo đúng format đã quy định.
`.trim();
}
```

### AINarrator.ts
```typescript
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import type { GameState, AINarratorResponse, SceneData } from '@/types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

class AINarrator {
  private apiKey: string;
  private abortController: AbortController | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set. AI Narrator will not work.');
    }
  }

  async generateScene(
    gameState: GameState,
    sceneContext?: SceneData,
    playerInput?: string
  ): Promise<AINarratorResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse();
    }

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), 30000);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Hiểu rồi. Tôi sẽ trả về JSON theo format yêu cầu.' }] },
            { role: 'user', parts: [{ text: buildUserPrompt(gameState, sceneContext, playerInput) }] },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) throw new Error('RATE_LIMIT');
        throw new Error(`API error: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error('Empty response');

      return this.parseResponse(text);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('AI Narrator error:', error);
      return this.getFallbackResponse(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private parseResponse(text: string): AINarratorResponse {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      const parsed = JSON.parse(jsonText);

      return {
        narrative: parsed.narrative || '...',
        choices: Array.isArray(parsed.choices) ? parsed.choices : [],
        stateChanges: parsed.stateChanges || {},
        sceneData: parsed.sceneData || {},
        internalMonologue: parsed.internalMonologue,
      };
    } catch (e) {
      console.error('Failed to parse AI response:', e, text);
      return this.getFallbackResponse('Parse error');
    }
  }

  private getFallbackResponse(error?: string): AINarratorResponse {
    return {
      narrative: error
        ? `[Hệ thống: AI Narrator tạm thời không khả dụng (${error}). Vui lòng thử lại sau.]
        \n\nGió rít qua khe cửa sổ cổ, mang theo mùi hương thảo dược nhẹ nhàng. Lão Tổ ngồi đối diện, ánh mắt sâu thẳm như biển lớn quan sát từng động tác của ngươi.`
        : 'Gió rít qua khe cửa sổ cổ, mang theo mùi hương thảo dược nhẹ nhàng. Lão Tổ ngồi đối diện, ánh mắt sâu thẳm như biển lớn quan sát từng động tác của ngươi.',
      choices: [
        { id: 'wait', text: 'Đứng im lặng chờ Lão Tổ nói', conditions: [] },
        { id: 'ask', text: 'Hỏi: "Lão Tổ kêu ta đến có việc gì?"', conditions: [] },
        { id: 'bow', text: 'Cúi đầu hành lễ, không nói lời nào', conditions: [] },
      ],
      stateChanges: {},
      sceneData: {},
    };
  }

  cancel(): void {
    this.abortController?.abort();
  }
}

export const aiNarrator = new AINarrator();
```

### useAINarrator.ts
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiNarrator } from '@/engine/AINarrator';
import { useGameStore } from '@/engine/StateManager';
import type { GameState, SceneData, AINarratorResponse, Choice } from '@/types';

export function useAINarrator() {
  const queryClient = useQueryClient();
  const gameState = useGameStore((s) => ({
    variables: s.variables,
    flags: s.flags,
    relationships: s.relationships,
    inventory: s.inventory,
    currentSceneId: s.currentSceneId,
    history: s.history,
    playtime: s.playtime,
    chapter: s.chapter,
  }));
  const applyStateChanges = useGameStore((s) => ({
    setVariable: s.setVariable,
    setFlag: s.setFlag,
    changeRelationship: s.changeRelationship,
    addItem: s.addItem,
    removeItem: s.removeItem,
  }));
  const setScene = useGameStore((s) => s.setScene);
  const addHistory = useGameStore((s) => s.addHistory);
  const setChapter = useGameStore((s) => s.setChapter);

  const generateSceneMutation = useMutation({
    mutationFn: async ({ sceneContext, playerInput }: { sceneContext?: SceneData; playerInput?: string }) => {
      return aiNarrator.generateScene(gameState, sceneContext, playerInput);
    },
    onSuccess: (response) => {
      if (response.stateChanges.variables) {
        Object.entries(response.stateChanges.variables).forEach(([key, value]) => {
          applyStateChanges.setVariable(key, value);
        });
      }
      if (response.stateChanges.flags) {
        Object.entries(response.stateChanges.flags).forEach(([key, value]) => {
          applyStateChanges.setFlag(key, value);
        });
      }
      if (response.stateChanges.relationships) {
        Object.entries(response.stateChanges.relationships).forEach(([charId, delta]) => {
          applyStateChanges.changeRelationship(charId, delta);
        });
      }
      if (response.stateChanges.inventoryAdd) {
        response.stateChanges.inventoryAdd.forEach(item => applyStateChanges.addItem(item));
      }
      if (response.stateChanges.inventoryRemove) {
        response.stateChanges.inventoryRemove.forEach(id => applyStateChanges.removeItem(id));
      }

      addHistory({
        sceneId: gameState.currentSceneId || '',
        speaker: null,
        text: response.narrative,
        type: 'narrative',
      });

      if (response.sceneData.background || response.sceneData.characters?.length) {
        const currentScene = useGameStore.getState().currentSceneData;
        const newSceneData: SceneData = {
          background: response.sceneData.background || currentScene?.background || 'black',
          characters: response.sceneData.characters || currentScene?.characters || [],
          bgm: response.sceneData.bgm || currentScene?.bgm,
          transition: response.sceneData.transition || 'fade',
        };
        setScene(gameState.currentSceneId || 'ai_generated', newSceneData);
      }
    },
    onError: (error) => {
      console.error('AI Narrator mutation failed:', error);
    },
  });

  const generateScene = (sceneContext?: SceneData, playerInput?: string) => {
    return generateSceneMutation.mutateAsync({ sceneContext, playerInput });
  };

  const cancel = () => {
    aiNarrator.cancel();
    generateSceneMutation.reset();
  };

  return {
    generateScene,
    cancel,
    isLoading: generateSceneMutation.isPending,
    error: generateSceneMutation.error,
    lastResponse: generateSceneMutation.data,
  };
}
```

## Global Constraints
- Free tier: Gemini 1.5 Flash (1,500 req/day, 1M token context)
- API key in `.env` as `VITE_GEMINI_API_KEY`
- Structured JSON output with `responseMimeType: 'application/json'`
- Fallback response when API unavailable
- Exponential backoff via React Query retry (default 3 retries)
- TypeScript strict mode

## Verification
1. Run `npx tsc --noEmit` - should pass
2. Run `npm run dev` - should start without errors
3. (Manual) Test with valid API key - AI generates narrative

## Report File
Write report to: `.superpowers/sdd/2026-11-13-interactive-visual-novel/task-6-report.md`