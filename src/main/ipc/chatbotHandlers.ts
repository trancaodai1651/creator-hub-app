/* eslint-disable */
import { ipcMain } from 'electron'

export function registerChatbotHandlers() {
  ipcMain.handle('ask-groq-chatbot', async (_event, { messages, groqKey, model }) => {
    try {
      const hasImage = messages.some((m: any) => Array.isArray(m.content));
      
      // Nếu có ảnh -> Ép dùng Vision. Nếu không có ảnh -> Dùng Model người dùng đang chọn
      const selectedModel = hasImage ? 'llama-3.2-11b-vision-preview' : (model || 'llama-3.1-8b-instant');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          temperature: 0.7,
          max_tokens: 8000, // 🚀 MỞ KHÓA GIỚI HẠN TỪ VỰNG TỐI ĐA (~6000 từ/lần)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { success: true, content: data.choices[0].message.content };
    } catch (error: any) {
      console.error('Lỗi kết nối Groq API:', error.message);
      return { success: false, error: error.message };
    }
  });
}