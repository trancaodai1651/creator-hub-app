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
import { spawn, exec } from 'child_process' // <--- KÍCH HOẠT CẢ SPAWN VÀ EXEC ĐỂ ĐA NHIỆM

// ====================================================================
// KHU VUC CAU HINH DUONG DAN FFMPEG TUYET DOI
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

const ffmpegPath = resolveStaticPath(ffmpegStatic)
const ffprobePath = resolveStaticPath(ffprobeStatic)

if (ffmpegPath && fs.existsSync(ffmpegPath)) ffmpeg.setFfmpegPath(ffmpegPath)
if (ffprobePath && fs.existsSync(ffprobePath)) ffmpeg.setFfprobePath(ffprobePath)

// --- CAC BIEN DIEU KHIEN TIEN TRINH ---
let isPaused = false
let isCancelled = false
let resumeResolver: (() => void) | null = null

const userDataPath = app.getPath('userData')
const ytdlpBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
const ytdlpBinaryPath = path.join(userDataPath, ytdlpBinaryName)

let videoEncoder = 'libx264' 
if (process.platform === 'win32') {
  videoEncoder = 'h264_nvenc' 
} else if (process.platform === 'darwin') {
  videoEncoder = 'h264_videotoolbox' 
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 860,
    minWidth: 1200,
    minHeight: 750,
    show: false,
    autoHideMenuBar: true,
    title: 'CREATOR HUB',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false }
  })
  mainWindow.on('ready-to-show', () => { mainWindow.show() })
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

