import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as path from 'path'
import icon from '../../resources/icon.png?asset'

import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import YTDlpWrap from 'yt-dlp-wrap'
import { spawn, exec, execSync } from 'child_process'

// ====================================================================
// KHU VỰC CẤU HÌNH ĐƯỜNG DẪN FFMPEG ĐA NỀN TẢNG THÔNG MINH
// ====================================================================
const resolveStaticPath = (staticModule: any): string => {
  if (!staticModule) return ''
  const mod = staticModule.default ? staticModule.default : staticModule
  let rawPath = ''
  if (typeof mod === 'string') rawPath = mod 
  else if (mod && typeof mod.path === 'string') rawPath = mod.path 
  if (rawPath) return path.resolve(rawPath).replace('app.asar', 'app.asar.unpacked')
  return ''
}

let ffmpegPath = resolveStaticPath(ffmpegStatic)
let ffprobePath = resolveStaticPath(ffprobeStatic)

if (process.platform === 'darwin') {
  const brewFfmpegArm = '/opt/homebrew/bin/ffmpeg'
  const brewFfprobeArm = '/opt/homebrew/bin/ffprobe'
  const brewFfmpegIntel = '/usr/local/bin/ffmpeg'
  const brewFfprobeIntel = '/usr/local/bin/ffprobe'

  if (fs.existsSync(brewFfmpegArm)) { ffmpegPath = brewFfmpegArm; ffprobePath = brewFfprobeArm }
  else if (fs.existsSync(brewFfmpegIntel)) { ffmpegPath = brewFfmpegIntel; ffprobePath = brewFfprobeIntel }
}

if (ffmpegPath && fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath)
if (ffprobePath && fs.existsSync(ffprobePath)) ffmpeg.setFfprobePath(ffprobePath)

let isPaused = false
let isCancelled = false
let resumeResolver: (() => void) | null = null

