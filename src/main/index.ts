/* eslint-disable */
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import * as path from 'path'
import icon from '../../resources/icon.png?asset'
import { execSync } from 'child_process'

// ====================================================================
// IMPORT CHUẨN ĐỒNG BỘ ĐỦ 9 CHỨC NĂNG CHÍNH + 1 LÕI HỆ THỐNG
// ====================================================================
import { registerSystemHandlers } from './ipc/systemHandlers'
import { registerJoinerHandlers } from './ipc/joinerHandlers'
import { registerDownloaderHandlers } from './ipc/downloaderHandlers'
import { registerConverterHandlers } from './ipc/converterHandlers'
import { registerTtsHandlers } from './ipc/ttsHandlers'
import { registerRenamerHandlers } from './ipc/renamerHandlers'
import { registerInstallerHandlers } from './ipc/installerHandlers'
import { registerUninstallerHandlers } from './ipc/uninstallerHandlers'
import { registerCleanerHandlers } from './ipc/cleanerHandlers'
import { registerUpdateHandlers } from './ipc/updateHandlers'
import { registerChatbotHandlers } from './ipc/chatbotHandlers'
import { registerPublisherHandlers } from './ipc/publisherHandlers'

// ====================================================================
// XUẤT KHẨU BIẾN TOÀN CỤC ĐỂ CÁC FILE TRONG THƯ MỤC IPC TRUY XUẤT CHUNG
// ====================================================================
export let ffmpegPath: string = ''
export let ffprobePath: string = ''
export let videoEncoder: string = 'libx264' 

// 🚀 ÉP ELECTRON/CHROMIUM IM LẶNG: Chỉ in log khi App bị sập (Crash), bỏ qua toàn bộ cảnh báo menu vặt vẹo của macOS
app.commandLine.appendSwitch('log-level', '3');
app.commandLine.appendSwitch('disable-features', 'TouchBar,VisualDebugger');

const getBinaryPath = (packageName: string, binaryName: string, subPath: string = ''): string => {
  const isDev = !app.isPackaged
  const rootDir = isDev ? app.getAppPath() : app.getAppPath().replace('app.asar', 'app.asar.unpacked')
  return path.join(rootDir, 'node_modules', packageName, subPath, binaryName)
}

// Định hình đường dẫn FFmpeg lõi cứng đa nền tảng
const isWin = process.platform === 'win32'
ffmpegPath = getBinaryPath('ffmpeg-static', isWin ? 'ffmpeg.exe' : 'ffmpeg')
ffprobePath = getBinaryPath('ffprobe-static', isWin ? 'ffprobe.exe' : 'ffprobe', isWin ? 'bin/win32/x64' : '')

if (process.platform === 'darwin') {
  const brewFfmpegArm = '/opt/homebrew/bin/ffmpeg'
  const brewFfprobeArm = '/opt/homebrew/bin/ffprobe'
  const brewFfmpegIntel = '/usr/local/bin/ffmpeg'
  const brewFfprobeIntel = '/usr/local/bin/ffprobe'

  if (fs.existsSync(brewFfmpegArm)) { ffmpegPath = brewFfmpegArm; ffprobePath = brewFfprobeArm }
  else if (fs.existsSync(brewFfmpegIntel)) { ffmpegPath = brewFfmpegIntel; ffprobePath = brewFfprobeIntel }
}

// Đo đạc phần cứng thiết bị để kích hoạt ép xung GPU khi Render phim kịch bản
if (isWin) {
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

// ====================================================================
// ĐĂNG KÝ CỔNG IPC MỞ CỬA SỔ CHỌN FILE (NATIVE DIALOG)
// ====================================================================
ipcMain.handle('select-multiple-videos', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Chọn Video Cần Đăng (Có thể chọn nhiều)',
    properties: ['openFile', 'multiSelections'], // Cho phép bôi đen chọn hàng loạt file
    filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'm4v'] }]
  });

  if (canceled) return [];

  // Trả về thẳng đường dẫn gốc tuyệt đối cho Frontend
  return filePaths.map(filePath => ({
    name: path.basename(filePath),
    path: filePath
  }));
});

// ====================================================================
// KHỞI TẠO CỬA SỔ GIAO DIỆN KHUNG ỨNG DỤNG (WINDOW INITIALIZATION)
// ====================================================================
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 860,
    minWidth: 1200,
    minHeight: 750,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#00000000',      
      symbolColor: '#71717a', 
      height: 38             
    },
    title: 'CREATOR HUB',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => { mainWindow.show() })
  
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ====================================================================
// KÍCH HOẠT HỆ THỐNG VÀ NẠP TRỌN BỘ 9 CORE MODULES
// ====================================================================
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => { optimizer.watchWindowShortcuts(window) })

  // Đăng ký đồng loạt các cổng lắng nghe IPC Backend biệt lập
  registerSystemHandlers()
  registerJoinerHandlers()
  registerDownloaderHandlers()
  registerConverterHandlers()
  registerTtsHandlers()
  registerRenamerHandlers()
  registerInstallerHandlers()
  registerUninstallerHandlers()
  registerCleanerHandlers()
  registerUpdateHandlers()
  registerChatbotHandlers()
  registerPublisherHandlers()

  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})