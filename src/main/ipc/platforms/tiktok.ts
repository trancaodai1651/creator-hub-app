/* eslint-disable */
import path from 'path';
import type { Browser } from 'puppeteer-core';

export async function publishTikTok(browser: Browser, config: any, replyLog: (msg: string) => void) {
  const { videoPath, metadata, publishMode } = config;
  replyLog(`\n=========================================`);
  replyLog(`⚫ [TikTok] BẮT ĐẦU TIẾN TRÌNH TỰ ĐỘNG HÓA...`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  page.on('dialog', async dialog => {
    try { await dialog.accept(); } catch (e) {}
  });

  try {
    replyLog(`⚫ [TikTok] Đang truy cập Trung tâm Nhà sáng tạo...`);
    await page.goto('https://www.tiktok.com/creator-center/upload', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 8000));

    replyLog(`⚫ [TikTok] Đang rà soát và tiêm trực tiếp file video vào hệ thống...`);
    let fileInput: any = await page.$('input[type="file"]');
    if (!fileInput) {
      for (const frame of page.frames()) {
        fileInput = await frame.$('input[type="file"]');
        if (fileInput) break;
      }
    }

    if (fileInput) {
      await fileInput.uploadFile(path.resolve(videoPath));
    } else {
      throw new Error("Không thể tìm thấy cổng upload ngầm của TikTok.");
    }

    // =========================================================================
    // BƯỚC 1: ĐỢI TẢI XONG VÀ ĐỢI TIKTOK XẢ GIẬT LAG
    // =========================================================================
    replyLog(`⚫ [TikTok] Đang kiểm tra tiến độ tải video lên hệ thống...`);
    const isUploadFinished = await page.evaluate(async () => {
      for (let i = 0; i < 600; i++) {
        const allText = document.body.innerText.toLowerCase();
        const isUploaded = allText.includes('uploaded') || 
                           allText.includes('đã tải lên') || 
                           allText.includes('ready to publish') ||
                           allText.includes('sẵn sàng xuất bản');
                           
        if (isUploaded) return true;
        await new Promise(r => setTimeout(r, 1000));
      }
      return false;
    });

    if (!isUploadFinished) {
      throw new Error("Quá thời gian tải video lên TikTok (Timeout 10 phút).");
    }
    
    replyLog(`⚫ [TikTok] Video tải xong! Đợi hệ thống xử lý bản quyền 8 giây...`);
    await new Promise(r => setTimeout(r, 8000)); 

    // =========================================================================
    // BƯỚC 2: CÀN QUÉT RÁC & GÕ CHỮ BẰNG PHÍM VẬT LÝ
    // =========================================================================
    replyLog(`⚫ [TikTok] Đang tiến hành xóa sạch tên file cũ...`);
    
    const editorSelector = '.public-DraftEditor-content';
    await page.waitForSelector(editorSelector, { timeout: 30000 });
    
    await page.click(editorSelector);
    await new Promise(r => setTimeout(r, 500));
    
    await page.keyboard.press('End');
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Backspace');
    }
    await new Promise(r => setTimeout(r, 1000));

    replyLog(`⚫ [TikTok] Đang gõ nội dung Tiêu đề, Mô tả và Hashtag...`);
    let mainText = metadata.title;
    if (metadata.description) {
      mainText += `\n${metadata.description}`;
    }
    
    await page.keyboard.type(mainText, { delay: 15 });
    await page.keyboard.press('Enter'); 
    await new Promise(r => setTimeout(r, 500));

    // 🚀 ĐÃ SỬA LỖI HASHTAG XUỐNG DÒNG: Chỉ dùng Space để khóa thẻ, không dùng Enter
    if (metadata.hashtags) {
      const tags = metadata.hashtags.split(/[\s,]+/).map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      for (const tag of tags) {
        const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
        await page.keyboard.type(cleanTag, { delay: 30 }); // Chỉ gõ chữ
        await new Promise(r => setTimeout(r, 1000)); // Đợi gợi ý nháy lên
        await page.keyboard.press('Space'); // Bấm Space để chốt thẻ xanh ngang hàng
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // =========================================================================
    // BƯỚC 3: CUỘN TRANG XUỐNG ĐÁY
    // =========================================================================
    replyLog(`⚫ [TikTok] Thực hiện ép cuộn trang xuống đáy để tìm nút bấm...`);
    
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo(0, document.body.scrollHeight);
      Array.from(document.querySelectorAll('*')).forEach(el => {
        if (el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
        }
      });
    });
    await new Promise(r => setTimeout(r, 1500)); 

    // =========================================================================
    // 🚀 BƯỚC 4: "ROBOT TỰ HÀNH" - QUÉT LIÊN TỤC VÀ XỬ LÝ MỌI TÌNH HUỐNG
    // =========================================================================
    const modeLog = publishMode === 'draft' ? 'LƯU NHÁP (Save draft)' : 'ĐĂNG NGAY (Post)';
    replyLog(`⚫ [TikTok] Bắt đầu theo dõi nút ${modeLog} và quét cảnh báo (Tối đa 5 phút)...`);

    let isSuccess = false;

    for (let i = 0; i < 150; i++) {
      const state = await page.evaluate((mode) => {
        const res = { clickedCancel: false, clickedPostAnyway: false, clickedPost: false, success: false, x: 0, y: 0 };
        
        const allText = document.body.innerText.toLowerCase();
        if (allText.includes('manage posts') || allText.includes('quản lý bài đăng') || allText.includes('uploaded successfully')) {
          res.success = true;
          return res;
        }

        const btns = Array.from(document.querySelectorAll('button, [role="button"], div[class*="Button"]'));

        // 1. NẾU THẤY BẢNG "HỦY TẢI LÊN?" -> BẤM NO
        if (allText.includes('sure you want to cancel your upload') || allText.includes('hủy quá trình tải lên') || allText.includes('hủy bản tải lên')) {
          const noBtn = btns.find(b => {
            const t = b.textContent?.trim().toLowerCase() || '';
            return t === 'no' || t === 'không';
          });
          if (noBtn && (noBtn as HTMLElement).offsetParent !== null) {
            (noBtn as HTMLElement).click();
            res.clickedCancel = true;
            return res;
          }
        }

        // 2. NẾU THẤY BẢNG "MUỐN THOÁT KHÔNG?" -> BẤM CANCEL
        if (allText.includes('are you sure you want to exit') || allText.includes('bạn có chắc chắn muốn thoát')) {
          const cancelBtn = btns.find(b => {
            const t = b.textContent?.trim().toLowerCase() || '';
            return t === 'cancel' || t === 'hủy';
          });
          if (cancelBtn && (cancelBtn as HTMLElement).offsetParent !== null) {
            (cancelBtn as HTMLElement).click();
            res.clickedCancel = true;
            return res;
          }
        }

        // 3. 🚀 BẢN NÂNG CẤP: NẾU THẤY BẢNG "CHƯA KIỂM DUYỆT XONG" HOẶC "BẢN QUYỀN ÂM THANH" -> BẤM POST NOW / POST ANYWAY
        if (allText.includes('continue to post') || allText.includes('tiếp tục đăng') || allText.includes('copyright') || allText.includes('bản quyền')) {
          // Bổ sung đầy đủ "post now" và "đăng ngay"
          const confirmKeywords = ['post anyway', 'vẫn đăng', 'post now', 'đăng ngay', 'save anyway', 'vẫn lưu'];
          const postAnywayBtn = btns.find(b => {
            const t = b.textContent?.trim().toLowerCase() || '';
            return confirmKeywords.some(kw => t === kw || t.includes(kw));
          });
          
          if (postAnywayBtn && (postAnywayBtn as HTMLElement).offsetParent !== null) {
            (postAnywayBtn as HTMLElement).click();
            res.clickedPostAnyway = true;
            return res;
          }
        }

        // 4. KHI MỌI ĐƯỜNG ĐÃ QUANG ĐÃNG -> TÌM NÚT POST/DRAFT VÀ LẤY TỌA ĐỘ
        const targetKeywords = mode === 'draft' ? ['save draft', 'lưu nháp'] : ['post', 'đăng'];
        const postBtn = btns.find(b => {
          const t = b.textContent?.trim().toLowerCase() || '';
          const isDisabled = b.hasAttribute('disabled') || b.getAttribute('aria-disabled') === 'true' || b.className.toLowerCase().includes('disable') || b.getAttribute('data-disabled') === 'true';
          
          // Kiểm tra TỪ KHÓA CHÍNH XÁC Tuyệt đối
          return targetKeywords.includes(t) && !isDisabled;
        });

        if (postBtn && (postBtn as HTMLElement).offsetParent !== null) {
          postBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          const rect = postBtn.getBoundingClientRect();
          res.clickedPost = true;
          res.x = rect.x + rect.width / 2;
          res.y = rect.y + rect.height / 2;
          return res;
        }

        return res;
      }, publishMode);

      if (state.success) {
        isSuccess = true;
        break;
      }

      if (state.clickedCancel) {
        replyLog(`⚫ [TikTok] Đã gỡ bỏ bảng Exit Modal (Nhấn Cancel/No)...`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }

      if (state.clickedPostAnyway) {
        replyLog(`⚫ [TikTok] Đã xác nhận Đăng ngay (Bỏ qua cảnh báo kiểm duyệt/bản quyền)...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (state.clickedPost) {
        replyLog(`⚫ [TikTok] Nút ${modeLog} đã kích hoạt! Tiến hành Click vật lý...`);
        await page.mouse.click(state.x, state.y);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      // Theo dõi việc chuyển trang (URL thay đổi) cũng là dấu hiệu đăng thành công
      try {
        const currentUrl = page.url();
        if (!currentUrl.includes('/upload')) {
          isSuccess = true;
          break;
        }
      } catch (e) {
        isSuccess = true; 
        break;
      }

      if (i % 5 === 0) await page.evaluate(() => window.scrollBy(0, 1));
      if (i % 5 === 2) await page.evaluate(() => window.scrollBy(0, -1));

      await new Promise(r => setTimeout(r, 2000));
    }

    if (!isSuccess) {
      throw new Error(`[Lỗi Timeout] Đã hết thời gian nhưng không thể đăng bài.`);
    }

    replyLog(`🟢 [TikTok] BÀI ĐĂNG ĐÃ LÊN SÓNG THÀNH CÔNG RỰC RỠ!`);
    await page.close();
    
  } catch (error: any) {
    try { await page.close(); } catch(e) {}
    throw new Error(`[TikTok Lỗi] ${error.message}`);
  }
}