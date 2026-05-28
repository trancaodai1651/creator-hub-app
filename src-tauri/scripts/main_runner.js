/* eslint-disable */
const path = require('path');
const os = require('os');
const fs = require('fs');

// 🚀 GỌI 2 FILE CHUYÊN TRÁCH VÀO ĐÂY
const { publishYoutubeViaAPI } = require('./api_youtube');
const { setupProfile, publishViaPuppeteer } = require('./puppeteer_runner');

const replyLog = (msg) => console.log(msg);

async function run() {
  const action = process.argv[2]; 
  const payload = process.argv[3]; 

  try {
    const config = JSON.parse(payload);
    
    // 1. CHUẨN BỊ THƯ MỤC PROFILE CHO KÊNH
    const profileName = config.profileName || 'Default_Channel';
    const safeProfileName = profileName.replace(/[^a-zA-Z0-9_\u0600-\uFFFF]/g, '_'); 
    
    const profileDir = path.join(os.homedir(), '.creator_hub', 'profiles', safeProfileName);
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

    const userDataDir = path.join(profileDir, 'chrome_profile'); 
    const tokenPath = path.join(profileDir, 'yt_token.json');    
    
    // 2. PHÂN LUỒNG XỬ LÝ (SETUP HOẶC PUBLISH)
    if (action === 'setup') {
      // Chuyển việc Setup cho Puppeteer làm
      await setupProfile(config, userDataDir, replyLog);
      process.exit(0);
    } 
    else if (action === 'publish') {
      
      // NHÁNH A: CHUYỂN VIỆC CHO API YOUTUBE
      if (config.uploadMethod === 'api') {
        replyLog(`🌐 Chế độ API được kích hoạt cho Kênh: ${profileName}`);
        
        if (config.platforms.youtube) {
          await publishYoutubeViaAPI(config, tokenPath, replyLog); 
        }
        if (config.platforms.tiktok || config.platforms.facebook) {
          replyLog(`⚠️ CẢNH BÁO: TikTok/Facebook chưa có cấu hình API. Bỏ qua.`);
        }
        
        replyLog(`🟢 QUY TRÌNH API HOÀN TẤT!`);
        process.exit(0);
        return;
      }

      // NHÁNH B: CHUYỂN VIỆC CHO PUPPETEER (GIẢ LẬP)
      replyLog(`🔍 Đang khởi động trình duyệt bằng Hồ sơ [${profileName}]...`);
      await publishViaPuppeteer(config, userDataDir, replyLog);
      
      replyLog(`🟢 QUY TRÌNH PUPPETEER HOÀN TẤT!`);
      process.exit(0);
    }
  } catch (err) {
    console.error(err.stack || err.message);
    process.exit(1);
  }
}

run();