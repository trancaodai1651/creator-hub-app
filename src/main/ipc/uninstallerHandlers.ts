/* eslint-disable */
import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os' // 🚀 ĐÃ BỔ SUNG: Thư viện OS chuẩn để định vị thư mục đa nền tảng
import { exec } from 'child_process'

export function registerUninstallerHandlers() {
  
  // ====================================================================
  // 🔍 1. LUỒNG QUÉT ỨNG DỤNG ĐA NỀN TẢNG (WINDOWS & MAC)
  // ====================================================================
  ipcMain.handle('get-system-installed-apps', async () => {
    if (process.platform === 'win32') { 
      return new Promise((resolve) => { 
        const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$regPaths = @('HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall', 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall'); $apps = foreach ($path in $regPaths) { if (Test-Path $path) { Get-ChildItem $path -ErrorAction SilentlyContinue | ForEach-Object { try { $name = $_.GetValue('DisplayName'); if ($name) { [PSCustomObject]@{ name = $name; path = $_.GetValue('UninstallString'); version = $_.GetValue('DisplayVersion'); publisher = $_.GetValue('Publisher') } } } catch {} } } }; if ($apps) { $apps | ConvertTo-Json -Compress } else { '[]' }"`
        exec(psCmd, { maxBuffer: 1024 * 1024 * 20, timeout: 8000 }, (err, stdout) => { 
          if (err || !stdout) { resolve([]); return } 
          try { resolve(Array.isArray(JSON.parse(stdout)) ? JSON.parse(stdout) : [JSON.parse(stdout)]) } catch { resolve([]) } 
        }) 
      }) 
    }
    
    // 🍏 [MAC UPGRADE]: Quét diện rộng toàn bộ 3 phân vùng cài đặt của macOS
    if (process.platform === 'darwin') { 
      const apps: any[] = []
      const scanDirs = [
        '/Applications', 
        path.join(os.homedir(), 'Applications'), 
        '/System/Applications'
      ]
      
      scanDirs.forEach((dir) => { 
        if (fs.existsSync(dir)) { 
          fs.readdirSync(dir).forEach((file) => { 
            if (file.endsWith('.app')) { 
              apps.push({ name: file.replace('.app', ''), path: path.join(dir, file), version: 'N/A', publisher: 'macOS App' }) 
            } 
          }) 
        } 
      })
      return apps 
    }
    return []
  })

  // ====================================================================
  // 🚀 2. LUỒNG GỠ BỎ TẬN GỐC THÔNG MINH CHO CẢ 2 HỆ ĐIỀU HÀNH
  // ====================================================================
  ipcMain.handle('execute-clean-uninstall', async (event, { appPath, appName, mode }: any) => {
    if (!appPath) return { success: false, message: "Đường dẫn trình gỡ bỏ không hợp lệ!" }
    
    const rawProcessName = appName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')
    const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, '')

    // 🪟 LUỒNG XỬ LÝ DÀNH CHO WINDOWS (Giữ nguyên thuật toán Radar cực mạnh)
    if (process.platform === 'win32') {
      return new Promise(async (resolve) => {
        try {
          // BƯỚC 1: Windows Mở bộ cài và đợi
          event.sender.send('uninstall-step-progress', { step: 1, message: `Bước 1/3: Vui lòng thực hiện gỡ ứng dụng trên cửa sổ Windows...`, percent: 25 })

          let executeCmd = appPath
          if (!appPath.toLowerCase().includes('msiexec')) { executeCmd = `cmd /c start "" ${appPath}` }
          try { exec(executeCmd) } catch (e) { console.error(e) }

          if (mode === 'basic') {
            await new Promise(res => setTimeout(res, 4000))
            event.sender.send('uninstall-step-progress', { step: 3, message: 'Hoàn thành!', percent: 100 })
            resolve({ success: true, message: `Ứng dụng [${appName}] đã gỡ cơ bản.` })
            return
          }

          let isAppStillRunning = true
          let retryCount = 0
          let userAborted = false
          let forceContinue = false

          const actionHandler = (_e: any, data: any) => {
            if (data.action === 'abort') userAborted = true
            if (data.action === 'continue') forceContinue = true
          }
          ipcMain.on('uninstaller-action', actionHandler)

          await new Promise(res => setTimeout(res, 3000))

          while (isAppStillRunning && retryCount < 120 && !userAborted && !forceContinue) {
            retryCount++
            const checkCmd = `powershell -NoProfile -Command "Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.ProcessName -notmatch '(?i)electron|creator' -and ($_.ProcessName -match '(?i)^unins.*|^au_.*|^uninstall.*|^msiexec.*' -or $_.MainWindowTitle -match '(?i)uninstall|remove|gỡ|${rawProcessName}') } | Select-Object -First 1"`
            
            await new Promise<void>((nextCheck) => {
              exec(checkCmd, (err, stdout) => {
                if (err || !stdout || stdout.trim() === "") isAppStillRunning = false
                nextCheck()
              })
            })

            if (isAppStillRunning && !userAborted && !forceContinue) { await new Promise(res => setTimeout(res, 1500)) }
          }

          ipcMain.removeListener('uninstaller-action', actionHandler)

          if (userAborted) {
            resolve({ success: false, aborted: true, message: 'Người dùng đã hủy tiến trình.' })
            return
          }

          // BƯỚC 2: Windows Quét Registry
          event.sender.send('uninstall-step-progress', { step: 2, message: 'Đang tự động quét sâu dọn sạch Registry...', percent: 60 })
          await new Promise(res => setTimeout(res, 1200)) 

          await new Promise<void>((nextStep) => {
            const cleanRegistryCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$targets = @('HKCU:\\Software\\${safeAppName}', 'HKLM:\\Software\\${safeAppName}', 'HKLM:\\Software\\Wow6432Node\\${safeAppName}'); foreach ($target in $targets) { if (Test-Path $target) { Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue } }"`
            exec(cleanRegistryCmd, { timeout: 5000 }, () => nextStep())
          })

          // BƯỚC 3: Windows Dọn ổ đĩa
          const localAppData = process.env.LOCALAPPDATA || ''
          const appData = process.env.APPDATA || ''
          const residualPaths = [
            { name: 'Program Files Core', path: path.join('C:\\Program Files', appName) },
            { name: 'Program Files (x86)', path: path.join('C:\\Program Files (x86)', appName) },
            { name: 'Local AppData Residuals', path: path.join(localAppData, appName) },
            { name: 'Roaming AppData Cache', path: path.join(appData, appName) }
          ]

          let index = 0
          for (const item of residualPaths) {
            index++
            const currentPercent = 60 + index * 9 
            event.sender.send('uninstall-step-progress', { step: 3, message: `Đang tự động dọn sạch vùng nhớ: ${item.name}...`, percent: currentPercent })
            await new Promise(res => setTimeout(res, 800))
            if (fs.existsSync(item.path)) {
              try { await fs.promises.rm(item.path, { recursive: true, force: true }) } catch (e) {}
            }
          }

          event.sender.send('uninstall-step-progress', { step: 3, message: 'Hoàn thành dọn dẹp tận gốc!', percent: 100 })
          await new Promise(res => setTimeout(res, 600)) 
          
          resolve({ success: true, message: `Tuyệt vời! Ứng dụng [${appName}] đã được dọn sạch hoàn toàn tận gốc rễ.` })

        } catch (err: any) { resolve({ success: false, message: err.message }) }
      })
    }

    // ====================================================================
    // 🍏 [MAC UPGRADE]: CỖ MÁY GỠ CÀI ĐẶT TẬN GỐC DÀNH RIÊNG CHO MACOS
    // ====================================================================
    if (process.platform === 'darwin') {
      try {
        // Bước 1: Xóa file .app (Giống gỡ cơ bản)
        event.sender.send('uninstall-step-progress', { step: 1, message: 'Bước 1/3: Đang xóa tệp tin cốt lõi .app...', percent: 35 })
        if (fs.existsSync(appPath)) { fs.rmSync(appPath, { recursive: true, force: true }) }
        
        if (mode === 'basic') {
          event.sender.send('uninstall-step-progress', { step: 3, message: 'Hoàn thành!', percent: 100 })
          return { success: true, message: `Đã xóa tệp tin ứng dụng chính [${appName}].` }
        }

        // Bước 2: Báo hiệu quét ổ đĩa
        await new Promise(res => setTimeout(res, 1200))
        event.sender.send('uninstall-step-progress', { step: 2, message: 'Bước 2/3: Đang phân tích tàn dư hệ thống trong Library...', percent: 65 })

        // Bước 3: Thuật toán quét và xóa tàn dư rác cứng đầu của Mac theo tên
        const userHome = os.homedir()
        const cleanTargets = [
          path.join(userHome, 'Library/Application Support'),
          path.join(userHome, 'Library/Caches'),
          path.join(userHome, 'Library/Preferences'), // Chứa các file .plist cực nặng
          path.join(userHome, 'Library/Saved Application State')
        ]

        await new Promise(res => setTimeout(res, 1000))
        event.sender.send('uninstall-step-progress', { step: 3, message: 'Bước 3/3: Đang dọn sạch Cache, Config & Preferences...', percent: 85 })

        cleanTargets.forEach((targetDir) => {
          if (fs.existsSync(targetDir)) {
            const files = fs.readdirSync(targetDir)
            files.forEach(file => {
              // Nếu tên thư mục/file cấu hình có chứa tên App -> Trảm lập tức!
              if (file.toLowerCase().includes(appName.toLowerCase())) {
                try { fs.rmSync(path.join(targetDir, file), { recursive: true, force: true }) } catch(e){}
              }
            })
          }
        })
        
        await new Promise(res => setTimeout(res, 800))
        event.sender.send('uninstall-step-progress', { step: 3, message: 'Hoàn thành dọn dẹp tận gốc!', percent: 100 })
        
        return { success: true, message: `Tuyệt vời! Ứng dụng [${appName}] và mọi file rác ẩn đã được dọn sạch khỏi hệ thống Mac.` }
      } catch (err: any) { 
        return { success: false, message: err.message } 
      }
    }

    return { success: false, message: "Hệ điều hành không hỗ trợ!" }
  })
}