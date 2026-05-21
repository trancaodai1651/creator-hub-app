/* eslint-disable */
import path from 'path';
import type { Browser } from 'puppeteer-core';

export async function publishYouTube(browser: Browser, config: any, replyLog: (msg: string) => void) {
  const { videoPath, metadata, publishMode } = config;
  replyLog(`\n=========================================`);
  replyLog(`🔴 [YouTube] BẮT ĐẦU TIẾN TRÌNH TỰ ĐỘNG HÓA...`);
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    replyLog(`🔴 [YouTube] Đang truy cập YouTube Studio...`);
    await page.goto('https://studio.youtube.com', { waitUntil: 'networkidle2' });
    
    replyLog(`🔴 [YouTube] Đang kích hoạt cổng upload...`);
    await page.waitForSelector('#upload-icon', { timeout: 15000 });
    await page.click('#upload-icon');
    await new Promise(r => setTimeout(r, 2000));

    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      page.click('#select-files-button'),
    ]);
    await fileChooser.accept([path.resolve(videoPath)]);

    replyLog(`🔴 [YouTube] Đợi form nhập liệu xuất hiện...`);
    await page.waitForSelector('#title-textarea #textbox', { timeout: 40000 });
    await new Promise(r => setTimeout(r, 4000));

    replyLog(`🔴 [YouTube] Đang chuẩn hóa tiêu đề và xử lý cấu trúc Hashtags...`);
    
    let formattedHashtags = '';
    if (metadata.hashtags && String(metadata.hashtags).trim().length > 0) {
      const rawTags = String(metadata.hashtags)
        .split(/[\s,]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
        
      formattedHashtags = rawTags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
    }

    const cleanTitle = String(metadata.title).trim();
    // Nội dung mới cần chèn thêm dấu xuống dòng để tách biệt với mẫu có sẵn ở dưới
    const newDescriptionContent = formattedHashtags 
      ? `${(metadata.description || '').trim()}\n\n${formattedHashtags}\n\n`
      : `${(metadata.description || '').trim()}\n\n`;

    // =========================================================================
    // 🚀 XỬ LÝ Ô TIÊU ĐỀ: Xóa sạch tên file rác và ghi đè tiêu đề mới
    // =========================================================================
    await page.click('#title-textarea #textbox');
    await page.evaluate(() => {
      const el = document.querySelector('#title-textarea #textbox') as any;
      if (el) { 
        el.textContent = ''; 
        el.dispatchEvent(new Event('input', { bubbles: true })); 
      }
    });
    await new Promise(r => setTimeout(r, 800));
    await page.keyboard.type(cleanTitle, { delay: 15 });

    // =========================================================================
    // 🚀 XỬ LÝ Ô MÔ TẢ: GIỮ NGUYÊN MẪU CÓ SẴN - CHỈ CHÈN THÊM VÀO ĐẦU TRANG
    // =========================================================================
    if ((metadata.description || '').trim() || formattedHashtags) {
      replyLog(`🔴 [YouTube] Đang định vị con trỏ và bổ sung nội dung vào mẫu mô tả...`);
      await page.click('#description-textarea #textbox');
      await new Promise(r => setTimeout(r, 500));

      // Thuật toán ép con trỏ chuột nhảy lên ký tự đầu tiên (Vị trí số 0) của khung text
      await page.evaluate(() => {
        const el = document.querySelector('#description-textarea #textbox') as any;
        if (el) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(el, 0); // Đặt điểm xuất phát ngay đầu dòng
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range); // Kích hoạt vị trí con trỏ mới
        }
      });
      await new Promise(r => setTimeout(r, 500));

      // Tiến hành gõ nội dung mới, mẫu có sẵn bên dưới sẽ tự động bị đẩy lùi xuống
      await page.keyboard.type(newDescriptionContent, { delay: 10 });
    }

    replyLog(`🔴 [YouTube] Cuộn trang và cấu hình Đối tượng (Không dành cho trẻ em)...`);
    await page.evaluate(() => {
      const container = document.querySelector('#scrollable-content') || document.querySelector('ytcp-video-metadata-editor-dialog');
      if (container) container.scrollTop = container.scrollHeight / 2;
    });
    await new Promise(r => setTimeout(r, 1500));

    const audienceSelected = await page.evaluate(async () => {
      function findDeep(sel: string, root: any = document): any[] {
        const els: any[] = [];
        function traverse(node: any) {
          if (node.nodeType === 1) { if (node.matches(sel)) els.push(node); if (node.shadowRoot) traverse(node.shadowRoot); }
          let child = node.firstChild; while (child) { traverse(child); child = child.nextSibling; }
        }
        traverse(root); return els;
      }
      
      const targetTags = 'tp-yt-paper-radio-button, ytcp-radio-button';
      for (let i = 0; i < 8; i++) {
        const radios = findDeep(targetTags);
        const targetRadio = radios.find((r: any) => {
          const nameAttr = r.getAttribute('name');
          const text = r.textContent?.toLowerCase() || '';
          return nameAttr === 'VIDEO_MADE_FOR_KIDS_NOT_MFK' || nameAttr === 'NOT_MADE_FOR_KIDS' || text.includes('không dành cho trẻ em') || text.includes('không, nội dung này không');
        });

        if (targetRadio) { 
          targetRadio.scrollIntoView({ behavior: 'instant', block: 'center' }); 
          targetRadio.click(); 
          return true; 
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      return false;
    });

    if (!audienceSelected) throw new Error("Không thể định vị mục 'Không dành cho trẻ em'.");
    await new Promise(r => setTimeout(r, 2000));

    replyLog(`🔴 [YouTube] Vượt qua các bước kiểm duyệt...`);
    for (let i = 1; i <= 3; i++) {
      await page.waitForSelector('#next-button:not([disabled])', { timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));
      await page.evaluate(() => { (document.querySelector('#next-button') as any)?.click(); });
      await new Promise(r => setTimeout(r, 2000));
    }

    const modeLog = publishMode === 'draft' ? 'KHÔNG CÔNG KHAI (Unlisted/Draft)' : 'CÔNG KHAI (Public)';
    replyLog(`🔴 [YouTube] Áp dụng chế độ hiển thị: ${modeLog}`);
    
    const visibilitySelected = await page.evaluate(async (mode) => {
      function findDeep(sel: string, root: any = document): any[] {
        const els: any[] = [];
        function traverse(node: any) {
          if (node.nodeType === 1) { if (node.matches(sel)) els.push(node); if (node.shadowRoot) traverse(node.shadowRoot); }
          let child = node.firstChild; while (child) { traverse(child); child = child.nextSibling; }
        }
        traverse(root); return els;
      }

      const targetTags = 'tp-yt-paper-radio-button, ytcp-radio-button';
      for (let i = 0; i < 8; i++) {
        const radios = findDeep(targetTags);
        let targetRadio: any = null;

        if (mode === 'draft') {
          targetRadio = radios.find((r: any) => r.getAttribute('name') === 'UNLISTED' || (r.textContent && r.textContent.toLowerCase().includes('không công khai')));
        } else {
          targetRadio = radios.find((r: any) => r.getAttribute('name') === 'PUBLIC' || (r.textContent && r.textContent.toLowerCase().includes('công khai') && !r.textContent.toLowerCase().includes('không')));
        }

        if (targetRadio) {
          targetRadio.scrollIntoView({ behavior: 'instant', block: 'center' });
          targetRadio.click();
          return true; 
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      return false;
    }, publishMode);

    if (!visibilitySelected) throw new Error(`Không thể tìm thấy hoặc bấm được vào nút: ${modeLog}`);

    replyLog(`🔴 [YouTube] Đang click xuất bản / lưu...`);
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(async () => {
      const btn = document.querySelector('#done-button') as any;
      if (btn && !btn.disabled) btn.click();
    });

    replyLog(`⚙️ [YouTube] Đợi đồng bộ máy chủ...`);
    await new Promise(r => setTimeout(r, 10000));
    replyLog(`🟢 [YouTube] Hoàn tất tiến trình!`);
    await page.close();
  } catch (error: any) {
    await page.close();
    throw new Error(`[YouTube Error] ${error.message}`);
  }
}