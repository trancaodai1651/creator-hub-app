/* eslint-disable */
import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import YTDlpWrap from 'yt-dlp-wrap'
import { ffmpegPath, videoEncoder } from '../index'

const userDataPath = app.getPath('userData')
const ytdlpBinaryName = process.platform === 'win32' ? 'yt-dlp.exe' : (process.platform === 'darwin' ? 'yt-dlp_macos' : 'yt-dlp')
const ytdlpBinaryPath = path.join(userDataPath, ytdlpBinaryName)

// Hàm tạo tên file duy nhất (Chống ghi đè)
function getUniqueFilePath(dir: string, fileName: string): string {
  const ext = path.extname(fileName); 
  const baseName = path.basename(fileName, ext); 
  let finalPath = path.join(dir, fileName);
  let counter = 1;
  while (fs.existsSync(finalPath)) {
    finalPath = path.join(dir, `${baseName} (${counter})${ext}`);
    counter++;
  }
  return finalPath;
}

export function registerDownloaderHandlers() {
  
  // =======================================================================
  // 🚀 API: LẤY THÔNG TIN VIDEO / PLAYLIST
  // =======================================================================
  ipcMain.handle('get-video-info', async (_event, url: string) => {
    try {
      const YTDlpWrapClass = (YTDlpWrap as any).default || YTDlpWrap;
      const ytdlpWrap = new YTDlpWrapClass(ytdlpBinaryPath);
      
      const stdout = await ytdlpWrap.execPromise([url, '--dump-single-json', '--flat-playlist']);
      const metadata = JSON.parse(stdout);
      
      if (metadata._type === 'playlist' || metadata.entries) {
        const playlistEntries = metadata.entries.map((e: any) => ({
          title: e.title || 'Video trong Playlist',
          url: e.url || e.webpage_url || url,
          thumbnail: e.thumbnails?.[0]?.url || e.thumbnail || '',
          availableResolutions: ['best'] 
        }));
        return { success: true, isPlaylist: true, playlistName: metadata.title, entries: playlistEntries };
      }

      let availableRes = ['best'];
      if (metadata.formats) {
        const heights = metadata.formats.map((f: any) => f.height).filter((h: any) => typeof h === 'number' && h >= 360);
        const uniqueHeights = [...new Set(heights)].sort((a: any, b: any) => b - a).map(String);
        availableRes = ['best', ...uniqueHeights];
      }

      return { 
        success: true, 
        isPlaylist: false,
        title: metadata.title || 'Unknown Video', 
        thumbnail: metadata.thumbnail || metadata.thumbnails?.[0]?.url || '',
        availableResolutions: availableRes 
      };
    } catch (error: any) { return { success: false, message: error.message }; }
  });


  // =======================================================================
  // 🚀 API: TẢI XUỐNG VIDEO & CẮT GHÉP
  // =======================================================================
  ipcMain.handle('download-video', async (event, { id, url, saveDir, resolution, isLight, startTime, endTime }: any) => {
    const finalSaveDir = saveDir && fs.existsSync(saveDir) ? saveDir : app.getPath('downloads'); 
    const tempDir = path.join(finalSaveDir, `temp_dl_${id}_${Date.now()}`); 
    const needCut = startTime && endTime; 

    try {
      const YTDlpWrapClass = (YTDlpWrap as any).default || YTDlpWrap;
      if (!fs.existsSync(ytdlpBinaryPath)) { 
        event.sender.send('download-progress', { id, msgKey: 'dl_msg_sync_core', percent: 10 }); 
        await YTDlpWrapClass.downloadFromGithub(ytdlpBinaryPath) 
      }
      
      const ytdlpWrap = new YTDlpWrapClass(ytdlpBinaryPath); 
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir); 
      
      const outputTemplate = path.join(tempDir, '%(title)s.%(ext)s'); 
      let formatFilter = 'bv*+ba/b';
      let ytdlpArgs: string[] = [url, '-o', outputTemplate, '--ffmpeg-location', ffmpegPath];

      if (isLight) {
        if (resolution !== 'best') {
          formatFilter = `bv*[height<=${resolution}][vcodec^=avc]+ba/b[height<=${resolution}][vcodec^=avc] / b[vcodec^=avc] / b`;
        } else {
          formatFilter = 'bv*[vcodec^=avc]+ba/b / b[vcodec^=avc] / b';
        }
        ytdlpArgs.push('-f', formatFilter, '--merge-output-format', 'mp4');
      } else {
        if (resolution !== 'best') { formatFilter = `bv*[height<=${resolution}]+ba/b`; }
        ytdlpArgs.push('-f', formatFilter, '--merge-output-format', 'mkv');
      }

      await new Promise((resolve, reject) => { 
        ytdlpWrap.exec(ytdlpArgs).on('progress', (progress: any) => { 
          let numPercent = typeof progress?.percent === 'number' ? progress.percent : parseFloat(progress?.percent);
          if (isNaN(numPercent)) {
            event.sender.send('download-progress', { id, msgKey: 'dl_msg_fetching_stream', percent: 50 });
          } else {
            event.sender.send('download-progress', { id, msgKey: isLight ? 'dl_msg_downloading_light' : 'dl_msg_downloading_hq', percent: isLight ? Math.round(numPercent * 0.9) : Math.round(numPercent * 0.7) });
          }
        }).on('error', reject).on('close', resolve)
      })
      
      const downloadedFiles = fs.readdirSync(tempDir).filter(f => !f.endsWith('.part') && !f.endsWith('.ytdl')); 
      if (downloadedFiles.length === 0) throw new Error("No file found"); 
      
      const downloadedFileName = downloadedFiles[0]; 
      const downloadedFilePath = path.join(tempDir, downloadedFileName); 
      const finalFileName = downloadedFileName.replace(/\.[^/.]+$/, "") + (isLight ? ".mp4" : "_premiere.mp4");
      const finalFilePath = getUniqueFilePath(finalSaveDir, finalFileName);
      
      if (isLight) {
        if (needCut) {
          event.sender.send('download-progress', { id, msgKey: 'dl_msg_cutting', percent: 95 }); 
          await new Promise<void>((resolve, reject) => { 
            const ff = ffmpeg(downloadedFilePath).setFfmpegPath(ffmpegPath);
            ff.inputOptions([`-ss ${startTime}`, `-to ${endTime}`])
              .outputOptions(['-c:v libx264', '-preset superfast', '-pix_fmt yuv420p', '-profile:v high', '-c:a aac', '-b:a 192k'])
              .save(finalFilePath).on('end', () => resolve()).on('error', (err) => reject(err));
          });
        } else { fs.renameSync(downloadedFilePath, finalFilePath); }
        fs.rmSync(tempDir, { recursive: true, force: true }); 
        event.sender.send('download-progress', { id, msgKey: 'dl_msg_done', percent: 100 }); 
        return { success: true }
      } else {
        event.sender.send('download-progress', { id, msgKey: 'dl_msg_gpu_render', percent: 85 }); 
        await new Promise<void>((resolve, reject) => { 
          const ff = ffmpeg(downloadedFilePath).setFfmpegPath(ffmpegPath);
          if (needCut) ff.inputOptions([`-ss ${startTime}`, `-to ${endTime}`]);

          let qualityOptions = videoEncoder.includes('nvenc') ? ['-preset p6', '-rc vbr', '-cq 19', '-b:v 0'] : 
                               videoEncoder.includes('qsv') ? ['-global_quality 19'] : 
                               videoEncoder.includes('amf') ? ['-quality quality'] : 
                               videoEncoder.includes('videotoolbox') ? ['-q:v 65'] : ['-crf 18'];
          const options = [`-c:v ${videoEncoder}`, ...qualityOptions, '-pix_fmt yuv420p', '-profile:v high', '-c:a aac', '-b:a 192k'];
          ff.outputOptions(options).save(finalFilePath).on('end', () => resolve()).on('error', (err) => reject(err));
        }); 
        fs.rmSync(tempDir, { recursive: true, force: true }); 
        event.sender.send('download-progress', { id, msgKey: 'dl_msg_done', percent: 100 }); 
        return { success: true } 
      }
    } catch (error: any) { 
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); 
      return { success: false, message: error.message } 
    }
  })


  // =======================================================================
  // 🚀 API: TÌM KIẾM VIDEO BẰNG TỪ KHÓA
  // =======================================================================
  ipcMain.handle('search-video', async (_event, { keyword, limit = 10 }: any) => {
    try {
      const YTDlpWrapClass = (YTDlpWrap as any).default || YTDlpWrap;
      const ytdlpWrap = new YTDlpWrapClass(ytdlpBinaryPath);
      
      const searchStr = `ytsearch${limit}:${keyword}`;
      
      const stdout = await ytdlpWrap.execPromise([searchStr, '--dump-single-json', '--flat-playlist']);
      const metadata = JSON.parse(stdout);
      
      if (metadata && Array.isArray(metadata.entries)) {
        const results = metadata.entries.map((e: any) => ({
          id: e.id,
          title: e.title,
          url: e.url || e.webpage_url || `https://www.youtube.com/watch?v=${e.id}`,
          thumbnail: e.thumbnails?.[0]?.url || e.thumbnail || (e.id ? `https://i.ytimg.com/vi/${e.id}/hqdefault.jpg` : ''),
          // Trả về thời lượng video (nếu có)
          duration: e.duration_string || (e.duration ? new Date(e.duration * 1000).toISOString().substring(14, 19) : 'N/A'),
          channel: e.uploader || e.channel || 'YouTube'
        }));
        return { success: true, results };
      }
      
      return { success: false, message: 'Không tìm thấy kết quả phù hợp.' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  });
}