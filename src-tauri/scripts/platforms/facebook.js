/* eslint-disable */
const path = require('path');

async function publishFacebook(browser, config, replyLog) {
  const { videoPath, metadata, publishMode } = config;
  replyLog(`\n=========================================`);
  replyLog(`🔵 [Facebook] BẮT ĐẦU TIẾN TRÌNH TỰ ĐỘNG HÓA...`);
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    replyLog(`🔵 [Facebook] Đang dò tìm môi trường (Fanpage hoặc Cá nhân)...`);
    await page.goto('https://business.facebook.com/latest/composer', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    const currentUrl = page.url();

    let formattedHashtags = '';
    if (metadata.hashtags) {
      const tags = metadata.hashtags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      formattedHashtags = tags.map((t) => t.startsWith('#') ? t : `#${t}`).join(' ');
    }
    const fullContent = formattedHashtags 
      ? `${metadata.title}\n\n${metadata.description}\n\n${formattedHashtags}`
      : `${metadata.title}\n\n${metadata.description}`;

    async function clearAndType(page, text) {
      await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
      await page.keyboard.press('A');
      await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
      await page.keyboard.press('Backspace');
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.type(text, { delay: 10 });
    }

    if (currentUrl.includes('business.facebook.com')) {
      replyLog(`🔵 [Facebook Fanpage] Đã vào Meta Business Suite...`);
      
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout: 20000 }),
        page.evaluate(() => {
          const addBtn = Array.from(document.querySelectorAll('div, span, button')).find(el => {
            const txt = el.textContent?.trim().toLowerCase() || '';
            return txt === 'thêm video' || txt === 'add video';
          });
          if (addBtn) {
            addBtn.click();
            setTimeout(() => {
              const uploadBtn = Array.from(document.querySelectorAll('div, span')).find(el => {
                const txt = el.textContent?.trim().toLowerCase() || '';
                return txt.includes('tải lên') || txt.includes('upload from desktop');
              });
              if (uploadBtn) uploadBtn.click();
            }, 1000);
          }
        })
      ]);
      
      replyLog(`🔵 [Facebook Fanpage] Đang nạp file video...`);
      await fileChooser.accept([path.resolve(videoPath)]);
      await new Promise(r => setTimeout(r, 8000));

      replyLog(`🔵 [Facebook Fanpage] Đang dọn dẹp và điền nội dung tiêu đề, mô tả...`);
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await clearAndType(page, fullContent);
      
      const modeLog = publishMode === 'draft' ? 'LƯU NHÁP (Save as draft)' : 'ĐĂNG NGAY (Publish)';
      replyLog(`🔵 [Facebook Fanpage] Thiết lập chế độ: ${modeLog}`);
      await new Promise(r => setTimeout(r, 3000));

      const actionSuccess = await page.evaluate(async (mode) => {
        const targetKeywords = mode === 'draft' ? ['lưu làm bản nháp', 'save as draft', 'nháp', 'draft'] : ['đăng', 'publish'];
        for (let i = 0; i < 10; i++) {
          const elements = Array.from(document.querySelectorAll('div[role="button"], button'));
          const targetBtn = elements.find(b => {
            const txt = b.textContent?.trim().toLowerCase() || '';
            return targetKeywords.some(kw => txt === kw) && !b.getAttribute('aria-disabled');
          });
          if (targetBtn) {
            targetBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
            targetBtn.click();
            return true;
          }
          await new Promise(r => setTimeout(r, 1000));
        }
        return false;
      }, publishMode);

      if (!actionSuccess) throw new Error(`Không thể tìm thấy nút: ${modeLog}`);
    } 
    else {
      replyLog(`🔵 [Facebook Cá Nhân] Chuyển sang đăng tường nhà...`);
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 3000));

      replyLog(`🔵 [Facebook Cá Nhân] Đang mở khung "Bạn đang nghĩ gì?"...`);
      await page.evaluate(() => {
        const composerBtn = Array.from(document.querySelectorAll('div[role="button"]')).find(el => {
          const txt = el.textContent?.toLowerCase() || '';
          return txt.includes('nghĩ gì') || txt.includes("what's on your mind");
        });
        if (composerBtn) composerBtn.click();
      });
      await new Promise(r => setTimeout(r, 3000));

      replyLog(`🔵 [Facebook Cá Nhân] Đang chèn video...`);
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser({ timeout: 20000 }),
        page.evaluate(() => {
          const addPhotoBtn = Array.from(document.querySelectorAll('div[aria-label]')).find(el => {
            const label = el.getAttribute('aria-label')?.toLowerCase() || '';
            return label.includes('ảnh/video') || label.includes('photo/video');
          });
          if (addPhotoBtn) addPhotoBtn.click();
        })
      ]);
      await fileChooser.accept([path.resolve(videoPath)]);
      await new Promise(r => setTimeout(r, 5000));

      replyLog(`🔵 [Facebook Cá Nhân] Đang dọn dẹp và điền nội dung...`);
      await clearAndType(page, fullContent);

      if (publishMode === 'draft') {
        replyLog(`🔵 [Facebook Cá Nhân] Đang thiết lập quyền riêng tư: CHỈ MÌNH TÔI (Only Me)`);
        await page.evaluate(async () => {
          const privacyBtns = Array.from(document.querySelectorAll('div[role="button"]'));
          const currentPrivacyBtn = privacyBtns.find(b => {
             const img = b.querySelector('img');
             return img && b.textContent; 
          });
          if (currentPrivacyBtn) currentPrivacyBtn.click();
          
          await new Promise(r => setTimeout(r, 2000));
          const onlyMeOption = Array.from(document.querySelectorAll('div[role="radio"], div[role="button"]')).find(el => {
            const txt = el.textContent?.toLowerCase() || '';
            return txt.includes('chỉ mình tôi') || txt.includes('only me');
          });
          if (onlyMeOption) onlyMeOption.click();
          
          await new Promise(r => setTimeout(r, 1000));
          const saveBtns = Array.from(document.querySelectorAll('div[role="button"]'));
          const saveBtn = saveBtns.find(b => b.textContent?.toLowerCase().includes('xong') || b.textContent?.toLowerCase().includes('done') || b.textContent?.toLowerCase().includes('lưu') || b.textContent?.toLowerCase().includes('save'));
          if (saveBtn) saveBtn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
      } else {
        replyLog(`🔵 [Facebook Cá Nhân] Đang phát hành chế độ: CÔNG KHAI (Public)`);
      }

      replyLog(`🔵 [Facebook Cá Nhân] Đang click ĐĂNG BÀI...`);
      await page.evaluate(async () => {
        const postBtns = Array.from(document.querySelectorAll('div[role="button"]'));
        const postBtn = postBtns.find(b => {
          const txt = b.textContent?.toLowerCase() || '';
          return (txt === 'đăng' || txt === 'post') && !b.getAttribute('aria-disabled');
        });
        if (postBtn) postBtn.click();
      });
    }

    replyLog(`⚙️ [Facebook] Đang đợi máy chủ đồng bộ dữ liệu...`);
    await new Promise(r => setTimeout(r, 10000));
    replyLog(`🟢 [Facebook] Hoàn tất tiến trình!`);
    await page.close();
  } catch (error) {
    await page.close();
    throw new Error(`[Facebook Lỗi] ${error.message}`);
  }
}

module.exports = { publishFacebook };