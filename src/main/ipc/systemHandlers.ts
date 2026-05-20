/* eslint-disable */
import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { spawn, exec } from 'child_process'
import ffmpeg from 'fluent-ffmpeg'

export function registerSystemHandlers() {
  ipcMain.handle('get-platform', () => process.platform)

  const getMacBrewPath = (): string | null => {
    if (process.platform !== 'darwin') return null
    if (fs.existsSync('/opt/homebrew/bin/brew')) return '/opt/homebrew/bin/brew' 
    if (fs.existsSync('/usr/local/bin/brew')) return '/usr/local/bin/brew'     
    return null
  }

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

      child.stdout.on('data', (data: any) => {
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

  ipcMain.handle('open-file-dialog', async (_event, allowedExtensions: any) => {
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

  ipcMain.handle('scan-folder', async (_event, folderPath: string) => {
    if (!folderPath) return []
    try {
      const stat = fs.statSync(folderPath); let directoryToScan = folderPath; if (stat.isFile()) directoryToScan = path.dirname(folderPath)
      const allFiles = fs.readdirSync(directoryToScan); const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov']
      return allFiles.filter(file => videoExtensions.includes(path.extname(file).toLowerCase())).map(file => path.join(directoryToScan, file))
    } catch (error) { return [] }
  })
}