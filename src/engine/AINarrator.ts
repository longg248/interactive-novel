import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';
import type {
  GameState,
  AINarratorResponse,
  SceneData,
  Choice,
  Condition,
  StateChanges,
} from '@/types';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Default narration model. Google's deprecations page lists a shutdown date for
 * gemini-3.1-flash-lite (May 7, 2027) and newer flash models exist, so always
 * set VITE_GEMINI_MODEL explicitly and re-check
 * https://ai.google.dev/gemini-api/docs/deprecations before that date.
 */
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 3;

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** The model sometimes returns `conditions: {}` or a single object - always give back an array. */
function normalizeConditions(raw: unknown): Condition[] {
  if (Array.isArray(raw)) return raw.filter((c): c is Condition => !!c && typeof c === 'object' && 'key' in c);
  const rec = asRecord(raw);
  return 'type' in rec && 'key' in rec ? [rec as unknown as Condition] : [];
}

function normalizeChoices(raw: unknown): Choice[] {
  if (!Array.isArray(raw)) return [];
  const out: Choice[] = [];
  raw.forEach((item, idx) => {
    const c = asRecord(item);
    const text = typeof c.text === 'string' ? c.text.trim() : '';
    if (!text) return;
    out.push({
      id: typeof c.id === 'string' && c.id ? c.id : `ai_choice_${idx + 1}`,
      text,
      conditions: normalizeConditions(c.conditions),
    });
  });
  return out.slice(0, 4);
}

class AINarrator {
  private apiKey: string;
  private model: string;
  private abortController: AbortController | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.model = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL;
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set. AI Narrator will use the offline fallback.');
    }
  }

  async generateScene(
    gameState: GameState,
    sceneContext?: SceneData,
    playerInput?: string
  ): Promise<AINarratorResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse('Chưa cấu hình API key');
    }

    let lastError = 'Unknown error';
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const text = await this.request(buildUserPrompt(gameState, sceneContext, playerInput));
        return this.parseResponse(text);
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`AI Narrator attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error);
        const retryable =
          error instanceof HttpError
            ? error.status === 429 || error.status >= 500
            : !(error instanceof Error && error.name === 'AbortError'); // timeout/cancel: don't retry
        if (!retryable || attempt === MAX_ATTEMPTS) break;
        await sleep(800 * 2 ** (attempt - 1)); // 0.8s, 1.6s
      }
    }
    return this.getFallbackResponse(lastError);
  }

  private async request(userPrompt: string): Promise<string> {
    const controller = new AbortController();
    this.abortController = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${GEMINI_API_BASE}/${this.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Key in a header instead of the URL so it does not end up in logs/history.
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
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
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) throw new HttpError(429, 'RATE_LIMIT (429)');
        if (response.status === 404) {
          throw new HttpError(404, `Model "${this.model}" không tồn tại (404) - kiểm tra VITE_GEMINI_MODEL`);
        }
        throw new HttpError(response.status, `API error: ${response.status}`);
      }

      const data = (await response.json()) as GeminiResponse;
      if (data.promptFeedback?.blockReason) {
        throw new HttpError(400, `Bị chặn bởi bộ lọc: ${data.promptFeedback.blockReason}`);
      }
      // Skip "thought" parts (thinking models) and join the rest.
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text as string)
        .join('');
      if (!text) throw new Error('Empty response');
      return text;
    } finally {
      clearTimeout(timeoutId);
      if (this.abortController === controller) this.abortController = null;
    }
  }

  private parseResponse(text: string): AINarratorResponse {
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
    const braces = /\{[\s\S]*\}/.exec(text);
    const jsonText = fenced?.[1] ?? braces?.[0] ?? text;

    let parsed: Record<string, unknown>;
    try {
      parsed = asRecord(JSON.parse(jsonText));
    } catch (e) {
      console.error('Failed to parse AI response:', e, text);
      throw new Error('Parse error');
    }

    const narrative = typeof parsed.narrative === 'string' ? parsed.narrative.trim() : '';
    if (!narrative) throw new Error('Missing narrative');

    return {
      narrative,
      choices: normalizeChoices(parsed.choices),
      stateChanges: asRecord(parsed.stateChanges) as StateChanges,
      sceneData: asRecord(parsed.sceneData) as Partial<SceneData>,
      internalMonologue:
        typeof parsed.internalMonologue === 'string' ? parsed.internalMonologue : undefined,
    };
  }

  private getFallbackResponse(error?: string): AINarratorResponse {
    const base =
      'Gió rít qua khe cửa sổ cổ, mang theo mùi hương thảo dược nhẹ nhàng. Lão Tổ ngồi đối diện, ánh mắt sâu thẳm như biển lớn quan sát từng động tác của ngươi.';
    return {
      narrative: error ? `[Hệ thống: AI Narrator tạm thời không khả dụng (${error}).]\n\n${base}` : base,
      choices: [
        { id: 'wait', text: 'Đứng im lặng chờ Lão Tổ nói', conditions: [] },
        { id: 'ask', text: 'Hỏi: "Lão Tổ kêu ta đến có việc gì?"', conditions: [] },
        { id: 'bow', text: 'Cúi đầu hành lễ, không nói lời nào', conditions: [] },
      ],
      stateChanges: {},
      sceneData: {},
      isFallback: true,
      errorMessage: error,
    };
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}

export const aiNarrator = new AINarrator();
