/* eslint-disable */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import { ffmpegPath, videoEncoder } from '../index'

function formatSRTTime(secs: number): string {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0')
  return `${h}:${m}:${s},${ms}`
}

function formatVTTTime(secs: number): string {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  const ms = Math.floor((secs % 1) * 1000).toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function formatASSTime(secs: number): string {
  const h = Math.floor(secs / 3600).toString()
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  const cc = Math.floor((secs % 1) * 100).toString().padStart(2, '0')
  return `${h}:${m}:${s}.${cc}`
}

export function registerConverterHandlers() {
  ipcMain.handle('convert-file', async (event, { inputPath, outputDir, targetExt, subPath, apiKey }: any) => {
    try {
      const ext = path.extname(inputPath).toLowerCase(); const baseName = path.basename(inputPath, ext); const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(inputPath); const outputPath = path.join(finalOutputDir, `${baseName}_converted.${targetExt}`)
      if (['.docx', '.pdf'].includes(ext) || ['docx', 'pdf'].includes(targetExt)) return { success: false, message: "Yêu cầu API mở rộng để xử lý tài liệu Word/PDF!" }

      if (['srt', 'vtt', 'ass'].includes(targetExt)) {
        if (!apiKey || !apiKey.startsWith('gsk_')) return { success: false, message: "Vui lòng cấu hình Groq API Key!" }
        event.sender.send('convert-progress', { message: `Đang bóc tách luồng âm thanh gốc...`, percent: 15 }); const tempAudioPath = path.join(finalOutputDir, `temp_voice_${Date.now()}.mp3`)
        await new Promise<void>((resolve, reject) => { ffmpeg(inputPath).setFfmpegPath(ffmpegPath).noVideo().audioCodec('libmp3lame').audioChannels(1).audioFrequency(16000).audioBitrate('64k').save(tempAudioPath).on('end', () => resolve()).on('error', (err) => reject(err)) })
        event.sender.send('convert-progress', { message: `Đang đẩy âm thanh lên Groq Cloud...`, percent: 45 }); const audioBuffer = fs.readFileSync(tempAudioPath); 
        
        const audioBlob = new (globalThis as any).Blob([audioBuffer], { type: 'audio/mp3' })
        const formData = new (globalThis as any).FormData(); formData.append('file', audioBlob, 'voice.mp3'); formData.append('model', 'whisper-large-v3'); formData.append('response_format', 'verbose_json')
        const apiResponse = await (globalThis as any).fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` }, body: formData })
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath)
        if (!apiResponse.ok) return { success: false, message: `Lỗi kết nối Groq Server: ${await apiResponse.text()}` }
        const resJson: any = await apiResponse.json(); const segments = resJson.segments || []
        if (segments.length === 0) return { success: false, message: "AI không trích xuất được hội thoại." }
        let subContent = ''
        if (targetExt === 'srt') { segments.forEach((seg: any, idx: number) => { subContent += `${idx + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text.trim()}\n\n` }) } 
        else if (targetExt === 'vtt') { subContent = 'WEBVTT\n\n'; segments.forEach((seg: any, idx: number) => { subContent += `${idx + 1}\n${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}\n${seg.text.trim()}\n\n` }) } 
        else if (targetExt === 'ass') { subContent = `[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`; segments.forEach((seg: any) => { subContent += `Dialogue: 0,${formatASSTime(seg.start)},${formatASSTime(seg.end)},Default,,0,0,0,,${seg.text.trim().replace(/\n/g, '\\N')}\n` }) }
        fs.writeFileSync(outputPath, subContent, 'utf-8'); event.sender.send('convert-progress', { message: `Hoàn thành!`, percent: 100 })
        return { success: true, message: `Hệ thống Whisper V3 đã trích xuất phụ đề (.${targetExt}) thành công!` }
      }

      const runEncodingEngine = (encoderId: string) => new Promise<void>((resolve, reject) => {
        let ff = ffmpeg(inputPath).setFfmpegPath(ffmpegPath).outputOptions('-y')
        const isVideoTarget = ['mp4', 'mkv', 'mov', 'avi'].includes(targetExt); const isAudioTarget = ['mp3', 'm4a'].includes(targetExt); const isImageTarget = ['png', 'jpg', 'webp'].includes(targetExt)
        if (isVideoTarget) {
          let filterGraph = 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
          if (subPath && fs.existsSync(subPath)) { filterGraph += `,subtitles='${subPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'` }
          ff.videoFilters(filterGraph)
          const outputOpts = [`-c:v ${encoderId}`, '-pix_fmt yuv420p', '-c:a aac', '-b:a 192k']
          if (encoderId === 'h264_nvenc') { outputOpts.push('-preset p6', '-profile:v high', '-rc vbr', '-cq 19', '-b:v 0') } 
          else if (encoderId === 'h264_amf') { outputOpts.push('-quality balanced') } 
          else if (encoderId === 'h264_qsv') { outputOpts.push('-preset medium') } 
          else if (encoderId === 'libx264') { outputOpts.push('-preset fast', '-crf 23') } 
          else if (encoderId === 'h264_videotoolbox') { outputOpts.push('-b:v 6000k') }
          ff.outputOptions(outputOpts)
        } 
        else if (isAudioTarget) { ff.noVideo(); if (targetExt === 'mp3') ff.outputOptions(['-c:a libmp3lame', '-b:a 192k']); if (targetExt === 'm4a') ff.outputOptions(['-c:a aac', '-b:a 192k']) } 
        else if (isImageTarget) { ff.outputOptions('-vframes 1') }
        ff.save(outputPath).on('progress', (p) => { const pct = p.percent ? Math.round(p.percent) : 0; event.sender.send('convert-progress', { message: `Đang xử lý chuẩn hóa định dạng: ${pct}%`, percent: pct }) }).on('error', reject).on('end', () => resolve())
      })

      try { await runEncodingEngine(videoEncoder); return { success: true, message: `Chuyển đổi tập tin thành công!` } } 
      catch (err: any) {
        if (videoEncoder !== 'libx264') { event.sender.send('convert-progress', { message: `Phát hiện lỗi GPU! Tự động chuyển luồng sang CPU...`, percent: 0 }); await runEncodingEngine('libx264'); return { success: true, message: `Chuyển đổi tập tin thành công bằng nhân CPU dự phòng!` } } 
        else { return { success: false, message: err.message } }
      }
    } catch (error: any) { return { success: false, message: error.message } }
  })
}