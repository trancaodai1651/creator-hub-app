/* eslint-disable */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'

// ĐÃ SỬA: Import thêm cấu hình lõi ffprobePath từ file index đầu não
import { ffmpegPath, ffprobePath, videoEncoder } from '../index'

let isPaused = false
let isCancelled = false
let resumeResolver: (() => void) | null = null

export function registerJoinerHandlers() {
  if (ffmpegPath && fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath)
  // ĐÃ SỬA: Cấu hình định tuyến ép lõi đọc thời lượng phim hoạt động chéo file
  if (ffprobePath && fs.existsSync(ffprobePath)) ffmpeg.setFfprobePath(ffprobePath)

  ipcMain.handle('pause-joining', () => { isPaused = true })
  ipcMain.handle('resume-joining', () => { isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })
  ipcMain.handle('cancel-joining', () => { isCancelled = true; isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })

  ipcMain.handle('start-joining', async (event, { videoPaths, minMins, maxMins, requirePillar, outputDir, logoPath, logoPosition, logoSize, ratio, useGpu }: any) => {
    isPaused = false; isCancelled = false
    if (!videoPaths || videoPaths.length === 0) return { success: false, message: "Không tìm thấy dữ liệu video đầu vào!" }
    const minSecs = minMins * 60; const maxSecs = maxMins * 60

    const checkPauseAndCancel = async (currentMsg: string, currentPercent: number) => {
      if (isCancelled) return true
      if (isPaused) { event.sender.send('join-progress', { message: `[TAM DUNG] ${currentMsg}`, percent: currentPercent }); await new Promise<void>((resolve) => { resumeResolver = resolve }) }
      return isCancelled
    }

    try {
      const videoData: { path: string; duration: number }[] = []
      const totalFiles = videoPaths.length
      
      for (let i = 0; i < totalFiles; i++) {
        const vPath = videoPaths[i]; const readPercent = Math.round(((i + 1) / totalFiles) * 100)
        const msg = `Giai đoạn 1/3: Đang quét kiểm tra thời lượng video (${i + 1}/${totalFiles})...`
        if (await checkPauseAndCancel(msg, readPercent)) return { success: false, message: "Đã hủy bỏ tiến trình xử lý!" }
        event.sender.send('join-progress', { message: msg, percent: readPercent })
        
        // Luồng ffprobe đã chạy mượt mà sau khi nạp biến đường dẫn đa nền tảng
        const duration = await new Promise<number>((resolve) => { 
          ffmpeg.ffprobe(vPath, (err, metadata) => { 
            if (err) resolve(0)
            else resolve(metadata?.format?.duration || 0) 
          }) 
        })
        if (duration > 0) videoData.push({ path: vPath, duration })
      }

      if (videoData.length === 0) {
        return { success: false, message: "Hệ thống không quét được thông tin video! Vui lòng kiểm tra lại định dạng tệp video đầu vào." }
      }

      if (await checkPauseAndCancel("Đang tính toán sắp xếp kịch bản...", 100)) return { success: false, message: "Đã hủy bỏ!" }
      event.sender.send('join-progress', { message: `Giai đoạn 2/3: Đang ngẫu nhiên hóa kịch bản video (Shuffle)...`, percent: 100 })

      let pillars = requirePillar ? videoData.filter(v => v.duration > 600) : []
      let smallVideos = requirePillar ? videoData.filter(v => v.duration <= 600) : [...videoData]

      const shuffleArray = (arr: any[]) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] } }
      shuffleArray(pillars); shuffleArray(smallVideos)

      const groups: string[][] = []; let currentGroup: { path: string; duration: number }[] = []; let currentDuration = 0
      const finalizeGroup = (group: { path: string; duration: number }[]) => { if (group.length === 0) return; let maxIdx = 0; for (let i = 1; i < group.length; i++) { if (group[i].duration > group[maxIdx].duration) maxIdx = i }; const longestVideo = group.splice(maxIdx, 1)[0]; group.unshift(longestVideo); groups.push(group.map(g => g.path)) }

      if (requirePillar && pillars.length > 0) { let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration } }
      while (smallVideos.length > 0) {
        const nextVideo = smallVideos.pop(); if (!nextVideo) break
        if (currentDuration + nextVideo.duration > maxSecs) { if (currentDuration >= minSecs) finalizeGroup([...currentGroup]); currentGroup = []; currentDuration = 0; if (requirePillar && pillars.length > 0) { let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration } } }
        currentGroup.push(nextVideo); currentDuration += nextVideo.duration
        if (currentDuration >= minSecs && currentDuration <= maxSecs) { finalizeGroup([...currentGroup]); currentGroup = []; currentDuration = 0; if (requirePillar && pillars.length > 0) { let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration } } }
      }
      if (currentGroup.length > 0 && currentDuration >= minSecs) finalizeGroup(currentGroup)
      
      // Hỗ trợ nhắc nhở kịch bản nếu người dùng quên tắt chế độ Video Trụ Cột (Pillar)
      if (groups.length === 0) return { success: false, message: "Tổng thời lượng video gộp chưa đạt số phút tối thiểu! Nếu danh sách toàn bộ là clip ngắn (dưới 10 phút), bạn vui lòng TẮT cấu hình tùy chọn 'Chứa 1 video dài (Trụ cột)' ngoài màn hình chính để app tự gom tập nhé." }

      const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(videoPaths[0])
      const totalGroups = groups.length
      const hasLogo = logoPath && fs.existsSync(logoPath)
      const finalEncoder = useGpu ? videoEncoder : 'libx264'
      
      for (let i = 0; i < totalGroups; i++) {
        const group = groups[i]; const renderPercent = Math.round((i / totalGroups) * 100)
        const msg = `Giai đoạn 3/3: Đang xuất bản kết quả Video ${i + 1}/${totalGroups} [Lõi: ${finalEncoder}]...`

        if (await checkPauseAndCancel(msg, renderPercent)) return { success: false, message: "Đã hủy bỏ!" }
        event.sender.send('join-progress', { message: msg, percent: renderPercent })

        const txtContent = group.map(v => `file '${v.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
        const txtPath = path.join(finalOutputDir, `temp_list_${i}.txt`)
        fs.writeFileSync(txtPath, txtContent, 'utf-8')

        const outputPath = path.join(finalOutputDir, `VIDEO_${i + 1}.mp4`)

        const runFfmpegEngine = (encoderId: string) => new Promise<void>((resolve, reject) => {
          let ff = ffmpeg().input(txtPath).inputOptions(['-f concat', '-safe 0']).outputOptions('-y')
          const needReEncode = hasLogo || ratio !== 'original'

          if (needReEncode) {
            let ratioFilter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
            if (ratio === '16:9') ratioFilter = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080'
            else if (ratio === '9:16') ratioFilter = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'
            else if (ratio === '1:1') ratioFilter = 'scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080'

            if (hasLogo) {
              ff.input(logoPath)
              let overlayParams = '25:25'
              if (logoPosition === 'top-right') overlayParams = 'main_w-overlay_w-25:25'
              else if (logoPosition === 'bottom-left') overlayParams = '25:main_h-overlay_h-25'
              else if (logoPosition === 'bottom-right') overlayParams = 'main_w-overlay_w-25:main_h-overlay_h-25'
              const size = logoSize ? parseInt(logoSize) : 200; const radius = size / 2
              const logoFilter = `[1:v]scale=${size}:${size},format=rgba,geq=r='p(X,Y)':g='p(X,Y)':b='p(X,Y)':a='if(lte(hypot(X-${radius},Y-${radius}),${radius}),alpha(X,Y),0)'[maskedlogo]`
              if (ratio !== 'original') ff.complexFilter([ `[0:v]${ratioFilter}[bg]`, logoFilter, `[bg][maskedlogo]overlay=${overlayParams}` ])
              else ff.complexFilter([ logoFilter, `[0:v][maskedlogo]overlay=${overlayParams}` ])
            } else { ff.complexFilter([ `[0:v]${ratioFilter}` ]) }

            const outputOpts = [`-c:v ${encoderId}`, '-pix_fmt yuv420p', '-c:a aac', '-b:a 192k']
            if (encoderId === 'h264_nvenc') { outputOpts.push('-preset p6', '-profile:v high', '-rc vbr', '-cq 19', '-b:v 0') } 
            else if (encoderId === 'h264_amf') { outputOpts.push('-quality balanced') } 
            else if (encoderId === 'h264_qsv') { outputOpts.push('-preset medium') } 
            else if (encoderId === 'libx264') { outputOpts.push('-preset fast', '-crf 23') } 
            else if (encoderId === 'h264_videotoolbox') { outputOpts.push('-b:v 6000k') }
            ff.outputOptions(outputOpts)
          } else { ff.outputOptions('-c copy') }
          
          ff.save(outputPath).on('error', reject).on('end', () => { if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath); resolve() })
        })

        try { await runFfmpegEngine(finalEncoder) } 
        catch (err: any) {
          if (finalEncoder !== 'libx264') { console.log(`Lỗi GPU, chuyển sang CPU...`); await runFfmpegEngine('libx264') } 
          else { throw err }
        }
      }
      event.sender.send('join-progress', { message: `Hoàn thành!`, percent: 100 })
      return { success: true, message: "Thành công! Toàn bộ video đã được gộp hoàn tất." }
    } catch (err: any) { return { success: false, message: err.message || "Lỗi hệ thống render" } }
  })
}