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