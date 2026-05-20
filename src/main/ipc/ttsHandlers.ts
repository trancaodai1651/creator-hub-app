/* eslint-disable */
import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export function registerTtsHandlers() {
  ipcMain.handle('get-elevenlabs-voices', async (_event, { apiKey }: any) => {
    if (!apiKey) return []
    try { const response = await (globalThis as any).fetch('https://api.elevenlabs.io/v1/voices', { method: 'GET', headers: { 'xi-api-key': apiKey } }); if (!response.ok) return []; const data: any = await response.json(); return data.voices || [] } 
    catch (err) { return [] }
  })

  ipcMain.handle('generate-tts-elevenlabs', async (event, { text, voiceId, apiKey, outputDir }: any) => {
    if (!text || !voiceId || !apiKey) return { success: false, message: "Thiếu tham số cấu hình hệ thống!" }
    const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : app.getPath('downloads')
    const outputPath = path.join(finalOutputDir, `Voice_Adam_AI_${Date.now()}.mp3`)
    try {
      event.sender.send('convert-progress', { message: "Đang kết nối cổng dịch thuật ElevenLabs...", percent: 20 })
      const response = await (globalThis as any).fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }) })
      if (!response.ok) return { success: false, message: `Lỗi kết nối API: ${await response.text()}` }
      event.sender.send('convert-progress', { message: "Đang tải luồng âm thanh nhị phân...", percent: 60 })
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(outputPath, buffer); event.sender.send('convert-progress', { message: "Hoàn thành!", percent: 100 })
      return { success: true, message: `Đã tạo thành công giọng đọc AI tại thư mục: ${outputPath}` }
    } catch (error: any) { return { success: false, message: error.message } }
  })
}