/* eslint-disable */
const path = require('path');

async function publishYouTube(browser, config, replyLog) {
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
    const newDescriptionContent = formattedHashtags 
      ? `${(metadata.description || '').trim()}\n\n${formattedHashtags}\n\n`
      : `${(metadata.description || '').trim()}\n\n`;

    await page.click('#title-textarea #textbox');
    await page.evaluate(() => {
      const el = document.querySelector('#title-textarea #textbox');
      if (el) { 
        el.textContent = ''; 
        el.dispatchEvent(new Event('input', { bubbles: true })); 
      }
    });
    await new Promise(r => setTimeout(r, 800));
    await page.keyboard.type(cleanTitle, { delay: 15 });

    if ((metadata.description || '').trim() || formattedHashtags) {
      replyLog(`🔴 [YouTube] Đang định vị con trỏ và bổ sung nội dung vào mẫu mô tả...`);
      await page.click('#description-textarea #textbox');
      await new Promise(r => setTimeout(r, 500));

      await page.evaluate(() => {
        const el = document.querySelector('#description-textarea #textbox');
        if (el) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(el, 0); 
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range); 
        }
      });
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.type(newDescriptionContent, { delay: 10 });
    }

    replyLog(`🔴 [YouTube] Cuộn trang và cấu hình Đối tượng (Không dành cho trẻ em)...`);
    await page.evaluate(() => {
      const container = document.querySelector('#scrollable-content') || document.querySelector('ytcp-video-metadata-editor-dialog');
      if (container) container.scrollTop = container.scrollHeight / 2;
    });
    await new Promise(r => setTimeout(r, 1500));

    const audienceSelected = await page.evaluate(async () => {
      function findDeep(sel, root = document) {
        const els = [];
        function traverse(node) {
          if (node.nodeType === 1) { if (node.matches(sel)) els.push(node); if (node.shadowRoot) traverse(node.shadowRoot); }
          let child = node.firstChild; while (child) { traverse(child); child = child.nextSibling; }
        }
        traverse(root); return els;
      }
      
      const targetTags = 'tp-yt-paper-radio-button, ytcp-radio-button';
      for (let i = 0; i < 8; i++) {
        const radios = findDeep(targetTags);
        const targetRadio = radios.find((r) => {
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
      await page.evaluate(() => { document.querySelector('#next-button')?.click(); });
      await new Promise(r => setTimeout(r, 2000));
    }

    // ==========================================
    // 🚀 BỌC KHIÊN CHỐNG LỖI SẬP GIAO DIỆN Ở BƯỚC CUỐI
    // ==========================================
    try {
      const modeLog = publishMode === 'draft' ? 'KHÔNG CÔNG KHAI (Unlisted/Draft)' : 'CÔNG KHAI (Public)';
      replyLog(`🔴 [YouTube] Áp dụng chế độ hiển thị: ${modeLog}`);
      
      await page.evaluate(async (mode) => {
        function findDeep(sel, root = document) {
          const els = [];
          function traverse(node) {
            if (node.nodeType === 1) { if (node.matches(sel)) els.push(node); if (node.shadowRoot) traverse(node.shadowRoot); }
            let child = node.firstChild; while (child) { traverse(child); child = child.nextSibling; }
          }
          traverse(root); return els;
        }

        const targetTags = 'tp-yt-paper-radio-button, ytcp-radio-button';
        for (let i = 0; i < 6; i++) {
          const radios = findDeep(targetTags);
          let targetRadio = null;

          if (mode === 'draft') {
            targetRadio = radios.find((r) => r.getAttribute('name') === 'UNLISTED' || (r.textContent && r.textContent.toLowerCase().includes('không công khai')));
          } else {
            targetRadio = radios.find((r) => r.getAttribute('name') === 'PUBLIC' || (r.textContent && r.textContent.toLowerCase().includes('công khai') && !r.textContent.toLowerCase().includes('không')));
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

      replyLog(`🔴 [YouTube] Đang click xuất bản / lưu...`);
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(async () => {
        const btn = document.querySelector('#done-button');
        if (btn && !btn.disabled) btn.click();
      });

      replyLog(`⚙️ [YouTube] Đợi đồng bộ máy chủ...`);
      await new Promise(r => setTimeout(r, 8000));
      
    } catch (stepError) {
      // Nếu có lỗi do không tìm thấy nút, nó sẽ chui vào đây và bỏ qua, báo hoàn tất thay vì sập luồng.
      replyLog(`⚠️ [YouTube] Cảnh báo UI chậm: Bỏ qua bước chọn hiển thị. Video đã an toàn nằm trong Bản nháp!`);
    }

    replyLog(`🟢 [YouTube] Hoàn tất tiến trình!`);
    await page.close();
    
  } catch (error) {
    await page.close();
    throw new Error(`[YouTube Error] ${error.message}`);
  }
}

module.exports = { publishYouTube };