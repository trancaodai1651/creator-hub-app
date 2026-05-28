/* eslint-disable */
const puppeteer = require('puppeteer-core');
const { publishYouTube } = require('./platforms/youtube');
const { publishTikTok } = require('./platforms/tiktok');
const { publishFacebook } = require('./platforms/facebook');

const getChromePath = () => {
  if (process.platform === 'win32') return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return '/usr/bin/google-chrome';
};

// Hàm 1: Mở trình duyệt để Setup Kênh
async function setupProfile(config, userDataDir, replyLog) {
  replyLog(`\n⚙️ Đang mở trình duyệt Cài đặt cho Hồ sơ: [${config.profileName}]...`);
  
  const browser = await puppeteer.launch({ 
    executablePath: getChromePath(), 
    headless: false, 
    userDataDir, 
    ignoreDefaultArgs: ['--enable-automation'], 
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled', '--no-sandbox'] 
  });
  
  const page = await browser.newPage();
  if (config.platform === 'youtube') await page.goto('https://studio.youtube.com');
  else if (config.platform === 'tiktok') await page.goto('https://www.tiktok.com/creator-center/upload');
  else await page.goto('https://business.facebook.com/creatorstudio/home');
  
  await new Promise(r => browser.on('disconnected', r));
}

// Hàm 2: Mở trình duyệt để Upload Video
async function publishViaPuppeteer(config, userDataDir, replyLog) {
  const browser = await puppeteer.launch({ 
    executablePath: getChromePath(), 
    headless: false, 
    userDataDir, 
    ignoreDefaultArgs: ['--enable-automation'], 
    args: [
      process.platform === 'win32' ? '--start-maximized' : '--start-fullscreen',
      '--disable-blink-features=AutomationControlled', 
      '--no-sandbox', 
      '--disable-disk-cache'
    ] 
  });

  if (config.platforms.youtube) await publishYouTube(browser, config, replyLog);
  if (config.platforms.tiktok) await publishTikTok(browser, config, replyLog);
  if (config.platforms.facebook) await publishFacebook(browser, config, replyLog);

  await browser.close();
}

// 🚀 XUẤT 2 HÀM RA ĐỂ MAIN_RUNNER SỬ DỤNG
module.exports = {
  setupProfile,
  publishViaPuppeteer
};