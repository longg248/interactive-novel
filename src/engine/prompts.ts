import type { GameState, SceneData } from '@/types';

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
    { "id": "c1", "text": "Lựa chọn 1", "conditions": [] },
    { "id": "c2", "text": "Lựa chọn 2", "conditions": [{ "type": "flag", "key": "met_elder", "operator": "eq", "value": true }] }
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

export function buildUserPrompt(
  gameState: GameState,
  sceneContext?: SceneData,
  playerInput?: string
): string {
  const inventory = gameState.inventory.map((i) => `${i.name} x${i.quantity}`);
  const recent = gameState.history
    .slice(-5)
    .map((h) => `${h.speaker ?? 'Narrator'}: ${h.text}`)
    .join('\n');

  return `
=== TRẠNG THÁI HIỆN TẠI ===
Chương: ${gameState.chapter}
Scene: ${gameState.currentSceneId ?? 'chưa có'}
Playtime: ${Math.floor(gameState.playtime / 60)} phút

Biến số: ${JSON.stringify(gameState.variables)}
Flags: ${JSON.stringify(gameState.flags)}
Mối quan hệ: ${JSON.stringify(gameState.relationships)}
Túi đồ: ${JSON.stringify(inventory)}

=== LỊCH SỬ GẦN ĐÂY (5 entry cuối) ===
${recent}

=== SCENE HIỆN TẠI ===
${sceneContext ? JSON.stringify(sceneContext) : 'Không có'}

${playerInput ? `=== HÀNH ĐỘNG NGƯỜI CHƠI ===
${playerInput}` : ''}

=== YÊU CẦU ===
${playerInput ? 'Tiếp tục câu chuyện dựa trên hành động người chơi.' : 'Bắt đầu scene mới hoặc tiếp tục từ điểm dừng.'}
Hãy trả về JSON theo đúng format đã quy định.
`.trim();
}


// ---------------------------------------------------------------------------
// Free roleplay mode (player types any action; no scripted choices)
// ---------------------------------------------------------------------------

export type OutputLength = 'short' | 'medium' | 'long';

export const OUTPUT_LENGTH_HINT: Record<OutputLength, { text: string; maxTokens: number }> = {
  short: { text: '2-3 câu', maxTokens: 1024 },
  medium: { text: '1-2 đoạn ngắn (khoảng 5-8 câu)', maxTokens: 2048 },
  long: { text: '3-4 đoạn (khoảng 10-14 câu)', maxTokens: 4096 },
};

export const FREE_SYSTEM_PROMPT = `Bạn là người dẫn truyện (game master) cho một trò nhập vai văn bản tiếng Việt, thể loại tiên hiệp / tu chân, bối cảnh Thanh Vân Cửu Trọng.

QUY TẮC:
- Người chơi gõ hành động hoặc lời thoại tự do; bạn kể tiếp diễn biến và phản ứng của thế giới, NPC. KHÔNG quyết định hành động hay lời nói thay người chơi.
- Giữ nhất quán với phần "GHI NHỚ" và "LỊCH SỬ GẦN ĐÂY". Không mâu thuẫn với những gì đã xảy ra.
- Văn phong văn học, giàu giác quan. Lão Tổ xưng "lão phu"; Tiểu Lan hoạt bát, hay dùng tiếng lóng.
- Tôn trọng độ dài yêu cầu.
- Nếu người chơi yêu cầu xem suy nghĩ nội tâm của một nhân vật, hãy viết đoạn độc thoại nội tâm của nhân vật đó (không thay đổi cốt truyện).
- Các dòng bắt đầu bằng "(OOC)" là chỉ dẫn ngoài truyện của người chơi: làm theo, không coi là hành động trong truyện.

ĐỊNH DẠNG TRẢ VỀ (BẮT BUỘC JSON, không thêm gì khác):
{ "narrative": "nội dung kể tiếp, các đoạn cách nhau bằng \\n\\n" }`;

export function buildFreePrompt(args: {
  history: Array<{ role: 'user' | 'ai'; text: string }>;
  memories: string[];
  worldNote: string;
  length: OutputLength;
  input: string;
}): string {
  const mem = args.memories.length
    ? args.memories.map((m, i) => `${i + 1}. ${m}`).join('\n')
    : '(chưa có)';
  const hist = args.history.length
    ? args.history.map((m) => `${m.role === 'user' ? 'NGƯỜI CHƠI' : 'DẪN TRUYỆN'}: ${m.text}`).join('\n')
    : '(chưa có - đây là lượt mở đầu)';
  return `
=== GHI NHỚ (người chơi đã ghim, luôn đúng) ===
${mem}

=== THIẾT LẬP THÊM CỦA NGƯỜI CHƠI ===
${args.worldNote || '(không có)'}

=== LỊCH SỬ GẦN ĐÂY ===
${hist}

=== LƯỢT MỚI CỦA NGƯỜI CHƠI ===
${args.input}

=== YÊU CẦU ===
Độ dài: ${OUTPUT_LENGTH_HINT[args.length].text}. Trả về JSON theo đúng định dạng.
`.trim();
}