const userDataPath = app.getPath('userData')
const ytdlpBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : (process.platform === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp')
const ytdlpBinaryPath = path.join(userDataPath, ytdlpBinaryName)

let videoEncoder = 'libx264' 
if (process.platform === 'win32') {
  try {
    const stdout = execSync('wmic path win32_VideoController get name', { encoding: 'utf-8' })
    const out = stdout.toLowerCase()
    if (out.includes('nvidia')) videoEncoder = 'h264_nvenc' 
    else if (out.includes('amd') || out.includes('radeon')) videoEncoder = 'h264_amf'
    else if (out.includes('intel')) videoEncoder = 'h264_qsv'
  } catch (err) { videoEncoder = 'libx264' }
} else if (process.platform === 'darwin') {
  videoEncoder = 'h264_videotoolbox'
}

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

const getMacBrewPath = (): string | null => {
  if (process.platform !== 'darwin') return null
  if (fs.existsSync('/opt/homebrew/bin/brew')) return '/opt/homebrew/bin/brew' 
  if (fs.existsSync('/usr/local/bin/brew')) return '/usr/local/bin/brew'     
  return null
}

const calculateFolderSize = (dirPath: string): number => {
  let totalSize = 0
  if (!fs.existsSync(dirPath)) return 0
  try {
    const stats = fs.statSync(dirPath)
    if (stats.isFile()) return stats.size
    const files = fs.readdirSync(dirPath)
    for (const file of files) { totalSize += calculateFolderSize(path.join(dirPath, file)) }
  } catch { }
  return totalSize
}

const clearFolderContents = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) return
  try {
    const stats = fs.statSync(dirPath)
    if (stats.isFile()) { fs.unlinkSync(dirPath); return }
    const files = fs.readdirSync(dirPath)
    for (const file of files) {
      const fullPath = path.join(dirPath, file)
      try { fs.rmSync(fullPath, { recursive: true, force: true }) } catch {}
    }
  } catch {}
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440, height: 860, minWidth: 1200, minHeight: 750, show: false, autoHideMenuBar: true, title: 'CREATOR HUB',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false }
  })
  mainWindow.on('ready-to-show', () => { mainWindow.show() })
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => { optimizer.watchWindowShortcuts(window) })

  ipcMain.handle('get-platform', () => process.platform)

  ipcMain.handle('check-mac-brew', () => {
    if (process.platform !== 'darwin') return true
    return getMacBrewPath() !== null
  })

  ipcMain.handle('install-mac-brew', async () => {
    if (process.platform !== 'darwin') return { success: false, message: "Only for Mac" }
    return new Promise((resolve) => {
      const bashCmd = 'NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
      const appleScript = `tell application "Terminal"\nactivate\ndo script "${bashCmd.replace(/"/g, '\\"')}"\nend tell`
      exec(`osascript -e '${appleScript}'`, (err) => {
        if (err) resolve({ success: false, message: err.message })
        else resolve({ success: true })
      })
    })
  })

  ipcMain.handle('ensure-mac-ffmpeg', async (event) => {
    if (process.platform !== 'darwin') return { success: true }

    const brewFfmpegArm = '/opt/homebrew/bin/ffmpeg'
    const brewFfmpegIntel = '/usr/local/bin/ffmpeg'

    if (fs.existsSync(brewFfmpegArm)) { ffmpeg.setFfmpegPath(brewFfmpegArm); ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe'); return { success: true } }
    if (fs.existsSync(brewFfmpegIntel)) { ffmpeg.setFfmpegPath(brewFfmpegIntel); ffmpeg.setFfprobePath('/usr/local/bin/ffprobe'); return { success: true } }

    const brewPath = getMacBrewPath()
    if (!brewPath) return { success: false, message: "Hệ thống không tìm thấy lõi Homebrew." }

    return new Promise((resolve) => {
      event.sender.send('ffmpeg-install-progress', { message: 'Đang kết nối kho ứng dụng Mac Homebrew...', percent: 10 })
      const child = spawn(brewPath, ['install', 'ffmpeg'], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' } })

      child.stdout.on('data', (data) => {
        const output = data.toString()
        let stagePercent = 50; let stageMsg = 'Đang tải và biên dịch lõi FFmpeg Apple Hardware...'
        if (output.includes('Downloading')) { stagePercent = 40; stageMsg = 'Đang tải dữ liệu FFmpeg...' }
        else if (output.includes('Installing') || output.includes('Pouring')) { stagePercent = 80; stageMsg = 'Đang cài đặt FFmpeg vào hệ thống...' }
        event.sender.send('ffmpeg-install-progress', { message: stageMsg, percent: stagePercent })
      })

      child.on('close', () => {
        if (fs.existsSync(brewFfmpegArm)) { ffmpeg.setFfmpegPath(brewFfmpegArm); ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe'); resolve({ success: true }) } 
        else if (fs.existsSync(brewFfmpegIntel)) { ffmpeg.setFfmpegPath(brewFfmpegIntel); ffmpeg.setFfprobePath('/usr/local/bin/ffprobe'); resolve({ success: true }) } 
        else { resolve({ success: false, message: "Lỗi mạng! Không thể cài đặt tự động FFmpeg." }) }
      })
    })
  })

  ipcMain.handle('open-folder-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Chọn thư mục mục tiêu', properties: ['openDirectory'] })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('open-file-dialog', async (_event, allowedExtensions) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Chọn tập tin xử lý', filters: allowedExtensions ? [allowedExtensions] : [], properties: ['openFile'] })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('open-multi-files-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Chọn các tập tin cần đổi tên hàng loạt', properties: ['openFile', 'multiSelections'] })
    if (!canceled && filePaths.length > 0) { return filePaths.map((p) => { const ext = path.extname(p); const name = path.basename(p, ext); return { path: p, name, ext } }) }
    return []
  })

  ipcMain.handle('open-logo-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Chọn file ảnh biểu tượng logo', filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }], properties: ['openFile'] })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('scan-folder', async (_event, folderPath) => {
    if (!folderPath) return []
    try {
      const stat = fs.statSync(folderPath); let directoryToScan = folderPath; if (stat.isFile()) directoryToScan = path.dirname(folderPath)
      const allFiles = fs.readdirSync(directoryToScan); const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov']
      return allFiles.filter(file => videoExtensions.includes(path.extname(file).toLowerCase())).map(file => path.join(directoryToScan, file))
    } catch (error) { return [] }
  })

  ipcMain.handle('pause-joining', () => { isPaused = true })
  ipcMain.handle('resume-joining', () => { isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })
  ipcMain.handle('cancel-joining', () => { isCancelled = true; isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })

  ipcMain.handle('start-joining', async (event, { videoPaths, minMins, maxMins, requirePillar, outputDir, logoPath, logoPosition, logoSize, ratio, useGpu }) => {
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
        const msg = `Giai đoạn 1/3: Đang quét kiểm tra thời lượng phim (${i + 1}/${totalFiles})...`
        if (await checkPauseAndCancel(msg, readPercent)) return { success: false, message: "Đã hủy bỏ tiến trình xử lý!" }
        event.sender.send('join-progress', { message: msg, percent: readPercent })
        const duration = await new Promise<number>((resolve) => { ffmpeg.ffprobe(vPath, (err, metadata) => { if (err) resolve(0); else resolve(metadata?.format?.duration || 0) }) })
        if (duration > 0) videoData.push({ path: vPath, duration })
      }

      if (await checkPauseAndCancel("Đang tính toán sắp xếp thuật toán phân tập phim...", 100)) return { success: false, message: "Đã hủy bỏ!" }
      event.sender.send('join-progress', { message: `Giai đoạn 2/3: Đang ngẫu nhiên hóa kịch bản phim (Shuffle)...`, percent: 100 })

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
      if (groups.length === 0) return { success: false, message: "Tổng thời lượng video hợp lệ quá ít để phân tập!" }

      const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(videoPaths[0])
      const totalGroups = groups.length
      const hasLogo = logoPath && fs.existsSync(logoPath)
      const finalEncoder = useGpu ? videoEncoder : 'libx264'
      
      for (let i = 0; i < totalGroups; i++) {
        const group = groups[i]; const renderPercent = Math.round((i / totalGroups) * 100)
        const msg = `Giai đoạn 3/3: Đang xuất bản kết quả Tập ${i + 1}/${totalGroups} [Lõi: ${finalEncoder}]...`

        if (await checkPauseAndCancel(msg, renderPercent)) return { success: false, message: "Đã hủy bỏ!" }
        event.sender.send('join-progress', { message: msg, percent: renderPercent })

        const txtContent = group.map(v => `file '${v.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
        const txtPath = path.join(finalOutputDir, `temp_list_${i}.txt`)
        fs.writeFileSync(txtPath, txtContent, 'utf-8')

        const outputPath = path.join(finalOutputDir, `KQUA_RENDER_TAP_${i + 1}.mp4`)

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
          if (finalEncoder !== 'libx264') { console.log(`Lỗi GPU Engine, đang chuyển sang CPU...`); await runFfmpegEngine('libx264') } 
          else { throw err }
        }
      }
      event.sender.send('join-progress', { message: `Hoàn thành!`, percent: 100 })
      return { success: true, message: `Thành công! Toàn bộ các tập phim đã được gộp hoàn tất.` }
    } catch (err: any) { return { success: false, message: err.message || "Lỗi hệ thống render" } }
  })

  ipcMain.handle('convert-file', async (event, { inputPath, outputDir, targetExt, subPath, apiKey }) => {
    try {
      const ext = path.extname(inputPath).toLowerCase(); const baseName = path.basename(inputPath, ext); const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(inputPath); const outputPath = path.join(finalOutputDir, `${baseName}_converted.${targetExt}`)
      if (['.docx', '.pdf'].includes(ext) || ['docx', 'pdf'].includes(targetExt)) return { success: false, message: "Yêu cầu API mở rộng để xử lý tài liệu Word/PDF!" }

      if (['srt', 'vtt', 'ass'].includes(targetExt)) {
        if (!apiKey || !apiKey.startsWith('gsk_')) return { success: false, message: "Vui lòng cấu hình Groq API Key!" }
        event.sender.send('convert-progress', { message: `Đang bóc tách luồng âm thanh gốc...`, percent: 15 }); const tempAudioPath = path.join(finalOutputDir, `temp_voice_${Date.now()}.mp3`)
        await new Promise<void>((resolve, reject) => { ffmpeg(inputPath).setFfmpegPath(ffmpegPath).noVideo().audioCodec('libmp3lame').audioChannels(1).audioFrequency(16000).audioBitrate('64k').save(tempAudioPath).on('end', () => resolve()).on('error', (err) => reject(err)) })
        event.sender.send('convert-progress', { message: `Đang đẩy âm thanh lên Groq Cloud...`, percent: 45 }); const audioBuffer = fs.readFileSync(tempAudioPath); const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' })
        const formData = new FormData(); formData.append('file', audioBlob, 'voice.mp3'); formData.append('model', 'whisper-large-v3'); formData.append('response_format', 'verbose_json')
        const apiResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}` }, body: formData })
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
        ff.save(outputPath).on('progress', (p) => { const pct = p.percent ? Math.round(p.percent) : 0; event.sender.send('convert-progress', { message: `Đang xử lý chuẩn hóa định dạng: ${pct}%`, percent: pct }) }).on('error', reject).on('end', resolve)
      })

      try { await runEncodingEngine(videoEncoder); return { success: true, message: `Chuyển đổi tập tin thành công!` } } 
      catch (err: any) {
        if (videoEncoder !== 'libx264') { event.sender.send('convert-progress', { message: `Phát hiện lỗi GPU! Tự động chuyển luồng sang CPU...`, percent: 0 }); await runEncodingEngine('libx264'); return { success: true, message: `Chuyển đổi tập tin thành công bằng nhân CPU dự phòng!` } } 
        else { return { success: false, message: err.message } }
      }
    } catch (error: any) { return { success: false, message: error.message } }
  })

  ipcMain.handle('get-elevenlabs-voices', async (_event, { apiKey }) => {
    if (!apiKey) return []
    try { const response = await fetch('https://api.elevenlabs.io/v1/voices', { method: 'GET', headers: { 'xi-api-key': apiKey } }); if (!response.ok) return []; const data: any = await response.json(); return data.voices || [] } 
    catch (err) { return [] }
  })

  ipcMain.handle('generate-tts-elevenlabs', async (event, { text, voiceId, apiKey, outputDir }) => {
    if (!text || !voiceId || !apiKey) return { success: false, message: "Thiếu tham số cấu hình hệ thống!" }
    const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : app.getPath('downloads')
    const outputPath = path.join(finalOutputDir, `Voice_Adam_AI_${Date.now()}.mp3`)
    try {
      event.sender.send('convert-progress', { message: "Đang kết nối cổng dịch thuật ElevenLabs...", percent: 20 })
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }) })
      if (!response.ok) return { success: false, message: `Lỗi kết nối API: ${await response.text()}` }
      event.sender.send('convert-progress', { message: "Đang tải luồng âm thanh nhị phân...", percent: 60 })
      const buffer = Buffer.from(await response.arrayBuffer())
      fs.writeFileSync(outputPath, buffer); event.sender.send('convert-progress', { message: "Hoàn thành!", percent: 100 })
      return { success: true, message: `Đã tạo thành công giọng đọc AI tại thư mục: ${outputPath}` }
    } catch (error: any) { return { success: false, message: error.message } }
  })

  ipcMain.handle('execute-batch-rename', async (_event, { fileRules }) => {
    if (!fileRules || fileRules.length === 0) return { success: false, message: "Không có file nào để đổi tên!" }
    try { let successCount = 0; for (const rule of fileRules) { if (fs.existsSync(rule.oldPath)) { fs.renameSync(rule.oldPath, rule.newPath); successCount++ } }; return { success: true, message: `Đã đổi tên hàng loạt thành công ${successCount}/${fileRules.length} tập tin.` } } 
    catch (err: any) { return { success: false, message: `Lỗi hệ thống file: ${err.message}` } }
  })

  ipcMain.handle('download-video', async (event, { url, saveDir, resolution, startTime, endTime }) => {
    const finalSaveDir = saveDir && fs.existsSync(saveDir) ? saveDir : app.getPath('downloads'); 
    const tempDir = path.join(finalSaveDir, `temp_clip_${Date.now()}`); 
    const needCut = startTime && endTime

    try {
      const YTDlpWrapClass = (YTDlpWrap as any).default ? (YTDlpWrap as any).default : YTDlpWrap;
      if (!fs.existsSync(ytdlpBinaryPath)) { 
        event.sender.send('download-progress', { message: 'Đang đồng bộ lõi tải video hệ thống...', percent: 10 }); 
        await YTDlpWrapClass.downloadFromGithub(ytdlpBinaryPath) 
      }
      
      const ytdlpWrap = new YTDlpWrapClass(ytdlpBinaryPath); 
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir); 
      
      const outputTemplate = path.join(tempDir, '%(title)s.%(ext)s'); 
      let formatFilter = 'bv*+ba/b'
      
      if (resolution === '2160') formatFilter = 'bv*[height<=2160]+ba/b'; 
      else if (resolution === '1440') formatFilter = 'bv*[height<=1440]+ba/b'; 
      else if (resolution === '1080') formatFilter = 'bv*[height<=1080]+ba/b'; 
      else if (resolution === '720') formatFilter = 'bv*[height<=720]+ba/b'

      await new Promise((resolve, reject) => { 
        ytdlpWrap.exec([ 
          url, 
          '-o', outputTemplate, 
          '-f', formatFilter, 
          '--ffmpeg-location', ffmpegPath, 
          '--merge-output-format', 'mp4'
        ]).on('progress', (progress) => { 
          event.sender.send('download-progress', { message: needCut ? `Đang tải video luồng nguồn: ${progress.percent}%` : `Đang tải video: ${progress.percent}%`, percent: needCut ? Math.round(progress.percent * 0.9) : progress.percent }) 
        }).on('error', reject).on('close', resolve) 
      })
      
      const downloadedFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.mp4')); 
      if (downloadedFiles.length === 0) throw new Error("Lỗi luồng dữ liệu tải xuống."); 
      
      const downloadedFileName = downloadedFiles[0]; 
      const downloadedFilePath = path.join(tempDir, downloadedFileName); 
      const finalFilePath = path.join(finalSaveDir, downloadedFileName)
      
      if (needCut) { 
        await new Promise<void>((resolve, reject) => { 
          ffmpeg(downloadedFilePath).setFfmpegPath(ffmpegPath).outputOptions([ `-ss ${startTime}`, `-to ${endTime}`, '-c copy' ]).save(finalFilePath).on('end', () => resolve()).on('error', (err) => reject(err)) 
        }); 
        fs.rmSync(tempDir, { recursive: true, force: true }); 
        event.sender.send('download-progress', { message: 'Hoàn thành!', percent: 100 }); 
        return { success: true, message: `Đã trích xuất và cắt phân đoạn clip thành công!` } 
      } else { 
        fs.renameSync(downloadedFilePath, finalFilePath); 
        fs.rmSync(tempDir, { recursive: true, force: true }); 
        event.sender.send('download-progress', { message: 'Hoàn thành!', percent: 100 }); 
        return { success: true, message: `Đã tải hoàn tất video chất lượng cao nhất.` } 
      }
    } catch (error: any) { 
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); 
      return { success: false, message: error.message } 
    }
  })

  ipcMain.handle('search-apps', async (_event, { query }) => {
    if (!query || query.trim() === '') return []
    if (process.platform === 'darwin') {
      const brewPath = getMacBrewPath(); if (!brewPath) return [] 
      return new Promise((resolve) => { exec(`"${brewPath}" search --casks "${query.replace(/"/g, '')}"`, { encoding: 'utf-8' }, (err, stdout) => { if (err || !stdout) { resolve([]); return; }; const lines = stdout.split(/\r?\n/); const results: { id: string; name: string; icon: string }[] = []; for (let line of lines) { const trimmed = line.trim(); if (!trimmed || trimmed.includes('==>') || trimmed.includes('Error')) continue; results.push({ name: trimmed, id: trimmed, icon: '🍎' }) }; resolve(results.slice(0, 12)) }) })
    }
    return new Promise((resolve) => { exec(`winget search "${query.replace(/"/g, '')}"`, { encoding: 'utf-8' }, (err, stdout) => { if (err || !stdout) { resolve([]); return; }; const lines = stdout.split(/\r?\n/); const results: { id: string; name: string; icon: string }[] = []; for (let line of lines) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith('Name') || trimmed.startsWith('---') || trimmed.includes('…')) continue; const parts = trimmed.split(/\s{2,}/); if (parts.length >= 2) { if (parts[0].toLowerCase().includes('no package found') || parts[0].toLowerCase().includes('không tìm thấy')) continue; results.push({ name: parts[0], id: parts[1], icon: '📦' }) } }; resolve(results.slice(0, 12)) }) })
  })

  // ====================================================================
  // [FORCE REINSTALL] ÉP MAC VÀ WINDOWS CÀI ĐÈ APP NẾU BỊ LỖI CACHE
  // ====================================================================
  ipcMain.handle('install-selected-apps', async (event, { appIds }) => {
    if (!appIds || appIds.length === 0) return { success: false, message: "No apps selected" }
    
    // --- Lệnh cài đè (Reinstall) trên macOS để trị lỗi ảo ---
    if (process.platform === 'darwin') {
      const brewPath = getMacBrewPath(); if (!brewPath) { return { success: false, message: "Không tìm thấy Homebrew trên máy Mac của bạn." } }
      const totalApps = appIds.length
      let successCount = 0
      let lastError = ""

      for (let i = 0; i < totalApps; i++) {
        const appId = appIds[i]; let stagePercent = 20
        await new Promise<void>((resolve) => {
          event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage: 'Đang kết nối Homebrew Cloud...', stagePercent, globalPercent: Math.round((i / totalApps) * 100) })
          
          // Dùng reinstall thay cho install
          const child = spawn(brewPath, ['reinstall', '--cask', appId], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' } })
          
          let errLog = ''
          child.stdout.on('data', (data) => { 
            const output = data.toString(); let stage = 'Đang tải xuống tệp cài đặt...'
            if (output.includes('Downloading')) { stagePercent = 50; stage = 'Đang tải dữ liệu ứng dụng...' } 
            else if (output.includes('Installing') || output.includes('Staging')) { stagePercent = 85; stage = 'Đang giải nén và chép đè hệ thống...' }
            const globalPercent = Math.round(((i / totalApps) * 100) + (stagePercent / totalApps))
            event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage, stagePercent, globalPercent }) 
          })
          
          child.stderr.on('data', (data) => { errLog += data.toString() })
          
          child.on('close', (code) => { 
            if (code === 0 || errLog.includes('already installed') || errLog.includes('successfully installed')) {
              successCount++
            } else {
              lastError = errLog || "Lỗi quyền đọc ghi hệ thống."
            }
            resolve() 
          })
        })
      }
      event.sender.send('install-apps-progress', { message: 'Hoàn thành!', percent: 100 })
      if (successCount === totalApps) {
        return { success: true, message: "Thành công! Toàn bộ các phần mềm đã được nạp gọn vào mục Applications." }
      } else {
        return { success: false, message: `Quá trình cài đặt bị gián đoạn (${successCount}/${totalApps} thành công).\n\nLưu ý: Một số ứng dụng yêu cầu cấp quyền Admin để ghi đè. Vui lòng mở Terminal và gõ: brew install --cask <tên_app>\n\nChi tiết lỗi từ hệ điều hành:\n${lastError}` }
      }
    }

    // --- Lệnh ép cài đè (Force) trên Windows ---
    const totalApps = appIds.length
    let successCount = 0
    let lastError = ""

    for (let i = 0; i < totalApps; i++) {
      const appId = appIds[i]; let currentStage = 'Khởi động'; let stagePercent = 0
      await new Promise<void>((resolve) => {
        // Bổ sung cờ --force
        const child = spawn('winget', ['install', appId, '--silent', '--force', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity'])
        
        let errLog = ''
        child.stdout.on('data', (data) => { 
          const output = data.toString()
          if (output.includes('Download') || output.includes('Tải') || output.includes('download')) { currentStage = 'Tải xuống' } 
          else if (output.includes('Install') || output.includes('Cài') || output.includes('install') || output.includes('hash')) { currentStage = 'Cài đặt ngầm' }
          const match = output.match(/(\d+)%/)
          if (match) { stagePercent = parseInt(match[1], 10) } else { if (currentStage === 'Cài đặt ngầm' && stagePercent < 90) { stagePercent += 5 } }
          const globalPercent = Math.round(((i / totalApps) * 100) + (stagePercent / totalApps))
          event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage: currentStage, stagePercent, globalPercent: globalPercent > 100 ? 100 : globalPercent }) 
        })
        
        child.stderr.on('data', (data) => { errLog += data.toString() })

        child.on('close', (code) => { 
          if (code === 0 || errLog.includes('already installed')) {
            successCount++
          } else {
            lastError = errLog || `Mã lỗi Winget: ${code}`
          }
          resolve() 
        })
      })
    }
    event.sender.send('install-apps-progress', { message: 'Hoàn thành!', percent: 100 })
    if (successCount === totalApps) {
      return { success: true, message: "Toàn bộ các phần mềm đã được cài đặt tự động ngầm hoàn toàn vào máy tính của bạn." }
    } else {
      return { success: false, message: `Quá trình cài đặt bị gián đoạn (${successCount}/${totalApps} thành công).\n\nChi tiết lỗi:\n${lastError}` }
    }
  })

  ipcMain.handle('get-system-installed-apps', async () => {
    if (process.platform === 'win32') { return new Promise((resolve) => { const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* 2>$null | Where-Object { $_.DisplayName -and $_.SystemComponent -ne 1 -and $_.ParentKeyName -eq $null } | Select-Object @{N='name';E={$_.DisplayName}}, @{N='path';E={$_.UninstallString}}, @{N='version';E={$_.DisplayVersion}}, @{N='publisher';E={$_.Publisher}} | ConvertTo-Json -Compress"`; exec(psCmd, { maxBuffer: 1024 * 1024 * 15 }, (err, stdout) => { if (err || !stdout) { resolve([]); return }; try { const parsed = JSON.parse(stdout); resolve(Array.isArray(parsed) ? parsed : [parsed]) } catch { resolve([]) } }) }) }
    if (process.platform === 'darwin') { const apps: any[] = []; const scanDirs = ['/Applications', path.join(app.getPath('home'), 'Applications')]; scanDirs.forEach((dir) => { if (fs.existsSync(dir)) { const files = fs.readdirSync(dir); files.forEach((file) => { if (file.endsWith('.app')) { apps.push({ name: file.replace('.app', ''), path: path.join(dir, file), version: 'N/A', publisher: dir.startsWith('/Users') ? 'User Installed' : 'System' }) } }) } }); return apps }
    return []
  })

  ipcMain.handle('execute-clean-uninstall', async (_event, { appPath, appName }) => {
    if (!appPath) return { success: false, message: "Đường dẫn không hợp lệ!" }
    if (process.platform === 'win32') { return new Promise((resolve) => { exec(appPath, (err) => { if (err) { resolve({ success: false, message: `Lỗi kích hoạt trình gỡ: ${err.message}` }); return }; resolve({ success: true, message: `Hệ thống Windows đã kích hoạt trình gỡ bỏ ứng dụng thành công!` }) }) }) }
    if (process.platform === 'darwin') { try { if (fs.existsSync(appPath)) { fs.rmSync(appPath, { recursive: true, force: true }) }; const userHome = app.getPath('home'); const cleanTargets = [ path.join(userHome, 'Library/Application Support', appName), path.join(userHome, 'Library/Caches', appName), path.join(userHome, 'Library/Caches', `com.${appName.toLowerCase().replace(/\s+/g, '')}`), path.join(userHome, 'Library/Preferences', `com.${appName.toLowerCase().replace(/\s+/g, '')}.plist`) ]; cleanTargets.forEach((target) => { if (fs.existsSync(target)) { fs.rmSync(target, { recursive: true, force: true }) } }); return { success: true, message: `Đã xóa sạch ứng dụng và dọn dẹp file cấu hình liên quan khỏi bộ nhớ Mac.` } } catch (err: any) { return { success: false, message: `Lỗi gỡ bỏ: ${err.message}` } } }
    return { success: false, message: "Hệ điều hành không được hỗ trợ!" }
  })

  ipcMain.handle('scan-system-junk', async () => {
    const junkData: { id: string; name: string; desc: string; size: number; path: string }[] = []; const homeDir = app.getPath('home')
    if (process.platform === 'win32') { const localAppData = process.env.LOCALAPPDATA || ''; const winTemp = 'C:\\Windows\\Temp'; const userTemp = path.join(localAppData, 'Temp'); const capcutCache = path.join(localAppData, 'CapCut\\User Data\\Cache'); const chromeCache = path.join(localAppData, 'Google\\Chrome\\User Data\\Default\\Cache'); junkData.push({ id: 'sys_temp', name: 'Tệp tin hệ thống tạm thời (Windows Temp)', desc: 'Các file rác sinh ra trong quá trình Windows vận hành.', size: calculateFolderSize(winTemp) + calculateFolderSize(userTemp), path: userTemp }); junkData.push({ id: 'capcut_cache', name: 'Bộ nhớ đệm CapCut / TikTok Editor Cache', desc: 'File đệm video, hiệu ứng, âm thanh do CapCut tải về.', size: calculateFolderSize(capcutCache), path: capcutCache }); junkData.push({ id: 'chrome_cache', name: 'Bộ nhớ đệm Trình duyệt (Google Chrome Cache)', desc: 'Lịch sử hình ảnh, cookie đệm trang web giúp lướt web nhanh.', size: calculateFolderSize(chromeCache), path: chromeCache }) } 
    else if (process.platform === 'darwin') { const macTemp = path.join(homeDir, 'Library/Caches'); const capcutCache = path.join(homeDir, 'Library/Caches/com.lemon.lvpro'); const chromeCache = path.join(homeDir, 'Library/Caches/Google/Chrome/Default/Cache'); const safariCache = path.join(homeDir, 'Library/Caches/com.apple.Safari'); const sysLogs = path.join(homeDir, 'Library/Logs'); junkData.push({ id: 'sys_temp', name: 'Tệp đệm ứng dụng hệ thống (Mac System Caches)', desc: 'Tệp tin đệm logs và bộ nhớ tạm của macOS.', size: calculateFolderSize(macTemp) - calculateFolderSize(capcutCache) - calculateFolderSize(chromeCache), path: macTemp }); junkData.push({ id: 'capcut_cache', name: 'Bộ nhớ đệm CapCut / TikTok Mac Cache', desc: 'File video nháp, proxy và dữ liệu hiệu ứng âm thanh ngầm.', size: calculateFolderSize(capcutCache), path: capcutCache }); junkData.push({ id: 'browser_cache', name: 'Bộ nhớ tạm Trình duyệt (Chrome & Safari Cache)', desc: 'File hình ảnh, mã nguồn web lưu tạm của Chrome và Safari.', size: calculateFolderSize(chromeCache) + calculateFolderSize(safariCache), path: chromeCache }); junkData.push({ id: 'sys_logs', name: 'Nhật ký hệ thống (System Logs File)', desc: 'Các tệp log báo cáo lỗi và lịch sử đóng mở ứng dụng.', size: calculateFolderSize(sysLogs), path: sysLogs }) }
    return junkData
  })

  ipcMain.handle('execute-system-clean', async (_event, { targets }) => {
    if (!targets || targets.length === 0) return { success: false, message: "Không có mục tiêu nào được chọn để dọn dẹp!" }
    try { for (const targetPath of targets) { if (fs.existsSync(targetPath)) { clearFolderContents(targetPath) } }; return { success: true, message: "Hệ thống đã dọn dẹp sạch sẽ toàn bộ các file đệm rác! Ổ cứng của bạn đã được giải phóng bộ nhớ." } } catch (err: any) { return { success: false, message: `Lỗi trong quá trình dọn rác: ${err.message}` } }
  })

  createWindow()
  app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })