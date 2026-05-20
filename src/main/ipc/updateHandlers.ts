/* eslint-disable */
import { ipcMain, app, shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { exec, spawn } from 'child_process'

export function registerUpdateHandlers() {
  
  ipcMain.handle('trigger-auto-update', async (event, { downloadUrl, fileName, language }: any) => {
    try {
      const isVi = language !== 'en'
      const tempDir = app.getPath('temp')
      const tempDownloadPath = path.join(tempDir, fileName)
      
      // 1. TẢI FILE TỪ GITHUB
      const response = await (globalThis as any).fetch(downloadUrl)
      if (!response.ok) throw new Error(isVi ? 'Không thể kết nối máy chủ GitHub!' : 'Cannot connect to GitHub servers!')
      
      const totalBytes = parseInt(response.headers.get('content-length') || '0', 10)
      let downloadedBytes = 0
      const fileStream = fs.createWriteStream(tempDownloadPath)
      
      for await (const chunk of response.body as any) {
        fileStream.write(chunk)
        downloadedBytes += chunk.length
        if (totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100)
          const msg = isVi 
            ? `Đang tải gói cập nhật: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB)`
            : `Downloading update package: ${percent}% (${(downloadedBytes / 1024 / 1024).toFixed(1)}MB / ${(totalBytes / 1024 / 1024).toFixed(1)}MB)`
          event.sender.send('update-progress', { message: msg, percent })
        }
      }
      fileStream.end()

      // ====================================================================
      // 🪟 XỬ LÝ CẬP NHẬT CHO WINDOWS (.exe)
      // ====================================================================
      if (process.platform === 'win32') {
        event.sender.send('update-progress', { message: isVi ? 'Tải về hoàn tất! Đang khởi động trình cài đặt...' : 'Download complete! Starting installer...', percent: 100 })
        setTimeout(async () => {
          try {
            await shell.openPath(tempDownloadPath)
            setTimeout(() => { app.quit() }, 600)
          } catch (openErr) {
            event.sender.send('update-progress', { message: isVi ? 'Lỗi kích hoạt bộ cài!' : 'Failed to launch installer!', percent: 0 })
          }
        }, 1000)
      } 
      
      // ====================================================================
      // 🍏 XỬ LÝ CẬP NHẬT CHO MACOS (.zip chứa .app)
      // ====================================================================
      else if (process.platform === 'darwin') {
        event.sender.send('update-progress', { message: isVi ? 'Đang giải nén bản cập nhật...' : 'Extracting update...', percent: 99 })
        
        const extractPath = path.join(tempDir, 'CreatorHub_Update_Extract')
        if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true })
        fs.mkdirSync(extractPath, { recursive: true })

        // Gọi lệnh Unzip gốc của macOS
        exec(`unzip -o "${tempDownloadPath}" -d "${extractPath}"`, (err) => {
          if (err) {
            event.sender.send('update-progress', { message: isVi ? 'Lỗi giải nén tệp Zip!' : 'Zip extraction failed!', percent: 0 })
            return
          }

          // Tìm thư mục .app bên trong cục Zip vừa giải nén
          const files = fs.readdirSync(extractPath)
          const appFolder = files.find(f => f.endsWith('.app'))
          if (!appFolder) {
            event.sender.send('update-progress', { message: isVi ? 'Không tìm thấy tệp .app!' : 'No .app found in zip!', percent: 0 })
            return
          }

          const newAppPath = path.join(extractPath, appFolder)
          
          // Lấy đường dẫn của ứng dụng đang chạy (VD: /Applications/Creator Hub.app)
          const currentExe = app.getPath('exe') // Sẽ trả về /Applications/Creator Hub.app/Contents/MacOS/Creator Hub
          const currentAppPath = currentExe.substring(0, currentExe.indexOf('.app') + 4)

          event.sender.send('update-progress', { message: isVi ? 'Đang hoán đổi dữ liệu ứng dụng...' : 'Applying update...', percent: 100 })

          // Tạo tệp lệnh Bash Script trói quyền Độc lập (Detached)
          const scriptPath = path.join(tempDir, 'update_mac.sh')
          const scriptContent = `
#!/bin/bash
# Đợi 2 giây cho ứng dụng hiện tại thoát hoàn toàn
sleep 2

# Xóa bản cũ
rm -rf "${currentAppPath}"

# Copy bản mới vào vị trí cũ
cp -R "${newAppPath}" "${currentAppPath}"

# Mở lại phần mềm
open "${currentAppPath}"
          `.trim()

          // Cấp quyền thực thi cho Script
          fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 })

          // Chạy Script ngầm (tách biệt hoàn toàn khỏi vòng đời của Electron)
          const child = spawn('bash', [scriptPath], { detached: true, stdio: 'ignore' })
          child.unref()

          // Đóng ứng dụng hiện tại để Bash Script làm việc
          setTimeout(() => { app.quit() }, 500)
        })
      }

      return { success: true }
    } catch (err: any) { 
      return { success: false, message: err.message } 
    }
  })
}