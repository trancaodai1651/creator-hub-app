export const GEMINI_MODEL = String(import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-lite')
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export type GeminiScriptInput = {
  apiKey: string
  platform: string
  targetDuration: number
  style: string
  productName: string
  benefits: string
  proof: string
  offer: string
  cta: string
  variationSeed: number
}

const platformGuidance: Record<string, string> = {
  tiktok: 'Mở đầu thật nhanh bằng một câu móc chú ý, câu ngắn, nhịp linh hoạt, ưu tiên cảm giác tự nhiên như người dùng thật và kết thúc bằng lời kêu gọi xem liên kết.',
  shopee: 'Nêu rõ công dụng, điểm khác biệt, cách dùng, giá hoặc ưu đãi nếu có; giọng đọc rõ ràng, đáng tin, hỗ trợ người xem quyết định mua trên Shopee.',
  facebook: 'Kể theo lối trò chuyện gần gũi, có bối cảnh hoặc vấn đề đời thường, giải thích lợi ích dễ hiểu và tạo cảm giác đáng tin khi chia sẻ với bạn bè.'
}

const readErrorMessage = (body: any, status: number) => {
  const message = body?.error?.message || body?.message
  if (status === 429) return 'Gemini đang giới hạn lượt dùng miễn phí. Hãy chờ một lát rồi thử lại.'
  if (status === 400 || status === 401 || status === 403) return message || 'Khóa Gemini không hợp lệ hoặc chưa được bật Gemini API.'
  return message || `Gemini không thể tạo kịch bản (mã ${status}).`
}

export const generateGeminiScript = async (input: GeminiScriptInput) => {
  const apiKey = input.apiKey.trim()
  if (!apiKey) throw new Error('Hãy nhập khóa Gemini API trong Cài đặt trước khi tạo kịch bản.')

  const targetDuration = Math.max(5, Math.min(600, Math.round(input.targetDuration)))
  const targetWords = Math.max(20, Math.round(targetDuration * 2.4))
  const platformName = input.platform === 'shopee' ? 'Shopee' : input.platform === 'facebook' ? 'Facebook' : 'TikTok'
  const prompt = `Bạn là biên tập viên kịch bản bán hàng đa nền tảng tại Việt Nam.

Hãy viết MỘT kịch bản đọc voice-over hoàn chỉnh cho ${platformName}, thời lượng mục tiêu khoảng ${targetDuration} giây, tương đương khoảng ${targetWords} từ tiếng Việt khi đọc tự nhiên ở tốc độ 2,2 đến 2,6 từ mỗi giây. Sai số độ dài cho phép khoảng 10%.

Góc triển khai: ${input.style}
Định hướng riêng cho nền tảng: ${platformGuidance[input.platform] || platformGuidance.tiktok}
Mã biến thể sáng tạo: ${input.variationSeed}. Hãy chọn cách mở bài, nhịp câu, hình ảnh gợi tả và cách kết thúc khác với những lần viết thông thường để nội dung phong phú, nhưng vẫn đúng thông tin sản phẩm.

Thông tin sản phẩm:
- Tên sản phẩm: ${input.productName.trim() || '(chưa cung cấp)'}
- Lợi ích và điểm nổi bật: ${input.benefits.trim() || '(chưa cung cấp)'}
- Bằng chứng hoặc đánh giá: ${input.proof.trim() || '(chưa cung cấp)'}
- Ưu đãi hoặc giá bán: ${input.offer.trim() || '(chưa cung cấp)'}
- Lời kêu gọi hành động: ${input.cta.trim() || '(hãy đề xuất một lời kêu gọi phù hợp)'}

Quy tắc bắt buộc:
1. Chỉ trả về phần lời đọc, không có tiêu đề, ghi chú, nhãn cảnh, dấu ngoặc kép, gạch đầu dòng hoặc giải thích bên ngoài kịch bản.
2. Không tự bịa chứng nhận, số liệu, đánh giá, công dụng y tế, giá hoặc cam kết mà thông tin sản phẩm chưa cung cấp.
3. Nếu thiếu dữ liệu, dùng cách diễn đạt trung tính và an toàn thay vì khẳng định quá mức.
4. Kịch bản phải dễ đọc thành tiếng, có mở đầu, phần thuyết phục và một lời kêu gọi hành động tự nhiên.
5. Không lặp lại một câu quá nhiều lần và không dùng các từ ngữ vi phạm chính sách quảng cáo.`

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.95,
        topP: 0.9,
        maxOutputTokens: Math.min(4096, Math.max(256, Math.round(targetWords * 1.8)))
      }
    })
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(readErrorMessage(body, response.status))

  const text = body?.candidates?.[0]?.content?.parts?.map((part: any) => typeof part?.text === 'string' ? part.text : '').join('\n').trim()
  if (!text) throw new Error(body?.promptFeedback?.blockReason ? `Gemini đã từ chối nội dung: ${body.promptFeedback.blockReason}.` : 'Gemini không trả về nội dung kịch bản.')
  return text.replace(/^```(?:text|markdown)?\s*/i, '').replace(/\s*```$/i, '').trim()
}
