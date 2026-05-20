/* eslint-disable */
import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

export function registerCleanerHandlers() {
  const calculateFolderSize = (dirPath: string): number => {
    if (!fs.existsSync(dirPath)) return 0
    try {
      const stats = fs.statSync(dirPath)
      if (stats.isFile()) return stats.size

      if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-ChildItem -LiteralPath '${dirPath.replace(/'/g, "''")}' -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`
        const output = execSync(cmd, { encoding: 'utf-8', timeout: 6000 })
        const size = parseInt(output.trim(), 10)
        return isNaN(size) ? 0 : size
      }

      let totalSize = 0
      const files = fs.readdirSync(dirPath)
      for (const file of files) { totalSize += calculateFolderSize(path.join(dirPath, file)) }
      return totalSize
    } catch { return 0 }
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

  ipcMain.handle('scan-system-junk', async () => {
    const junkData: { id: string; name: string; desc: string; size: number; path: string }[] = []; const homeDir = app.getPath('home')
    if (process.platform === 'win32') { const localAppData = process.env.LOCALAPPDATA || ''; const winTemp = 'C:\\Windows\\Temp'; const userTemp = path.join(localAppData, 'Temp'); const capcutCache = path.join(localAppData, 'CapCut\\User Data\\Cache'); const chromeCache = path.join(localAppData, 'Google\\Chrome\\User Data\\Default\\Cache'); junkData.push({ id: 'sys_temp', name: 'Tệp tin hệ thống tạm thời (Windows Temp)', desc: 'Các file rác sinh ra trong quá trình Windows vận hành.', size: calculateFolderSize(winTemp) + calculateFolderSize(userTemp), path: userTemp }); junkData.push({ id: 'capcut_cache', name: 'Bộ nhớ đệm CapCut / TikTok Editor Cache', desc: 'File đệm video, hiệu ứng, âm thanh do CapCut tải về.', size: calculateFolderSize(capcutCache), path: capcutCache }); junkData.push({ id: 'chrome_cache', name: 'Bộ nhớ đệm Trình duyệt (Google Chrome Cache)', desc: 'Lịch sử hình ảnh, cookie đệm trang web giúp lướt web nhanh.', size: calculateFolderSize(chromeCache), path: chromeCache }) } 
    else if (process.platform === 'darwin') { const macTemp = path.join(homeDir, 'Library/Caches'); const capcutCache = path.join(homeDir, 'Library/Caches/com.lemon.lvpro'); const chromeCache = path.join(homeDir, 'Library/Caches/Google/Chrome/Default/Cache'); const safariCache = path.join(homeDir, 'Library/Caches/com.apple.Safari'); const sysLogs = path.join(homeDir, 'Library/Logs'); junkData.push({ id: 'sys_temp', name: 'Tệp đệm ứng dụng hệ thống (Mac System Caches)', desc: 'Tệp tin đệm logs và bộ nhớ tạm của macOS.', size: calculateFolderSize(macTemp) - calculateFolderSize(capcutCache) - calculateFolderSize(chromeCache), path: macTemp }); junkData.push({ id: 'capcut_cache', name: 'Bộ nhớ đệm CapCut / TikTok Mac Cache', desc: 'File video nháp, proxy và dữ liệu hiệu ứng âm thanh ngầm.', size: calculateFolderSize(capcutCache), path: capcutCache }); junkData.push({ id: 'browser_cache', name: 'Bộ nhớ tạm Trình duyệt (Chrome & Safari Cache)', desc: 'File hình ảnh, mã nguồn web lưu tạm của Chrome và Safari.', size: calculateFolderSize(chromeCache) + calculateFolderSize(safariCache), path: chromeCache }); junkData.push({ id: 'sys_logs', name: 'Nhật ký hệ thống (System Logs File)', desc: 'Các tệp log báo cáo lỗi và lịch sử đóng mở ứng dụng.', size: calculateFolderSize(sysLogs), path: sysLogs }) }
    return junkData
  })

  ipcMain.handle('execute-system-clean', async (_event, { targets }: any) => {
    if (!targets || targets.length === 0) return { success: false, message: "Không có mục tiêu nào được chọn để dọn dẹp!" }
    try { for (const targetPath of targets) { if (fs.existsSync(targetPath)) { clearFolderContents(targetPath) } }; return { success: true, message: "Hệ thống đã dọn dẹp sạch sẽ toàn bộ các file đệm rác! Ổ cứng của bạn đã được giải phóng bộ nhớ." } } catch (err: any) { return { success: false, message: `Lỗi trong quá trình dọn rác: ${err.message}` } }
  })
}