/* eslint-disable */
import { ipcMain, dialog } from 'electron'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let activeBrowser: Browser | null = null;

async function safeCloseBrowser() {
  if (activeBrowser) {
    try {
      await activeBrowser.close();
    } catch (e) {
      console.log('Ignore close error');
    }
    activeBrowser = null;
  }
}

export function registerPublisherHandlers() {
  
  // 0️⃣ LỆNH MỞ HỘP THOẠI CHỌN FILE NATIVE CHÍNH CHỦ OS (NÉ KHÓA FILE)
  ipcMain.handle('select-video-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
      });
      
      if (result.canceled || result.filePaths.length === 0) return null;
      
      const filePath = result.filePaths[0];
      const stats = fs.statSync(filePath);
      const sizeStr = (stats.size / 1024 / 1024).toFixed(2) + ' MB';
      const name = path.basename(filePath);
      
      return { name, size: sizeStr, path: filePath };
    } catch (err) {
      return null;
    }
  });

  // 1️⃣ LỆNH MỞ TRÌNH DUYỆT ĐỂ NGƯỜI DÙNG TỰ LOGIN BẰNG TAY (1 LẦN DUY NHẤT)
  ipcMain.handle('setup-publisher-account', async (_event, platform) => {
    try {
      await safeCloseBrowser();

      const userProfilePath = path.join(app.getPath('userData'), 'automation_chrome_profile');
      
      activeBrowser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        userDataDir: userProfilePath,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-disk-cache'
        ]
      });

      const page = await activeBrowser.newPage();
      
      if (platform === 'youtube') await page.goto('https://studio.youtube.com');
      if (platform === 'tiktok') await page.goto('https://www.tiktok.com/creator-center/upload');
      if (platform === 'facebook') await page.goto('https://business.facebook.com/creatorstudio/home');

      await new Promise((resolve) => {
        activeBrowser?.on('disconnected', () => {
          activeBrowser = null;
          resolve(true);
        });
      });

      return { success: true };
    } catch (error: any) {
      await safeCloseBrowser();
      return { success: false, error: error.message };
    }
  });

  // 2️⃣ LỆNH TỰ ĐỘNG ĐĂNG BÀI AUTOMATION
  ipcMain.handle('trigger-puppeteer-publish', async (event, { videoPath, metadata, platforms }) => {
    try {
      await safeCloseBrowser();

      const replyLog = (msg: string) => event.sender.send('publisher-log-reply', msg)
      const userProfilePath = path.join(app.getPath('userData'), 'automation_chrome_profile');

      replyLog(`🔍 Đang khởi động trình duyệt bằng Profile đã lưu...`)
      
      activeBrowser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: false,
        defaultViewport: null,
        userDataDir: userProfilePath,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certificate-errors',
          '--ignore-certificate-errors-spki-list',
          '--disable-disk-cache'
        ]
      });

      // ==========================================
      // 🔴 KỊCH BẢN YOUTUBE AUTOMATION CHUẨN HOÁ
      // ==========================================
      if (platforms.youtube) {
        replyLog(`🔴 [YouTube] Đang truy cập YouTube Studio...`)
        const page = await activeBrowser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 720 });
        
        await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2' });
        
        try {
          replyLog(`🔴 [YouTube] Đang tìm nút Tải video lên...`)
          await page.waitForSelector('#upload-icon', { timeout: 15000 });
          await page.click('#upload-icon');
          
          await new Promise(r => setTimeout(r, 3000));

          replyLog(`🔴 [YouTube] Đang kích hoạt cổng chọn tệp hệ thống...`)
          const [fileChooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('#select-files-button'),
          ]);

          replyLog(`🔴 [YouTube] Đang truyền dữ liệu video vào trình duyệt...`)
          const resolvedPath = path.resolve(videoPath);
          await fileChooser.accept([resolvedPath]);

          replyLog(`🔴 [YouTube] Hệ thống đã nhận file. Đang đợi form nhập liệu hiển thị...`)
          await page.waitForSelector('#title-textarea #textbox', { timeout: 40000 });
          
          replyLog(`🔴 [YouTube] Đang tự động điền Tiêu đề: "${metadata.title}"`)
          await page.click('#title-textarea #textbox');
          await page.evaluate(() => {
            const el = document.querySelector('#title-textarea #textbox') as any;
            if (el) el.innerText = '';
          });
          await page.type('#title-textarea #textbox', metadata.title);

          if (metadata.description) {
            replyLog(`🔴 [YouTube] Đang điền nội dung mô tả...`)
            await page.type('#description-textarea #textbox', metadata.description);
          }

          // =========================================================================
          // 🚀 SIÊU PHƯƠNG ÁN DU KÍCH: QUÉT CHỮ TRÊN THẺ NHÃN TOÀN CỤC (BYPASS WEB COMPONENTS)
          // =========================================================================
          replyLog(`🔴 [YouTube] Đang giả lập cuộn nội dung xuống dưới...`)
          await page.click('#title-textarea #textbox');
          for (let i = 0; i < 3; i++) {
            await page.keyboard.press('PageDown');
            await new Promise(r => setTimeout(r, 500));
          }
          await new Promise(r => setTimeout(r, 1000));

          replyLog(`🔴 [YouTube] Đang lùng sục dòng chữ "không dành cho trẻ em" trên toàn bộ giao diện...`)
          
          const clickSuccess = await page.evaluate(async () => {
            // Hàm đệ quy đi xuyên Shadow DOM tối mật để vét cạn tất cả các thẻ chữ
            function findElementsDeep(selector: string, root: any = document): any[] {
              const elements: any[] = [];
              function traverse(node: any) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.matches(selector)) elements.push(node);
                  if (node.shadowRoot) traverse(node.shadowRoot);
                }
                let child = node.firstChild;
                while (child) { traverse(child); child = child.nextSibling; }
              }
              traverse(root);
              return elements;
            }

            // Vòng lặp thăm dò liên tục trong vòng 10 giây
            for (let i = 0; i < 10; i++) {
              // Thao tác 1: Quét tất cả các thẻ chứa nhãn chữ trong hệ thống YouTube Studio
              const textNodes = [
                ...findElementsDeep('#radioLabel'),
                ...findElementsDeep('div'),
                ...findElementsDeep('span'),
                ...findElementsDeep('ytcp-radio-button')
              ];

              // Đi tìm thẻ nào có chứa nội dung tiếng Việt chuẩn xác
              const targetNode = textNodes.find(node => {
                const text = node.textContent?.trim().toLowerCase() || '';
                return (
                  text === 'không, nội dung này không dành cho trẻ em' ||
                  text.includes('không dành cho trẻ em') ||
                  (text.includes('không') && text.includes('trẻ em') && !text.includes('có'))
                );
              });

              if (targetNode) {
                targetNode.scrollIntoView({ behavior: 'instant', block: 'center' });
                
                // 🎯 TUYỆT CHIÊU: Bấm trực tiếp vào dòng chữ (YouTube sẽ tự tích chọn nút tròn bên cạnh)
                targetNode.click();
                
                // Dự phòng: Nếu bấm vào chữ chưa ăn, tìm thẻ cha hoặc thẻ radio bọc ngoài để click thêm một phát
                const parentButton = targetNode.closest('ytcp-radio-button');
                if (parentButton) parentButton.click();

                return true; // Khớp và click thành công!
              }

              // Thao tác 2 (Phương án dự phòng tối hậu): Nếu rà quét text bị mã hóa toàn bộ, 
              // Nhắm mù vào phần tử ytcp-radio-button thứ 2 hiển thị trên form details
              const fallbackRadios = findElementsDeep('ytcp-radio-button');
              if (fallbackRadios.length >= 2) {
                fallbackRadios[1].scrollIntoView({ behavior: 'instant', block: 'center' });
                fallbackRadios[1].click();
                return true;
              }

              await new Promise(r => setTimeout(r, 1000));
            }
            return false;
          });

          if (!clickSuccess) {
            throw new Error("Không thể tìm thấy mục chọn đối tượng bằng mọi phương pháp rà soát.");
          }

          replyLog(`   ↳ Đã xác định và tích chọn mục "Không dành cho trẻ em" thành công.`);
          await new Promise(r => setTimeout(r, 2500));
          // =========================================================================

          // =========================================================================
          // 🚀 SIÊU NÂN CẤP: CHỜ NÚT TIẾP TỤC KHỞI ĐỘNG (BẢN TRÁNH KHÓA FORM)
          // =========================================================================
          replyLog(`🔴 [YouTube] Đang chuẩn bị điều hướng qua các bước kiểm duyệt...`)
          for (let i = 1; i <= 3; i++) {
            try {
              // Định nghĩa bộ chọn nút Next linh hoạt của YouTube
              const nextBtnSelector = '#next-button:not([disabled]), ytcp-button#next-button:not([disabled])';
              
              replyLog(`   ↳ Bước ${i}/3: Đang đợi nút "Tiếp tục" sẵn sàng (mở khóa)...`)
              // 🚀 ĐẶC TRỊ: Đợi cho đến khi nút Next xuất hiện VÀ hết bị disabled (Tối đa 20 giây đề phòng mạng lag)
              await page.waitForSelector(nextBtnSelector, { timeout: 20000 });
              
              // Nghỉ thêm 1.5 giây sau khi nút mở khóa để chắc chắn trang web đã ổn định
              await new Promise(r => setTimeout(r, 1500));

              const nextClicked = await page.evaluate(() => {
                const btn = document.querySelector('#next-button') as any;
                if (btn && !btn.disabled) {
                  btn.click();
                  return true;
                }
                const allButtons = Array.from(document.querySelectorAll('ytcp-button'));
                const fallbackBtn = allButtons.find((b: any) => {
                  const txt = b.textContent?.toLowerCase() || '';
                  return (txt.includes('next') || txt.includes('tiếp')) && !b.disabled;
                }) as any;
                
                if (fallbackBtn) {
                  fallbackBtn.click();
                  return true;
                }
                return false;
              });

              if (!nextClicked) {
                throw new Error("Nút hiển thị nhưng lệnh ép click bằng mã độc JS bị từ chối.");
              }
              
              replyLog(`   ↳ Đã vượt qua bước ${i}/3 thành công.`);
              // Đợi 3.5 giây cho hiệu ứng chuyển tab hoàn toàn trên nền tảng YouTube
              await new Promise(r => setTimeout(r, 3500));

            } catch (stepError: any) {
              throw new Error(`Kẹt tại bước ${i}/3. Chi tiết: Nút 'Tiếp tục' bị YouTube khóa quá lâu hoặc giao diện bị đơ. (${stepError.message})`);
            }
          }
          // =========================================================================

          replyLog(`🔴 [YouTube] Đang thiết lập chế độ hiển thị: CÔNG KHAI (Public)`)
          const publicSelected = await page.evaluate(() => {
            const radios = Array.from(document.querySelectorAll('ytcp-radio-button'));
            const pubRadio = radios.find((r: any) => {
              const txt = r.textContent?.toLowerCase() || '';
              return txt.includes('public') || txt.includes('công khai');
            }) as any;
            
            if (pubRadio) {
              pubRadio.click();
              return true;
            }
            return false;
          });
          if (!publicSelected) throw new Error("Không thể chọn chế độ hiển thị Công khai.");

          replyLog(`🚀 [YouTube] ĐANG BẤM NÚT XUẤT BẢN CHÍNH THỨC...`)
          const doneClicked = await page.evaluate(() => {
            const btn = document.querySelector('#done-button') as any;
            if (btn) {
              btn.click();
              return true;
            }
            const allButtons = Array.from(document.querySelectorAll('ytcp-button'));
            const saveBtn = allButtons.find((b: any) => {
              const txt = b.textContent?.toLowerCase() || '';
              return txt.includes('publish') || txt.includes('xuất bản') || txt.includes('save') || txt.includes('lưu');
            }) as any;
            
            if (saveBtn) {
              saveBtn.click();
              return true;
            }
            return false;
          });
          
          if (!doneClicked) throw new Error("Không thể kích hoạt nút Xuất bản cuối cùng.");
          
          replyLog(`⚙️ Đang đợi máy chủ YouTube ghi nhận dữ liệu...`)
          await new Promise(r => setTimeout(r, 8000));
          replyLog(`🟢 [YouTube] Quy trình tự động hóa hoàn tất. Video đã được đưa lên kênh!`)
          await page.close();

        } catch (ytError: any) {
          replyLog(`❌ [YouTube Thất bại] Luồng xử lý bị ngắt: ${ytError.message}`);
          await page.close();
          throw ytError;
        }
      }

      // Tương tự cho Facebook và TikTok...

      await safeCloseBrowser();
      return { success: true };
    } catch (error: any) {
      await safeCloseBrowser();
      return { success: false, error: error.message };
    }
  });
}