// ====================================================================
// CÁC CÂY CẦU GIAO TIẾP IPC (BACKEND NODE.JS)
// ====================================================================
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => { optimizer.watchWindowShortcuts(window) })

  ipcMain.handle('open-folder-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ title: 'Chon thu muc', properties: ['openDirectory'] })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('open-file-dialog', async (_event, allowedExtensions) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Chon file can xu ly', filters: allowedExtensions ? [allowedExtensions] : [], properties: ['openFile']
    })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('open-logo-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Chon file anh bieu tuong logo', filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp'] }], properties: ['openFile']
    })
    if (!canceled && filePaths.length > 0) return filePaths[0]
    return null
  })

  ipcMain.handle('scan-folder', async (_event, folderPath) => {
    if (!folderPath) return []
    try {
      const stat = fs.statSync(folderPath)
      let directoryToScan = folderPath
      if (stat.isFile()) directoryToScan = path.dirname(folderPath)
      const allFiles = fs.readdirSync(directoryToScan)
      const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov']
      return allFiles.filter(file => videoExtensions.includes(path.extname(file).toLowerCase())).map(file => path.join(directoryToScan, file))
    } catch (error) { return [] }
  })

  ipcMain.handle('pause-joining', () => { isPaused = true })
  ipcMain.handle('resume-joining', () => { isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })
  ipcMain.handle('cancel-joining', () => { isCancelled = true; isPaused = false; if (resumeResolver) { resumeResolver(); resumeResolver = null } })

  // --- [IPC] THUAT TOAN VIDEO JOINER ---
  ipcMain.handle('start-joining', async (event, { videoPaths, minMins, maxMins, requirePillar, outputDir, logoPath, logoPosition, ratio }) => {
    isPaused = false; isCancelled = false
    if (!videoPaths || videoPaths.length === 0) return { success: false, message: "Khong tim thay du lieu" }
    const minSecs = minMins * 60; const maxSecs = maxMins * 60

    const checkPauseAndCancel = async (currentMsg: string, currentPercent: number) => {
      if (isCancelled) return true
      if (isPaused) {
        event.sender.send('join-progress', { message: `[TAM DUNG] ${currentMsg}`, percent: currentPercent })
        await new Promise<void>((resolve) => { resumeResolver = resolve })
      }
      return isCancelled
    }

    try {
      const videoData: { path: string; duration: number }[] = []
      const totalFiles = videoPaths.length
      
      for (let i = 0; i < totalFiles; i++) {
        const vPath = videoPaths[i]
        const readPercent = Math.round(((i + 1) / totalFiles) * 100)
        const msg = `Giai doan 1/3: Dang quet thoi luong video (${i + 1}/${totalFiles})...`
        if (await checkPauseAndCancel(msg, readPercent)) return { success: false, message: "Da huy bo tien trinh xu ly!" }
        event.sender.send('join-progress', { message: msg, percent: readPercent })

        const duration = await new Promise<number>((resolve) => {
          ffmpeg.ffprobe(vPath, (err, metadata) => { if (err) resolve(0); else resolve(metadata?.format?.duration || 0) })
        })
        if (duration > 0) videoData.push({ path: vPath, duration })
      }

      if (await checkPauseAndCancel("Dang sap xep va tinh toan phan tap...", 100)) return { success: false, message: "Da huy bo!" }
      event.sender.send('join-progress', { message: `Giai doan 2/3: Dang random hoa va sap xep phan tap...`, percent: 100 })

      let pillars = requirePillar ? videoData.filter(v => v.duration > 600) : []
      let smallVideos = requirePillar ? videoData.filter(v => v.duration <= 600) : [...videoData]

      const shuffleArray = (arr: any[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]
        }
      }
      shuffleArray(pillars); shuffleArray(smallVideos)

      const groups: string[][] = []
      let currentGroup: { path: string; duration: number }[] = []
      let currentDuration = 0

      const finalizeGroup = (group: { path: string; duration: number }[]) => {
        if (group.length === 0) return
        let maxIdx = 0; for (let i = 1; i < group.length; i++) { if (group[i].duration > group[maxIdx].duration) maxIdx = i }
        const longestVideo = group.splice(maxIdx, 1)[0]
        group.unshift(longestVideo)
        groups.push(group.map(g => g.path))
      }

      if (requirePillar && pillars.length > 0) {
        let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration }
      }

      while (smallVideos.length > 0) {
        const nextVideo = smallVideos.pop(); if (!nextVideo) break
        if (currentDuration + nextVideo.duration > maxSecs) {
          if (currentDuration >= minSecs) finalizeGroup([...currentGroup])
          currentGroup = []; currentDuration = 0
          if (requirePillar && pillars.length > 0) { let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration } }
        }
        currentGroup.push(nextVideo); currentDuration += nextVideo.duration
        if (currentDuration >= minSecs && currentDuration <= maxSecs) {
          finalizeGroup([...currentGroup]); currentGroup = []; currentDuration = 0
          if (requirePillar && pillars.length > 0) { let pillar = pillars.pop(); if (pillar) { currentGroup.push(pillar); currentDuration += pillar.duration } }
        }
      }
      if (currentGroup.length > 0 && currentDuration >= minSecs) finalizeGroup(currentGroup)
      if (groups.length === 0) return { success: false, message: "Tong thoi luong video hop le qua it!" }

      const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(videoPaths[0])
      const totalGroups = groups.length
      const hasLogo = logoPath && fs.existsSync(logoPath)
      
      for (let i = 0; i < totalGroups; i++) {
        const group = groups[i]
        const renderPercent = Math.round((i / totalGroups) * 100)
        const msg = `Giai doan 3/3: Dang ma hoa GPU Tap ${i + 1}/${totalGroups}...`

        if (await checkPauseAndCancel(msg, renderPercent)) return { success: false, message: "Da huy bo!" }
        event.sender.send('join-progress', { message: msg, percent: renderPercent })

        const txtContent = group.map(v => `file '${v.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n')
        const txtPath = path.join(finalOutputDir, `temp_list_${i}.txt`)
        fs.writeFileSync(txtPath, txtContent, 'utf-8')

        const outputPath = path.join(finalOutputDir, `KQUA_RENDER_TAP_${i + 1}.mp4`)

        await new Promise<void>((resolve, reject) => {
          let ff = ffmpeg().input(txtPath).inputOptions(['-f concat', '-safe 0'])
          const needReEncode = hasLogo || ratio !== 'original'

          if (needReEncode) {
            let ratioFilter = ''
            if (ratio === '16:9') ratioFilter = 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black'
            else if (ratio === '9:16') ratioFilter = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black'
            else if (ratio === '1:1') ratioFilter = 'scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2:black'

            if (hasLogo) {
              ff.input(logoPath)
              let overlayParams = '25:25'
              if (logoPosition === 'top-right') overlayParams = 'main_w-overlay_w-25:25'
              else if (logoPosition === 'bottom-left') overlayParams = '25:main_h-overlay_h-25'
              else if (logoPosition === 'bottom-right') overlayParams = 'main_w-overlay_w-25:main_h-overlay_h-25'
              const logoFilter = `[1:v]scale=200:200,format=rgba,geq=r='p(X,Y)':g='p(X,Y)':b='p(X,Y)':a='if(lte(hypot(X-100,Y-100),100),alpha(X,Y),0)'[maskedlogo]`
              if (ratio !== 'original') ff.complexFilter([ `[0:v]${ratioFilter}[bg]`, logoFilter, `[bg][maskedlogo]overlay=${overlayParams}` ])
              else ff.complexFilter([ logoFilter, `[0:v][maskedlogo]overlay=${overlayParams}` ])
            } else {
              ff.complexFilter([ `[0:v]${ratioFilter}` ])
            }
            ff.outputOptions([ `-c:v ${videoEncoder}`, '-preset slow', '-profile:v high', '-rc vbr', '-cq 19', '-b:v 0', '-pix_fmt yuv420p', '-c:a copy' ])
          } else {
            ff.outputOptions('-c copy')
          }
          ff.save(outputPath).on('end', () => { if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath); resolve() }).on('error', (err) => { if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath); reject(err) })
        })
      }
      event.sender.send('join-progress', { message: `Hoan thanh!`, percent: 100 })
      return { success: true, message: `Thanh cong! Toan bo tập phim da duoc xu ly.` }
    } catch (err: any) { return { success: false, message: err.message || "Loi he thong" } }
  })

  // --- [IPC] CONVERTER FILE IPC ---
  ipcMain.handle('convert-file', async (event, { inputPath, outputDir, targetExt, subPath }) => {
    try {
      const ext = path.extname(inputPath).toLowerCase()
      const baseName = path.basename(inputPath, ext)
      const finalOutputDir = outputDir && fs.existsSync(outputDir) ? outputDir : path.dirname(inputPath)
      const outputPath = path.join(finalOutputDir, `${baseName}_converted.${targetExt}`)
      if (['.docx', '.pdf'].includes(ext) || ['docx', 'pdf'].includes(targetExt)) {
        return { success: false, message: "Yeu cau API mo rong cho Word/PDF!" }
      }
      return new Promise((resolve) => {
        let ff = ffmpeg(inputPath).setFfmpegPath(ffmpegPath)
        if (subPath && fs.existsSync(subPath)) {
          ff.videoFilters(`subtitles='${subPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'`)
          ff.outputOptions([ `-c:v ${videoEncoder}`, '-preset slow', '-profile:v high', '-rc vbr', '-cq 19', '-b:v 0', '-pix_fmt yuv420p', '-c:a copy' ])
        } else {
          if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext) && ['.mp4', '.mkv', '.avi', '.mov'].includes(`.${targetExt}`)) ff.outputOptions('-c copy')
        }
        ff.save(outputPath)
          .on('progress', (p) => { const pct = p.percent ? Math.round(p.percent) : 0; event.sender.send('convert-progress', { message: `Dang chuyen doi: ${pct}%`, percent: pct }) })
          .on('error', (e) => { resolve({ success: false, message: e.message }) })
          .on('end', () => { resolve({ success: true, message: `Chuyen doi thanh cong!` }) })
      })
    } catch (error: any) { return { success: false, message: error.message } }
  })

  // --- [IPC] CƠ CHẾ TẢI VIDEO ĐA NỀN TẢNG ---
  ipcMain.handle('download-video', async (event, { url, saveDir, resolution, startTime, endTime }) => {
    const finalSaveDir = saveDir && fs.existsSync(saveDir) ? saveDir : app.getPath('downloads')
    const tempDir = path.join(finalSaveDir, `temp_clip_${Date.now()}`)
    const needCut = startTime && endTime

    try {
      const YTDlpWrapClass = (YTDlpWrap as any).default ? (YTDlpWrap as any).default : YTDlpWrap;
      if (!fs.existsSync(ytdlpBinaryPath)) {
        event.sender.send('download-progress', { message: 'Dang khoi tao bo xu ly tai video...', percent: 10 })
        await YTDlpWrapClass.downloadFromGithub(ytdlpBinaryPath)
      }
      const ytdlpWrap = new YTDlpWrapClass(ytdlpBinaryPath)
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
      const outputTemplate = path.join(tempDir, '%(title)s.%(ext)s')

      let formatFilter = 'bv*+ba/b'
      if (resolution === '2160') formatFilter = 'bv*[height<=2160]+ba/b'
      else if (resolution === '1440') formatFilter = 'bv*[height<=1440]+ba/b'
      else if (resolution === '1080') formatFilter = 'bv*[height<=1080]+ba/b'
      else if (resolution === '720') formatFilter = 'bv*[height<=720]+ba/b'

      await new Promise((resolve, reject) => {
        ytdlpWrap.exec([ url, '-o', outputTemplate, '-f', formatFilter, '--ffmpeg-location', ffmpegPath, '--merge-output-format', 'mp4' ])
        .on('progress', (progress) => { event.sender.send('download-progress', { message: needCut ? `Dang tai video nguon: ${progress.percent}%` : `Dang tai video: ${progress.percent}%`, percent: needCut ? Math.round(progress.percent * 0.9) : progress.percent }) })
        .on('error', reject)
        .on('close', resolve)
      })

      const downloadedFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.mp4'))
      if (downloadedFiles.length === 0) throw new Error("Khong lay duoc du lieu file.")
      const downloadedFileName = downloadedFiles[0]
      const downloadedFilePath = path.join(tempDir, downloadedFileName)
      const finalFilePath = path.join(finalSaveDir, downloadedFileName)

      if (needCut) {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(downloadedFilePath).setFfmpegPath(ffmpegPath).outputOptions([ `-ss ${startTime}`, `-to ${endTime}`, '-c copy' ]).save(finalFilePath).on('end', () => resolve()).on('error', (err) => reject(err))
        })
        fs.rmSync(tempDir, { recursive: true, force: true })
        event.sender.send('download-progress', { message: 'Hoan thanh!', percent: 100 })
        return { success: true, message: `Da trich xuat video thanh cong!` }
      } else {
        fs.renameSync(downloadedFilePath, finalFilePath); fs.rmSync(tempDir, { recursive: true, force: true })
        event.sender.send('download-progress', { message: 'Hoan thanh!', percent: 100 })
        return { success: true, message: `Da tai hoan tat video.` }
      }
    } catch (error: any) { if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); return { success: false, message: error.message } }
  })

  // ====================================================================
  // [SIÊU IPC MỚI KÍCH HOẠT] THUẬT TOÁN TRA CỨU APP CLOUD QUA WINGET
  // ====================================================================
  ipcMain.handle('search-apps', async (_event, { query }) => {
    if (!query || query.trim() === '') return []
    return new Promise((resolve) => {
      // Gọi lệnh tìm kiếm bảo mật từ Microsoft Cloud Repository
      exec(`winget search "${query.replace(/"/g, '')}"`, { encoding: 'utf-8' }, (err, stdout) => {
        if (err || !stdout) { resolve([]); return; }
        
        const lines = stdout.split(/\r?\n/)
        const results: { id: string; name: string; icon: string }[] = []
        
        for (let line of lines) {
          const trimmed = line.trim()
          // Bỏ qua dòng tiêu đề và các dòng phân cách gạch ngang
          if (!trimmed || trimmed.startsWith('Name') || trimmed.startsWith('---') || trimmed.includes('…')) continue
          
          // Phân tách dữ liệu theo cột (cách nhau từ 2 khoảng trắng trở lên)
          const parts = trimmed.split(/\s{2,}/)
          if (parts.length >= 2) {
            // Chặn các câu thông báo lỗi hệ thống từ Winget
            if (parts[0].toLowerCase().includes('no package found') || parts[0].toLowerCase().includes('không tìm thấy')) continue
            
            results.push({
              name: parts[0],
              id: parts[1],
              icon: '📦' // Đóng mác icon hộp đóng gói mặc định cho app tìm thấy
            })
          }
        }
        // Trả về tối đa 12 kết quả phù hợp nhất để tối ưu giao diện bento grid
        resolve(results.slice(0, 12))
      })
    })
  })

  // ====================================================================
  // TÁCH GIAI ĐOẠN CHI TIẾT & PHẦN TRĂM REALTIME CHO WINGET
  // ====================================================================
  ipcMain.handle('install-selected-apps', async (event, { appIds }) => {
    if (!appIds || appIds.length === 0) return { success: false, message: "No apps selected" }
    if (process.platform !== 'win32') return { success: false, message: "Tính năng này chỉ hỗ trợ trên Windows!" }

    const totalApps = appIds.length

    for (let i = 0; i < totalApps; i++) {
      const appId = appIds[i]
      let currentStage = 'Khởi động'
      let stagePercent = 0

      await new Promise<void>((resolve) => {
        const child = spawn('winget', [
          'install', appId, '--silent', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity'
        ])

        child.stdout.on('data', (data) => {
          const output = data.toString()
          
          if (output.includes('Download') || output.includes('Tải') || output.includes('download')) {
            currentStage = 'Tải xuống'
          } else if (output.includes('Install') || output.includes('Cài') || output.includes('install') || output.includes('hash')) {
            currentStage = 'Cài đặt ngầm'
          }

          const match = output.match(/(\d+)%/)
          if (match) {
            stagePercent = parseInt(match[1], 10)
          } else {
            if (currentStage === 'Cài đặt ngầm' && stagePercent < 90) {
              stagePercent += 5 
            }
          }

          const globalPercent = Math.round(((i / totalApps) * 100) + (stagePercent / totalApps))

          event.sender.send('install-apps-progress', { 
            appIndex: i + 1,
            totalApps: totalApps,
            appName: appId,
            stage: currentStage,
            stagePercent: stagePercent,
            globalPercent: globalPercent > 100 ? 100 : globalPercent
          })
        })

        child.on('close', () => {
          resolve()
        })
      })
    }

    event.sender.send('install-apps-progress', { message: 'Hoàn thành!', percent: 100 })
    return { success: true, message: "Toàn bộ các phần mềm đã được cài đặt tự động hoàn toàn vào hệ thống của bạn." }
  })

  createWindow()
  app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })