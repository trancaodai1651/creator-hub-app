/* eslint-disable */
import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'

// 📦 Import kịch bản từ các file riêng biệt
import { publishYouTube } from './platforms/youtube'
import { publishTikTok } from './platforms/tiktok'
import { publishFacebook } from './platforms/facebook'

const getChromePath = (): string => {
  if (process.platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return '/usr/bin/google-chrome';
};

let activeBrowser: Browser | null = null;

async function safeCloseBrowser() {
  if (activeBrowser) {
    try { await activeBrowser.close(); } catch (e) {}
    activeBrowser = null;
  }
}

export function registerPublisherHandlers() {
  // 1. Chọn file
  ipcMain.handle('select-video-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      
      const filePath = result.filePaths[0];
      const stats = fs.statSync(filePath);
      return { name: path.basename(filePath), size: (stats.size / 1024 / 1024).toFixed(2) + ' MB', path: filePath };
    } catch (err) { return null; }
  });

  // 2. Setup Tài khoản
  ipcMain.handle('setup-publisher-account', async (_event, platform) => {
    try {
      await safeCloseBrowser();
      activeBrowser = await puppeteer.launch({
        executablePath: getChromePath(), headless: false, defaultViewport: null,
        userDataDir: path.join(app.getPath('userData'), 'automation_chrome_profile'),
        ignoreDefaultArgs: ['--enable-automation'],
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-sandbox']
      });
      const page = await activeBrowser.newPage();
      if (platform === 'youtube') await page.goto('https://studio.youtube.com');
      if (platform === 'tiktok') await page.goto('https://www.tiktok.com/creator-center/upload');
      if (platform === 'facebook') await page.goto('https://business.facebook.com/creatorstudio/home');
      
      await new Promise(r => activeBrowser?.on('disconnected', () => { activeBrowser = null; r(true); }));
      return { success: true };
    } catch (error: any) { return { success: false, error: error.message }; }
  });

  // 3. ĐIỀU PHỐI ĐĂNG TẢI (TRÁI TIM CỦA HỆ THỐNG)
  ipcMain.handle('trigger-puppeteer-publish', async (event, config) => {
    try {
      await safeCloseBrowser();
      const replyLog = (msg: string) => event.sender.send('publisher-log-reply', msg);
      
      replyLog(`🔍 Đang khởi động trình duyệt bằng Profile đã lưu...`);
      activeBrowser = await puppeteer.launch({
        executablePath: getChromePath(), headless: false, defaultViewport: null,
        userDataDir: path.join(app.getPath('userData'), 'automation_chrome_profile'),
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          process.platform === 'win32' ? '--start-maximized' : '--start-fullscreen',
          '--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-disk-cache'
        ]
      });

      // 🔥 CHẠY TUẦN TỰ TỪNG NỀN TẢNG THEO LỰA CHỌN CỦA UI
      if (config.platforms.youtube) {
        await publishYouTube(activeBrowser, config, replyLog);
      }
      
      if (config.platforms.tiktok) {
        await publishTikTok(activeBrowser, config, replyLog);
      }

      if (config.platforms.facebook) {
        await publishFacebook(activeBrowser, config, replyLog);
      }

      replyLog(`🟢 QUY TRÌNH TỰ ĐỘNG HÓA HOÀN TẤT CHO TẤT CẢ NỀN TẢNG ĐƯỢC CHỌN!`);
      await safeCloseBrowser();
      return { success: true };
    } catch (error: any) {
      await safeCloseBrowser();
      return { success: false, error: error.message };
    }
  });
}