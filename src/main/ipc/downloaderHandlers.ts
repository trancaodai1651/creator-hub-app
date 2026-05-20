/* eslint-disable */
import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import YTDlpWrap from 'yt-dlp-wrap'
import { ffmpegPath } from '../index'

const userDataPath = app.getPath('userData')
const ytdlpBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : (process.platform === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp')
const ytdlpBinaryPath = path.join(userDataPath, ytdlpBinaryName)

// ĐẢM BẢO TÊN HÀM CÓ TỪ KHÓA EXPORT CHUẨN XÁC ĐỂ INDEX.TS IMPORT ĐƯỢC
export function registerDownloaderHandlers() {
  ipcMain.handle('download-video', async (event, { url, saveDir, resolution, startTime, endTime }: any) => {
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
        ytdlpWrap.exec([ url, '-o', outputTemplate, '-f', formatFilter, '--ffmpeg-location', ffmpegPath, '--merge-output-format', 'mp4' ]).on('progress', (progress: any) => { 
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
}