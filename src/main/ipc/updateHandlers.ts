/* eslint-disable */
import { ipcMain, app, shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { exec, spawn } from 'child_process'

export function registerUpdateHandlers() {
  
  // =========================================================
  // 1. KIỂM TRA PHIÊN BẢN TỪ GITHUB RELEASES
  // =========================================================
  ipcMain.handle('check-for-updates', async () => {
    try {
      // Gọi API công khai của GitHub để lấy bản Release mới nhất
      // Thay 'trancaodai1651/creator-hub-app' bằng đúng Username/Repo của bạn
      const response = await fetch('https://api.github.com/repos/trancaodai1651/creator-hub-app/releases/latest');
      
      if (!response.ok) {
        throw new Error('Không thể kết nối đến GitHub API');
      }

      const releaseData = await response.json();
      const latestVersion = releaseData.tag_name.replace('v', ''); // Lấy "1.1.1" từ "v1.1.1"
      const currentVersion = app.getVersion();

      // Nếu phát hiện phiên bản trên mạng lớn hơn phiên bản hiện tại
      if (latestVersion !== currentVersion) {
        // Tìm file cài đặt tương ứng với hệ điều hành hiện tại
        let asset;
        if (process.platform === 'win32') {
          asset = releaseData.assets.find((a: any) => a.name.endsWith('.exe'));
        } else if (process.platform === 'darwin') {
          asset = releaseData.assets.find((a: any) => a.name.endsWith('.zip'));
        }

        if (asset) {
          return {
            hasUpdate: true,
            latestVersion: latestVersion,
            currentVersion: currentVersion,
            releaseNotes: releaseData.body || 'Bản cập nhật tối ưu hóa hiệu suất và sửa lỗi hệ thống.',
            downloadUrl: asset.browser_download_url,
            fileName: asset.name
          };
        }
      }

      // Nếu không có bản mới hoặc không tìm thấy file cài phù hợp
      return { hasUpdate: false, currentVersion: currentVersion };

    } catch (error: any) {
      console.error('Lỗi check update:', error);
      return { error: true, message: error.message };
    }
  });

  // =========================================================
  // 2. KÍCH HOẠT TẢI XUỐNG VÀ CÀI ĐẶT
  // =========================================================
  ipcMain.handle('trigger-auto-update', async (event, { downloadUrl, fileName, language }: any) => {
    try {
      const isVi = language !== 'en'
      const tempDir = app.getPath('temp')
      const tempDownloadPath = path.join(tempDir, fileName)
      
      // TẢI FILE TỪ GITHUB
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
          const currentExe = app.getPath('exe')
          const currentAppPath = currentExe.substring(0, currentExe.indexOf('.app') + 4)

          event.sender.send('update-progress', { message: isVi ? 'Đang hoán đổi dữ liệu ứng dụng...' : 'Applying update...', percent: 100 })

          // Tạo tệp lệnh Bash Script trói quyền Độc lập (Detached)
          const scriptPath = path.join(tempDir, 'update_mac.sh')
          const scriptContent = `
#!/bin/bash
sleep 2
rm -rf "${currentAppPath}"
cp -R "${newAppPath}" "${currentAppPath}"
open "${currentAppPath}"
          `.trim()

          fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 })
          const child = spawn('bash', [scriptPath], { detached: true, stdio: 'ignore' })
          child.unref()
          setTimeout(() => { app.quit() }, 500)
        })
      }

      return { success: true }
    } catch (err: any) { 
      return { success: false, message: err.message } 
    }
  })
}