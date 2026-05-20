/* eslint-disable */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import { spawn, exec } from 'child_process'

export function registerInstallerHandlers() {
  const getMacBrewPath = (): string | null => {
    if (process.platform !== 'darwin') return null
    if (fs.existsSync('/opt/homebrew/bin/brew')) return '/opt/homebrew/bin/brew' 
    if (fs.existsSync('/usr/local/bin/brew')) return '/usr/local/bin/brew'     
    return null
  }

  ipcMain.handle('search-apps', async (_event, { query }: any) => {
    if (!query || query.trim() === '') return []
    if (process.platform === 'darwin') {
      const brewPath = getMacBrewPath(); if (!brewPath) return [] 
      return new Promise((resolve) => { exec(`"${brewPath}" search --casks "${query.replace(/"/g, '')}"`, { encoding: 'utf-8' }, (err, stdout) => { if (err || !stdout) { resolve([]); return; }; const lines = stdout.split(/\r?\n/); const results: { id: string; name: string; icon: string }[] = []; for (let line of lines) { const trimmed = line.trim(); if (!trimmed || trimmed.includes('==>') || trimmed.includes('Error')) continue; results.push({ name: trimmed, id: trimmed, icon: '🍎' }) }; resolve(results.slice(0, 12)) }) })
    }
    return new Promise((resolve) => { exec(`winget search "${query.replace(/"/g, '')}"`, { encoding: 'utf-8' }, (err, stdout) => { if (err || !stdout) { resolve([]); return; }; const lines = stdout.split(/\r?\n/); const results: { id: string; name: string; icon: string }[] = []; for (let line of lines) { const trimmed = line.trim(); if (!trimmed || trimmed.startsWith('Name') || trimmed.startsWith('---') || trimmed.includes('…')) continue; const parts = trimmed.split(/\s{2,}/); if (parts.length >= 2) { if (parts[0].toLowerCase().includes('no package found') || parts[0].toLowerCase().includes('không tìm thấy')) continue; results.push({ name: parts[0], id: parts[1], icon: '📦' }) } }; resolve(results.slice(0, 12)) }) })
  })

  ipcMain.handle('install-selected-apps', async (event, { appIds }: any) => {
    if (!appIds || appIds.length === 0) return { success: false, message: "No apps selected" }
    
    if (process.platform === 'darwin') {
      const brewPath = getMacBrewPath(); if (!brewPath) { return { success: false, message: "Không tìm thấy Homebrew trên máy Mac của bạn." } }
      const totalApps = appIds.length; let successCount = 0; let lastError = ""

      for (let i = 0; i < totalApps; i++) {
        const appId = appIds[i]; let stagePercent = 20
        await new Promise<void>((resolve) => {
          event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage: 'Đang kết nối Homebrew Cloud...', stagePercent, globalPercent: Math.round((i / totalApps) * 100) })
          const child = spawn(brewPath, ['install', '--cask', appId], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: '1' } })
          
          let errLog = ''
          child.stdout.on('data', (data: any) => { 
            const output = data.toString(); let stage = 'Đang tải xuống tệp cài đặt...'
            if (output.includes('Downloading')) { stagePercent = 50; stage = 'Đang tải dữ liệu ứng dụng...' } 
            else if (output.includes('Installing') || output.includes('Staging')) { stagePercent = 85; stage = 'Đang giải nén và chép đè hệ thống...' }
            const globalPercent = Math.round(((i / totalApps) * 100) + (stagePercent / totalApps))
            event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage, stagePercent, globalPercent }) 
          })
          child.stderr.on('data', (data: any) => { errLog += data.toString() })
          child.on('close', (code: any) => { 
            if (code === 0 || errLog.includes('already installed') || errLog.includes('successfully installed')) successCount++
            else lastError = errLog || "Lỗi quyền đọc ghi hệ thống."
            resolve() 
          })
        })
      }
      event.sender.send('install-apps-progress', { message: 'Hoàn thành!', percent: 100 })
      if (successCount === totalApps) return { success: true, message: "Thành công! Toàn bộ các phần mềm đã được nạp gọn vào mục Applications." }
      return { success: false, message: `Cài đặt bị gián đoạn (${successCount}/${totalApps} thành công).\n\nChi tiết lỗi từ hệ điều hành:\n${lastError}` }
    }

    const totalApps = appIds.length; let successCount = 0; let lastError = ""

    for (let i = 0; i < totalApps; i++) {
      const appId = appIds[i]; let currentStage = 'Khởi động'; let stagePercent = 0
      await new Promise<void>((resolve) => {
        const child = spawn('winget', ['install', appId, '--silent', '--force', '--accept-source-agreements', '--accept-package-agreements', '--disable-interactivity'])
        let errLog = ''
        child.stdout.on('data', (data: any) => { 
          const output = data.toString()
          if (output.includes('Download') || output.includes('Tải') || output.includes('download')) { currentStage = 'Tải xuống' } 
          else if (output.includes('Install') || output.includes('Cài') || output.includes('install') || output.includes('hash')) { currentStage = 'Cài đặt ngầm' }
          const match = output.match(/(\d+)%/)
          if (match) { stagePercent = parseInt(match[1], 10) } else { if (currentStage === 'Cài đặt ngầm' && stagePercent < 90) { stagePercent += 5 } }
          const globalPercent = Math.round(((i / totalApps) * 100) + (stagePercent / totalApps))
          event.sender.send('install-apps-progress', { appIndex: i + 1, totalApps, appName: appId, stage: currentStage, stagePercent, globalPercent: globalPercent > 100 ? 100 : globalPercent }) 
        })
        child.stderr.on('data', (data: any) => { errLog += data.toString() })
        child.on('close', (code: any) => { 
          if (code === 0 || errLog.includes('already installed')) successCount++
          else lastError = errLog || `Mã lỗi Winget: ${code}`
          resolve() 
        })
      })
    }
    event.sender.send('install-apps-progress', { message: 'Hoàn thành!', percent: 100 })
    if (successCount === totalApps) return { success: true, message: "Toàn bộ các phần mềm đã được cài đặt tự động ngầm hoàn toàn vào máy tính của bạn." }
    return { success: false, message: `Quá trình cài đặt bị gián đoạn (${successCount}/${totalApps} thành công).\n\nChi tiết lỗi:\n${lastError}` }
  })
}