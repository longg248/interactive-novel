import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { aiNarrator } from './AINarrator';
import { OUTPUT_LENGTH_HINT, buildFreePrompt, type OutputLength } from './prompts';

export interface RPMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
}

const MAX_MESSAGES = 200;
const MAX_MEMORIES = 30;
const MAX_MEMORY_CHARS = 300;
const CONTEXT_MESSAGES = 12;
const MAX_INPUT_CHARS = 1000;

interface RoleplayState {
  messages: RPMessage[];
  memories: string[];
  worldNote: string;
  length: OutputLength;
  busy: boolean;
  lastFailedInput: string | null;

  submit: (raw: string) => Promise<void>;
  retry: () => Promise<void>;
  addMemory: (text: string) => void;
  removeMemory: (index: number) => void;
  setWorldNote: (text: string) => void;
  setLength: (l: OutputLength) => void;
  clear: () => void;
}

const uid = () => crypto.randomUUID();
const sys = (text: string): RPMessage => ({ id: uid(), role: 'system', text });

export const HELP_TEXT = [
  'Gõ hành động hoặc lời thoại bất kỳ rồi Enter.',
  '/nghi <tên> - xem suy nghĩ nội tâm của nhân vật',
  '/nho <nội dung> - ghim một thông tin AI phải luôn nhớ',
  '/quen <số> - bỏ ghi nhớ số đó',
  '/ngan, /vua, /dai - chỉnh độ dài câu trả lời',
  '/xoa - xóa toàn bộ cuộc trò chuyện (giữ ghi nhớ)',
].join('\n');

export const useRoleplayStore = create<RoleplayState>()(
  persist(
    (set, get) => {
      const push = (m: RPMessage) =>
        set((s) => ({ messages: [...s.messages, m].slice(-MAX_MESSAGES) }));

      const generate = async (input: string, display: string | null) => {
        const s = get();
        const history = s.messages
          .filter((m): m is RPMessage & { role: 'user' | 'ai' } => m.role !== 'system')
          .slice(-CONTEXT_MESSAGES)
          .map((m) => ({ role: m.role, text: m.text }));
        set({ busy: true, lastFailedInput: null });
        if (display !== null) push({ id: uid(), role: 'user', text: display });
        try {
          const text = await aiNarrator.generateFree(
            buildFreePrompt({
              history,
              memories: s.memories,
              worldNote: s.worldNote,
              length: s.length,
              input,
            }),
            OUTPUT_LENGTH_HINT[s.length].maxTokens
          );
          push({ id: uid(), role: 'ai', text });
        } catch (e) {
          push(sys(`Lỗi: ${e instanceof Error ? e.message : String(e)}. Bấm "Thử lại".`));
          set({ lastFailedInput: input });
        } finally {
          set({ busy: false });
        }
      };

      return {
        messages: [],
        memories: [],
        worldNote: '',
        length: 'medium',
        busy: false,
        lastFailedInput: null,

        submit: async (raw) => {
          const text = raw.trim().slice(0, MAX_INPUT_CHARS);
          if (!text || get().busy) return;

          if (text.startsWith('/')) {
            const [cmd, ...rest] = text.slice(1).split(/\s+/);
            const arg = rest.join(' ').trim();
            switch (cmd.toLowerCase()) {
              case 'nghi':
                if (!arg) return push(sys('Dùng: /nghi <tên nhân vật>'));
                return generate(
                  `(OOC) Hãy viết suy nghĩ nội tâm hiện tại của ${arg}, dựa trên diễn biến vừa qua.`,
                  `/nghi ${arg}`
                );
              case 'nho':
                if (!arg) return push(sys('Dùng: /nho <nội dung>'));
                get().addMemory(arg);
                return;
              case 'quen': {
                const n = Number(arg);
                if (!Number.isInteger(n) || n < 1 || n > get().memories.length) {
                  return push(sys('Dùng: /quen <số thứ tự ghi nhớ>'));
                }
                get().removeMemory(n - 1);
                return;
              }
              case 'ngan':
              case 'vua':
              case 'dai': {
                const l = ({ ngan: 'short', vua: 'medium', dai: 'long' } as const)[
                  cmd.toLowerCase() as 'ngan' | 'vua' | 'dai'
                ];
                set({ length: l });
                return push(sys(`Độ dài: ${OUTPUT_LENGTH_HINT[l].text}`));
              }
              case 'xoa':
                return get().clear();
              default:
                return push(sys(`Không có lệnh /${cmd}.\n${HELP_TEXT}`));
            }
          }

          await generate(text, text);
        },

        retry: async () => {
          const input = get().lastFailedInput;
          if (input && !get().busy) await generate(input, null);
        },

        addMemory: (text) => {
          const t = text.trim().slice(0, MAX_MEMORY_CHARS);
          if (!t) return;
          if (get().memories.length >= MAX_MEMORIES) {
            push(sys(`Tối đa ${MAX_MEMORIES} ghi nhớ. Hãy /quen bớt.`));
            return;
          }
          set((s) => ({ memories: [...s.memories, t] }));
          push(sys(`Đã ghi nhớ #${get().memories.length}: ${t}`));
        },
        removeMemory: (i) => set((s) => ({ memories: s.memories.filter((_, idx) => idx !== i) })),
        setWorldNote: (text) => set({ worldNote: text.slice(0, 1500) }),
        setLength: (length) => set({ length }),
        clear: () => set({ messages: [], lastFailedInput: null }),
      };
    },
    {
      name: 'novel-roleplay-store',
      partialize: (s) => ({
        messages: s.messages,
        memories: s.memories,
        worldNote: s.worldNote,
        length: s.length,
      }),
    }
  )
);
