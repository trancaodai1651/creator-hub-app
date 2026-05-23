/* eslint-disable */
import React, { useState } from 'react'

export const DownloaderTab: React.FC<{ dl: any, t: any, colors: any }> = ({ dl, t, colors }) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className={`w-full flex-1 border rounded-3xl p-6 lg:p-8 flex flex-col gap-6 overflow-hidden select-none relative transition-all ${colors.c_bgPanel} ${colors.c_border}`}>
      
      {/* ========================================== */}
      {/* 🚀 HEADER & BÚT HƯỚNG DẪN */}
      {/* ========================================== */}
      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            Trình Tải Video Đa Nền Tảng
          </h3>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">
            Hỗ trợ tải video, âm thanh, danh sách phát từ hơn 1000+ trang web.
          </p>
        </div>
        
        <button 
          onClick={() => setShowGuide(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-bold text-sm rounded-xl transition-all border border-blue-200 dark:border-blue-500/30 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Cẩm nang lấy Link
        </button>
      </div>

      {/* ========================================== */}
      {/* 🚀 THANH ĐIỀU KHIỂN (UI NỀN SÁNG TỐI ƯU BÓNG ĐỔ) */}
      {/* ========================================== */}
      <div className="shrink-0 flex flex-col xl:flex-row items-stretch gap-3 bg-white dark:bg-[#141414] p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none">
        
        <button 
          onClick={dl.handleAddFromClipboard} 
          disabled={dl.isProcessing} 
          title="Dán link từ Clipboard và tự động thêm"
          className="shrink-0 group bg-[#FF203B] hover:bg-red-600 text-white font-bold w-12 xl:w-14 h-12 flex items-center justify-center rounded-xl shadow-md shadow-red-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </button>

        <div className="flex-1 relative flex items-center">
          <svg className="absolute left-4 w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" disabled={dl.isProcessing} value={dl.inputUrl} onChange={(e) => dl.setInputUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && dl.handleAddUrl?.()} 
            placeholder="Nhập link video vào đây (hoặc bấm nút Đỏ để dán nhanh)..." 
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm font-semibold px-4 py-3 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all border border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-inner dark:shadow-none" 
          />
        </div>

        <div className="shrink-0 flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 border-r border-zinc-300 dark:border-zinc-700 pr-4">
            <span className="text-[11px] font-black uppercase text-zinc-500 tracking-wider">Lưu tại:</span>
            <input type="text" readOnly value={dl.downloadFolder || 'Thư mục Downloads'} className="w-28 xl:w-40 bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate focus:outline-none cursor-default" />
            <button disabled={dl.isProcessing} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) dl.setDownloadFolder(path); }} className="px-3 py-1.5 bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 text-xs font-bold rounded-lg transition-colors shadow-sm">Đổi</button>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" checked={dl.isLight} onChange={(e) => dl.setIsLight(e.target.checked)} disabled={dl.isProcessing} />
              <div className="w-5 h-5 rounded-[6px] border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-800 peer-checked:bg-[#FF203B] peer-checked:border-[#FF203B] transition-all flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-400 group-hover:text-[#FF203B] peer-checked:text-[#FF203B] transition-colors">
              Chế độ siêu nhẹ
            </span>
          </label>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🚀 DANH SÁCH HÀNG CHỜ */}
      {/* ========================================== */}
      <div className={`flex-1 border rounded-2xl overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800/80 shadow-inner`}>
        {dl.queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-sm font-bold opacity-50 dark:opacity-40 gap-3 text-zinc-600 dark:text-zinc-500">
            <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Hàng chờ trống. Copy link (Video/Playlist) và bấm dán để bắt đầu!
          </div>
        ) : (
          dl.queue.map((task: any) => (
            <div key={task.id} className={`animate-[slide-up_0.2s_ease-out] relative flex flex-col sm:flex-row gap-5 p-4 border rounded-2xl shadow-sm transition-all ${
              task.status === 'success' 
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-500/30 shadow-emerald-500/10' 
                : task.status === 'error' 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/10' 
                : 'border-zinc-200 bg-white dark:bg-[#1a1a1b] dark:border-zinc-800'
            }`}>
              
              <div className="w-full sm:w-44 h-28 bg-zinc-200 dark:bg-zinc-900 rounded-xl overflow-hidden shrink-0 relative group shadow-sm border border-black/5 dark:border-white/5">
                {task.thumbnail ? <img src={task.thumbnail} alt="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-[10px] animate-pulse font-medium text-zinc-500">Loading...</div>}
                {task.status === 'success' && <div className="absolute inset-0 bg-emerald-500/80 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-sm animate-[fade-in_0.3s_ease-out] shadow-inner flex-col gap-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> ĐÃ TẢI XONG</div>}
              </div>
              
              <div className="flex-1 flex flex-col justify-center min-w-0 pr-10">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm border border-black/5 dark:border-white/5 ${task.platform?.bg} ${task.platform?.text} shrink-0`}>
                    {task.platform?.name || 'WEB VIDEO'}
                  </span>
                  <div className={`text-base font-bold truncate ${task.status === 'success' ? 'text-emerald-900 dark:text-emerald-100' : 'text-zinc-900 dark:text-zinc-100'}`} title={task.title}>{task.title}</div>
                </div>
                
                <div className={`flex flex-wrap items-center gap-3 mt-1 mb-3 ${task.status === 'success' ? 'opacity-70 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#27272a] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 transition-colors shadow-sm">
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Chất lượng:</span>
                    <select disabled={dl.isProcessing || task.status === 'success'} value={task.selectedResolution} onChange={(e) => dl.setTaskResolution(task.id, e.target.value)} className="text-xs font-black bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer">
                      {task.availableResolutions?.map((res: string) => <option key={res} value={res} className="bg-white dark:bg-zinc-800">{res === 'best' ? 'Nét nhất' : `${res}p`}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#27272a] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 focus-within:border-red-400 transition-colors shadow-sm">
                    <span className="text-[11px] font-bold text-[#FF203B] uppercase tracking-wide flex items-center gap-1">✂ Cắt:</span>
                    <input type="text" placeholder="1:00" disabled={dl.isProcessing || task.status === 'success'} value={task.startTime} onChange={(e) => dl.setTaskStartTime(task.id, e.target.value)} className="w-10 text-xs font-black bg-transparent text-center focus:outline-none focus:bg-white dark:focus:bg-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <span className="text-zinc-400 font-black">-</span>
                    <input type="text" placeholder="2:30" disabled={dl.isProcessing || task.status === 'success'} value={task.endTime} onChange={(e) => dl.setTaskEndTime(task.id, e.target.value)} className="w-10 text-xs font-black bg-transparent text-center focus:outline-none focus:bg-white dark:focus:bg-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  </div>
                </div>
                
                <div className="mt-auto w-full">
                  {task.status === 'downloading' ? (
                    <>
                      <div className="flex justify-between text-[11px] font-bold mb-1.5"><span className="text-[#FF203B] animate-pulse truncate">{t(task.msgKey) || task.msgKey}</span><span className="text-[#FF203B]">{task.percent}%</span></div>
                      <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#FF203B] transition-all duration-300 relative rounded-full"><div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div></div></div>
                    </>
                  ) : (
                    <div className="text-[11px] font-bold">
                      {task.status === 'idle' ? <span className="text-zinc-500 dark:text-zinc-400">Đang chờ lệnh...</span> : task.status === 'success' ? <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">✔ File đã lưu thành công trong thư mục</span> : <span className="text-red-500 dark:text-red-400">❌ {t(task.msgKey) || 'Lỗi tải xuống'}</span>}
                    </div>
                  )}
                </div>
              </div>
              
              <button onClick={() => dl.removeTask(task.id)} disabled={dl.isProcessing} className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 hover:bg-[#FF203B] hover:text-white hover:border-[#FF203B] dark:border-transparent dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 transition-all disabled:hidden shadow-sm hover:rotate-90">✕</button>
            </div>
          ))
        )}
      </div>
      
      <button onClick={dl.handleStartBatch} disabled={dl.isProcessing || dl.queue.length === 0} className={`shrink-0 w-full font-black tracking-widest py-4 rounded-2xl text-xl transition-all flex items-center justify-center gap-3 shadow-lg ${dl.isProcessing || dl.queue.length === 0 ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed shadow-none' : 'bg-[#FF203B] hover:bg-red-600 text-white shadow-red-500/25 hover:-translate-y-1 active:translate-y-0'}`}>
        {dl.isProcessing ? (
          <><svg className="animate-spin h-6 w-6 text-current" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ĐANG XỬ LÝ HÀNG CHỜ...</>
        ) : '🚀 BẮT ĐẦU TẢI TOÀN BỘ'}
      </button>

      {/* ========================================== */}
      {/* 🚀 MODAL HƯỚNG DẪN CHI TIẾT (ĐỒNG BỘ NỀN SÁNG/TỐI) */}
      {/* ========================================== */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
          <div className="bg-white dark:bg-[#1a1a1b] w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800">
            
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#141414]">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  📖 Cẩm Nang Lấy Link Tải Video
                </h2>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Lõi yt-dlp hỗ trợ tải video chất lượng cao từ hơn 1000+ trang web toàn cầu.</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 hover:bg-red-100 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-red-900/30 transition-colors text-zinc-600 dark:text-zinc-400 font-bold">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-[#1a1a1b]">
              
              {/* YouTube */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col sm:flex-row gap-5 items-start transition-colors hover:border-red-300 dark:hover:border-red-900/50">
                <div className="px-4 py-2 bg-[#FF0000] text-white rounded-xl font-black tracking-wider shadow-sm flex items-center gap-2 shrink-0 text-base">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> YouTube
                </div>
                <div className="space-y-1.5 pt-1">
                  <p><strong className="text-zinc-900 dark:text-zinc-100">Video đơn:</strong> Mở video &rarr; Bấm <strong>Chia sẻ (Share)</strong> &rarr; Chọn <strong>Sao chép liên kết</strong>.</p>
                  <p><strong className="text-zinc-900 dark:text-zinc-100">Playlist / Kênh:</strong> Copy URL trực tiếp trên thanh địa chỉ trình duyệt web (VD: youtube.com/playlist?list=...). Ứng dụng sẽ tự động nhận diện và nạp toàn bộ danh sách phát vào hàng chờ!</p>
                </div>
              </div>

              {/* TikTok / Douyin */}
              <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col sm:flex-row gap-5 items-start transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
                <div className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl font-black tracking-wider shadow-sm flex items-center gap-2 shrink-0 text-base">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.02-.24-.03-.48-.03-.71.01-1.13.25-2.25.7-3.29.56-1.32 1.51-2.45 2.72-3.24 1.41-.9 3.08-1.31 4.75-1.21V12.9c-1.35.03-2.65.65-3.55 1.67-.8.88-1.19 2.06-1.14 3.26.04 1.25.64 2.44 1.63 3.19.98.77 2.29.98 3.5.64 1.25-.33 2.27-1.25 2.71-2.47.28-.76.35-1.58.35-2.39V0h3.51z"/></svg> TikTok / Douyin
                </div>
                <div className="space-y-1.5 pt-1">
                  <p>Bấm vào biểu tượng <strong>Mũi tên chia sẻ</strong> ở cạnh phải màn hình điện thoại &rarr; Chọn biểu tượng mắt xích <strong>Sao chép liên kết</strong>.</p>
                  <p className="text-zinc-500">Hỗ trợ tải video không dính watermark (logo mờ) nguyên gốc 100%.</p>
                </div>
              </div>

              {/* Facebook / Instagram */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col gap-3 transition-colors hover:border-blue-300 dark:hover:border-blue-900/50">
                  <div className="w-fit px-3 py-1.5 bg-[#0866FF] text-white rounded-lg font-black tracking-wider shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
                  </div>
                  <p className="text-xs">Bấm nút <strong>Chia sẻ</strong> dưới video/Reel &rarr; Chọn <strong>Sao chép liên kết</strong>. (Video phải ở chế độ Công khai - Public).</p>
                </div>
                
                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col gap-3 transition-colors hover:border-fuchsia-300 dark:hover:border-fuchsia-900/50">
                  <div className="w-fit px-3 py-1.5 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white rounded-lg font-black tracking-wider shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> Instagram
                  </div>
                  <p className="text-xs">Bấm biểu tượng Máy bay giấy (Chia sẻ) &rarr; Chọn <strong>Sao chép liên kết</strong>. (Hỗ trợ Reels & IGTV).</p>
                </div>
              </div>

              {/* Bilibili / Twitter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col gap-3 transition-colors hover:border-sky-300 dark:hover:border-sky-900/50">
                  <div className="w-fit px-3 py-1.5 bg-[#00A1D6] text-white rounded-lg font-black tracking-wider shadow-sm flex items-center gap-2">
                    📺 Bilibili
                  </div>
                  <p className="text-xs">Copy link trực tiếp trên web hoặc App. (Hỗ trợ nạp cả danh sách phát / Anime Series).</p>
                </div>
                
                <div className="flex-1 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141414] shadow-sm flex flex-col gap-3 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
                  <div className="w-fit px-3 py-1.5 bg-zinc-900 text-white dark:bg-zinc-800 rounded-lg font-black tracking-wider shadow-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter (X)
                  </div>
                  <p className="text-xs">Bấm nút Chia sẻ dưới bài viết có chứa Video &rarr; <strong>Sao chép liên kết</strong>.</p>
                </div>
              </div>

              {/* 1000+ Websites - Quy tắc chung */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm flex flex-col sm:flex-row gap-5 items-center">
                <div className="px-4 py-3 bg-emerald-500 text-white rounded-xl font-black tracking-wider shadow-sm flex items-center gap-2 shrink-0 text-base">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg> 1000+ Web Khác
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-emerald-900 dark:text-emerald-100 font-bold">Vimeo, Twitch, SoundCloud, Dailymotion, v.v...</p>
                  <p className="text-emerald-800/80 dark:text-emerald-200/70">Quy tắc chung: Chỉ cần mở trang web có chứa video/audio bạn muốn tải, sau đó <strong>Copy đường link (URL) trên thanh địa chỉ của trình duyệt web</strong> và dán vào phần mềm là xong!</p>
                </div>
              </div>

            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-[#141414] border-t border-zinc-200 dark:border-zinc-800 text-center">
              <button onClick={() => setShowGuide(false)} className="px-10 py-3.5 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900 font-black tracking-wide rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95">ĐÃ HIỂU & ĐÓNG</button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}