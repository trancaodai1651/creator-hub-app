/* eslint-disable */
import React, { useRef } from 'react'

export function PublisherTab({ publisher, t, isDark }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="w-full h-full flex gap-8 overflow-hidden animate-soft-up pl-1">
      
      {/* ========================================== */}
      {/* 📝 CỘT TRÁI: IMPORT FILE & ĐIỀN METADATA   */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-4">
        
        {/* KHU VỰC IMPORT VIDEO NATIVE */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#141414] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'} flex items-center justify-between shadow-xs`}>
          <div className="flex items-center gap-4 truncate">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-xl shrink-0">
              🎬
            </div>
            <div className="truncate">
              <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                {publisher.videoFile ? publisher.videoFile.name : t('pubNoVideo')}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 font-semibold">
                {publisher.videoFile ? publisher.videoFile.size : "Hỗ trợ định dạng MP4, MOV"}
              </p>
            </div>
          </div>

          {/* 🚀 THẺ <input type="file"> CŨ ĐÃ ĐƯỢC XÓA BỎ HOÀN TOÀN ĐỂ TRÁNH KHÓA FILE */}

          {publisher.videoFile ? (
            <button 
              onClick={publisher.removeVideo}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${isDark ? 'bg-zinc-800 text-red-400 hover:bg-red-500/10' : 'bg-zinc-200 text-red-600 hover:bg-red-50'}`}
            >
              ✕ HỦY
            </button>
          ) : (
            <button 
              onClick={publisher.handleImportVideo} // 🚀 GỌI THẲNG HÀM NATIVE PICKER
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {t('pubChooseVideo')}
            </button>
          )}
        </div>

        {/* CỤM FORM NHẬP METADATA CỦA VIDEO */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1">{t('pubMetaTitle')}</label>
            <input 
              type="text"
              value={publisher.metadata.title}
              onChange={(e) => publisher.setMetadata({ ...publisher.metadata, title: e.target.value })}
              placeholder="Nhập tiêu đề thu hút người xem..."
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:outline-none transition-all ${isDark ? 'bg-[#161616] border-zinc-800 focus:border-red-500/40' : 'bg-white border-zinc-300 focus:border-red-400'}`}
              disabled={publisher.isPublishing}
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1">{t('pubMetaDesc')}</label>
            <textarea 
              value={publisher.metadata.description}
              onChange={(e) => publisher.setMetadata({ ...publisher.metadata, description: e.target.value })}
              placeholder="Viết nội dung mô tả chi tiết cho video của bạn tại đây..."
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium h-36 focus:outline-none resize-none custom-scrollbar transition-all ${isDark ? 'bg-[#161616] border-zinc-800 focus:border-red-500/40' : 'bg-white border-zinc-300 focus:border-red-400'}`}
              disabled={publisher.isPublishing}
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1">{t('pubMetaTags')}</label>
            <input 
              type="text"
              value={publisher.metadata.hashtags}
              onChange={(e) => publisher.setMetadata({ ...publisher.metadata, hashtags: e.target.value })}
              placeholder="shorts, chill, khoanhkhac, xuhuong"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold focus:outline-none transition-all ${isDark ? 'bg-[#161616] border-zinc-800 focus:border-red-500/40' : 'bg-white border-zinc-300 focus:border-red-400'}`}
              disabled={publisher.isPublishing}
            />
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* ⚙️ CỘT PHẢI: CHỌN NỀN TẢNG & MONITOR LOGS   */}
      {/* ========================================== */}
      <div className="w-80 md:w-96 shrink-0 flex flex-col h-full gap-5 border-l border-zinc-500/10 pl-6">
        
        {/* KHU VỰC BẬT TẮT CHỌN NỀN TẢNG ĐĂNG */}
        <div className="shrink-0">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 block px-1">{t('pubSelectPlatform')}</label>
          <div className="flex flex-col gap-2">
            {[
              { id: 'youtube', name: 'YouTube Studio (Shorts/Long)', icon: '🔴' },
              { id: 'tiktok', name: 'TikTok Creator Academy', icon: '⚫' },
              { id: 'facebook', name: 'Facebook Creator Studio', icon: '🔵' }
            ].map((platform) => {
              const isSelected = (publisher.platforms as any)[platform.id]
              return (
                <div
                  key={platform.id}
                  className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all ${
                    isSelected 
                      ? 'border-red-500/40 bg-red-500/5' 
                      : isDark ? 'border-zinc-800 bg-[#141414]' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => !publisher.isPublishing && publisher.togglePlatform(platform.id)}
                      className={`flex items-center gap-3 text-xs cursor-pointer flex-1 font-bold ${isSelected ? 'text-red-500' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      <span>{platform.icon}</span>
                      <span>{platform.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* 👇 NÚT CẤU HÌNH (LOGIN) */}
                      <button 
                        onClick={() => publisher.handleSetupAccount(platform.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-500 font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/20 transition-colors"
                        title="Đăng nhập / Đổi Fanpage mặc định"
                      >
                        ⚙️ Cài Đặt
                      </button>

                      {/* Nút checkmark bật/tắt */}
                      <div 
                        onClick={() => !publisher.isPublishing && publisher.togglePlatform(platform.id)} 
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] cursor-pointer transition-colors ${isSelected ? 'bg-red-500 border-red-600 text-white' : 'border-zinc-500'}`}
                      >
                        {isSelected && "✓"}
                      </div>
                    </div>
                  </div>

                  {/* 👇 NẾU LÀ FACEBOOK, CHO PHÉP NHẬP LINK FANPAGE (Tùy chọn) */}
                  {isSelected && platform.id === 'facebook' && (
                    <input 
                      type="text" 
                      placeholder="Dán Link Facebook Creator Studio của Fanpage vào đây..."
                      className="mt-2 text-[10px] p-2 bg-black/30 border border-zinc-800 rounded w-full outline-none focus:border-blue-500 text-zinc-300"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 🎛️ BẢNG NHẬT KÝ CONSOLE LOGS TRỰC TIẾP TỪ PUPPETEER */}
        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1">{t('pubLogTitle')}</label>
          <div className={`flex-1 rounded-2xl p-4 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar border ${isDark ? 'bg-black/40 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
            {publisher.logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center opacity-40 px-4">
                {t('pubLogEmpty')}
              </div>
            ) : (
              <div className="space-y-1">
                {publisher.logs.map((log: string, i: number) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NÚT KÍCH HOẠT QUY TRÌNH AUTOMATION CHẠY NGẦM */}
        <button
          onClick={publisher.handlePublish}
          disabled={publisher.isPublishing || !publisher.videoFile}
          className={`w-full py-4 rounded-xl font-black text-xs tracking-widest transition-all active:scale-[0.98] cursor-pointer shadow-md ${
            publisher.isPublishing || !publisher.videoFile
              ? 'bg-zinc-500/10 text-zinc-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]'
          }`}
        >
          {publisher.isPublishing ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin text-sm">⚙I</span> {t('processing') || 'ĐANG XỬ LÝ...'}
            </div>
          ) : (
            t('pubBtnPublish') || 'KÍCH HOẠT PHÁT HÀNH'
          )}
        </button>

      </div>
    </div>
  )
}
