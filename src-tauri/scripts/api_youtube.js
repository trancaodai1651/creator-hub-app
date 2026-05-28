/* eslint-disable */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { exec } = require('child_process');
// 🚀 NẠP VŨ KHÍ TỰ ĐỘNG DỌN CỔNG
const killPort = require('kill-port'); 

const openBrowser = (targetUrl) => {
  const platform = process.platform;
  if (platform === 'win32') exec(`start "" "${targetUrl}"`);
  else if (platform === 'darwin') exec(`open "${targetUrl}"`);
  else exec(`xdg-open "${targetUrl}"`);
};

async function publishYoutubeViaAPI(config, tokenPath, replyLog) {
  const { google } = require('googleapis');
  
  const clientId = config.youtubeClientId;
  const clientSecret = config.youtubeClientSecret;

  if (!clientId || !clientSecret) {
    throw new Error("THIẾU API KEY: Vui lòng vào Cài Đặt để điền Client ID và Client Secret!");
  }

  const redirectUri = 'http://localhost:3000/oauth2callback';
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  if (config.requireNewLogin && fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
    replyLog(`🔄 Yêu cầu chỉ định Kênh YouTube cho phiên đăng tải này...`);
  }

  if (fs.existsSync(tokenPath)) {
    replyLog(`🔓 Đã tìm thấy phiên đăng nhập của kênh [${config.profileName}]. Bỏ qua bước xác thực...`);
    const tokens = JSON.parse(fs.readFileSync(tokenPath));
    oauth2Client.setCredentials(tokens);
  } else {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: ['https://www.googleapis.com/auth/youtube.upload']
    });

    replyLog(`🌐 Đang mở trình duyệt để Cấp quyền cho Kênh: ${config.profileName}...`);
    
    // ==============================================================
    // 🚀 TỰ ĐỘNG DỌN DẸP CỔNG 3000 TRƯỚC KHI BẬT SERVER
    // ==============================================================
    try {
      replyLog(`🧹 Đang kiểm tra và tự động dọn dẹp cổng mạng...`);
      await killPort(3000); 
    } catch (e) {
      // Bỏ qua nếu cổng đã trống sẵn
    }

    openBrowser(authUrl);

    await new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url.startsWith('/oauth2callback')) {
            const myUrl = new URL(req.url, 'http://localhost:3000');
            const code = myUrl.searchParams.get('code');
            const error = myUrl.searchParams.get('error');

            if (error) {
              res.end('Lỗi xác thực: ' + error);
              server.close();
              return reject(new Error(error));
            }

            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            
            const dir = path.dirname(tokenPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            
            fs.writeFileSync(tokenPath, JSON.stringify(tokens));

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>✅ XÁC THỰC THÀNH CÔNG CHO: ${config.profileName}!</h1><p>Bạn có thể đóng Tab này.</p>`);
            server.close();
            resolve();
          }
        } catch (e) {
          res.end('Lỗi: ' + e.message);
          server.close();
          reject(e);
        }
      });

      server.on('error', (err) => {
        // Đã có killPort bảo kê ở trên nên trường hợp này gần như 99% không bao giờ xảy ra nữa
        if (err.code === 'EADDRINUSE') {
          replyLog(`❌ LỖI KHÔNG THỂ VƯỢT QUA: Cổng 3000 vẫn bị khóa cứng. Hãy khởi động lại máy tính.`);
        }
        reject(err);
      });

      server.listen(3000, () => {
        replyLog(`⏳ Vui lòng chọn Kênh YouTube trên trình duyệt...`);
      });
    });
  }

  replyLog(`☁️ Đang tiến hành upload video: ${config.metadata.title || 'Không tiêu đề'}...`);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const fileSize = fs.statSync(config.videoPath).size;

  const resUpload = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: config.metadata.title,
        description: config.metadata.description,
        tags: config.metadata.hashtags ? config.metadata.hashtags.split(',').map(t => t.trim()) : [],
      },
      status: {
        privacyStatus: config.publishMode === 'publish' ? 'public' : 'private',
      },
    },
    media: {
      body: fs.createReadStream(config.videoPath),
    },
  }, {
    onUploadProgress: evt => {
      const progress = (evt.bytesRead / fileSize) * 100;
      process.stdout.write(`\r[Upload] Tiến trình: ${Math.round(progress)}%`); 
    }
  });

  console.log(""); 
  replyLog(`🎉 Đăng tải thành công! ID Video: ${resUpload.data.id}`);
  return true;
}

module.exports = { publishYoutubeViaAPI };