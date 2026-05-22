/* eslint-disable */
import React from 'react'

export function PublisherTab({ publisher, t, isDark }: any) {
  const selectedVideo = publisher.videoQueue?.find((v: any) => v.id === publisher.selectedVideoId);

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden animate-soft-up pl-1 pb-4">
      
      {/* ========================================== */}
      {/* 🎬 CỘT 1: HÀNG CHỜ VIDEO (XẾP DỌC)         */}
      {/* ========================================== */}
      <div className={`w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-4 p-4 rounded-2xl border transition-colors duration-500 ${isDark ? 'bg-[#141414] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'} shadow-sm overflow-hidden`}>
        <div className="flex flex-col gap-3 pb-3 border-b border-zinc-500/10 shrink-0">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {t('pubQueueTitle') || 'HÀNG CHỜ'} ({publisher.videoQueue?.length || 0})
            </h3>
          </div>
          
          <button 
            onClick={() => publisher.handleImportVideo && publisher.handleImportVideo()} 
            disabled={publisher.isPublishing || publisher.loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-2.5 rounded-xl text-xs font-black tracking-wide shadow-md hover:shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> {t('pubChooseVideo') || 'CHỌN VIDEO CẦN ĐĂNG'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-2 flex flex-col gap-3">
          {(!publisher.videoQueue || publisher.videoQueue.length === 0) ? (
            <div className={`h-32 flex items-center justify-center text-center px-4 border-2 border-dashed rounded-xl text-[11px] font-bold mt-2 transition-colors ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-zinc-300 text-zinc-400'}`}>
              {t('pubQueueEmpty') || 'Bấm nút Chọn Video để bắt đầu'}
            </div>
          ) : (
            publisher.videoQueue.map((video: any) => {
              const isSelected = publisher.selectedVideoId === video.id;
              return (
                <div 
                  key={video.id}
                  onClick={() => !publisher.isPublishing && publisher.setSelectedVideoId(video.id)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md ${
                    isSelected 
                      ? 'border-red-500 bg-red-500/5 shadow-sm ring-1 ring-red-500/50' 
                      : isDark ? 'border-zinc-800 hover:border-red-500/40 bg-[#1a1a1a]' : 'border-zinc-200 hover:border-red-400/50 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 transition-colors duration-300 ${
                    isSelected ? 'bg-red-500/10' : isDark ? 'bg-zinc-800 group-hover:bg-zinc-700' : 'bg-zinc-100 group-hover:bg-zinc-200'
                  }`}>
                    {video.status === 'success' ? '✅' : video.status === 'processing' ? '⚙️' : '🎬'}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <div className={`text-xs font-bold truncate transition-colors ${isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'}`} title={video.fileName}>
                      {video.fileName}
                    </div>
                    <div className={`text-[10px] font-semibold mt-0.5 capitalize transition-colors ${video.status === 'success' ? 'text-green-500' : video.status === 'processing' ? 'text-orange-500' : 'text-zinc-500'}`}>
                      {t(`status_${video.status}`) || video.status}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); publisher.removeVideo(video.id); }}
                    disabled={publisher.isPublishing}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:rotate-90 disabled:hidden"
                    title={t('pubRemoveBtn') || 'Xóa video'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
        {/* 🚀 BỔ SUNG NÚT RESET Ở ĐÁY CỘT 1 (Chỉ hiện khi có video thành công hoặc lỗi) */}
        {publisher.videoQueue?.some((v: any) => v.status === 'success' || v.status === 'error') && (
          <div className="pt-3 border-t border-zinc-500/10 shrink-0">
            <button 
              onClick={() => publisher.resetAllStatuses && publisher.resetAllStatuses()}
              disabled={publisher.isPublishing || publisher.loading}
              className={`w-full py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/50' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              <span>↻</span> {t('pubResetBtn') || 'LÀM MỚI TRẠNG THÁI'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 📝 CỘT 2: FORM NHẬP LIỆU                   */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2">
        <div className={`flex flex-col gap-5 transition-all duration-500 ${!selectedVideo ? 'opacity-30 pointer-events-none filter blur-[1px]' : ''}`}>
          
          <div className="flex items-center gap-2 px-1">
            <span className="text-xl animate-pulse">📝</span>
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
              {t('pubMetaSection') || 'THÔNG TIN PHÁT HÀNH'}
            </h3>
          </div>

          <div className={`p-6 rounded-2xl border flex flex-col gap-5 shadow-xs transition-colors duration-500 ${isDark ? 'bg-[#141414] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center justify-between px-1 transition-colors group-focus-within:text-red-500">
                <span>{t('pubMetaTitle')}</span>
                {selectedVideo && (
                  <span className="text-red-500/80 truncate max-w-[320px] md:max-w-[450px] xl:max-w-[550px] ml-4 text-right font-bold normal-case tracking-normal" title={selectedVideo.fileName}>
                    ({selectedVideo.fileName})
                  </span>
                )}
              </label>
              <input 
                type="text"
                value={selectedVideo?.metadata.title || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'title', e.target.value)}
                placeholder={t('pubMetaTitlePlace') || 'Nhập tiêu đề thu hút người xem...'}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm font-semibold outline-none transition-all duration-300 focus:ring-4 ${isDark ? 'bg-[#1a1a1a] border-zinc-800 focus:border-red-500/50 focus:ring-red-500/10 hover:border-zinc-600' : 'bg-white border-zinc-300 focus:border-red-400 focus:ring-red-500/10 hover:border-zinc-400'}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1 transition-colors group-focus-within:text-red-500">{t('pubMetaDesc')}</label>
              <textarea 
                value={selectedVideo?.metadata.description || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'description', e.target.value)}
                placeholder={t('pubMetaDescPlace') || 'Viết nội dung mô tả chi tiết cho video của bạn tại đây...'}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm font-medium h-[220px] outline-none resize-none custom-scrollbar transition-all duration-300 focus:ring-4 ${isDark ? 'bg-[#1a1a1a] border-zinc-800 focus:border-red-500/50 focus:ring-red-500/10 hover:border-zinc-600' : 'bg-white border-zinc-300 focus:border-red-400 focus:ring-red-500/10 hover:border-zinc-400'}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            <div className="group">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1 transition-colors group-focus-within:text-red-500">{t('pubMetaTags')}</label>
              <input 
                type="text"
                value={selectedVideo?.metadata.hashtags || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'hashtags', e.target.value)}
                placeholder={t('pubMetaTagsPlace') || 'Ví dụ: shorts, xuhuong, viral'}
                className={`w-full px-4 py-3.5 rounded-xl border text-sm font-semibold outline-none transition-all duration-300 focus:ring-4 ${isDark ? 'bg-[#1a1a1a] border-zinc-800 focus:border-red-500/50 focus:ring-red-500/10 hover:border-zinc-600' : 'bg-white border-zinc-300 focus:border-red-400 focus:ring-red-500/10 hover:border-zinc-400'}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            {/* 🚀 NÚT ĐĂNG ĐƠN LẺ */}
            <div className="flex justify-end mt-2 pt-2 border-t border-zinc-500/5">
              <button
                type="button"
                onClick={() => publisher.handlePublishSingle && publisher.handlePublishSingle(selectedVideo.id, publisher.publishMode)}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
                className={`px-6 py-3 rounded-xl font-black text-xs tracking-widest transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md flex items-center gap-2 hover:-translate-y-0.5 ${
                  publisher.isPublishing || publisher.loading || !selectedVideo
                    ? 'bg-zinc-500/10 text-zinc-500 cursor-not-allowed border border-zinc-500/20'
                    : isDark 
                      ? 'bg-zinc-800 hover:bg-zinc-750 text-red-400 border border-zinc-700 hover:border-red-500/40 shadow-[0_4px_15px_rgba(0,0,0,0.3)]' 
                      : 'bg-zinc-200 hover:bg-zinc-300 text-red-600 border border-zinc-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                }`}
              >
                <span>🚀</span> {t('pubSingleBtn') || 'ĐĂNG RIÊNG VIDEO NÀY'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ⚙️ CỘT 3: NỀN TẢNG & LOGS                  */}
      {/* ========================================== */}
      <div className="w-[300px] xl:w-[360px] shrink-0 flex flex-col h-full gap-6 border-l border-zinc-500/10 pl-6">
        
        <div className="shrink-0">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 block px-1">{t('pubSelectPlatform') || 'CHỌN NỀN TẢNG ĐÍCH'}</label>
          <div className="flex flex-col gap-3">
            {[
              { id: 'youtube', name: 'YouTube Studio', icon: '🔴' },
              { id: 'tiktok', name: 'TikTok Creator', icon: '⚫' },
              { id: 'facebook', name: 'Facebook Page', icon: '🔵' }
            ].map((platform) => {
              const isSelected = publisher.platforms?.[platform.id] || false;
              return (
                <div key={platform.id} className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-pointer ${isSelected ? 'border-red-500/50 bg-red-500/5 shadow-sm' : isDark ? 'border-zinc-800 bg-[#141414] hover:border-zinc-600' : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'}`}>
                  <div className="flex items-center justify-between">
                    <div onClick={() => !publisher.isPublishing && publisher.togglePlatform && publisher.togglePlatform(platform.id)} className={`flex items-center gap-3 text-[11px] xl:text-xs flex-1 font-bold truncate pr-2 transition-colors ${isSelected ? 'text-red-500' : isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      <span className={`transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>{platform.icon}</span>
                      <span className="truncate">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => publisher.handleSetupAccount && publisher.handleSetupAccount(platform.id)} className="text-[10px] text-zinc-500 hover:text-red-500 font-bold uppercase tracking-widest px-2 py-1 rounded bg-black/20 hover:bg-red-500/10 transition-all duration-200">
                        {t('pubSettingBtn') || 'CÀI ĐẶT'}
                      </button>
                      <div onClick={() => !publisher.isPublishing && publisher.togglePlatform && publisher.togglePlatform(platform.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all duration-300 ${isSelected ? 'bg-red-500 border-red-500 text-white scale-110 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'border-zinc-500 text-transparent'}`}>
                        ✓
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 block px-1">{t('pubLogTitle')}</label>
          <div className={`flex-1 rounded-2xl p-4 font-mono text-[10px] xl:text-[11px] leading-relaxed overflow-y-auto custom-scrollbar border transition-colors duration-500 shadow-inner ${isDark ? 'bg-[#121212] border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
            {(!publisher.logs || publisher.logs.length === 0) ? (
              <div className="h-full flex items-center justify-center text-center opacity-40 px-4 animate-pulse">
                {t('pubLogEmpty') || 'Hệ thống đang chờ lệnh...'}
              </div>
            ) : (
              <div className="space-y-1">
                {publisher.logs.map((log: string, i: number) => (
                  <div key={i} className="whitespace-pre-wrap animate-fade-in-up">{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={`p-4 rounded-xl border flex flex-col gap-3 shrink-0 transition-colors duration-500 ${isDark ? 'bg-[#141414] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'}`}>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="publishMode" className="w-4 h-4 accent-red-600 cursor-pointer" checked={publisher.publishMode === 'publish'} onChange={() => publisher.setPublishMode('publish')} disabled={publisher.isPublishing || publisher.loading}/>
              <span className={`text-xs font-bold transition-colors ${isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-black'}`}>{t('pubModePublish') || 'Xuất bản ngay (Công khai)'}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="publishMode" className="w-4 h-4 accent-zinc-500 cursor-pointer" checked={publisher.publishMode === 'draft'} onChange={() => publisher.setPublishMode('draft')} disabled={publisher.isPublishing || publisher.loading}/>
              <span className={`text-xs font-bold transition-colors ${isDark ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-900'}`}>{t('pubModeDraft') || 'Lưu nháp (Không công khai)'}</span>
            </label>
          </div>
        </div>

        <button
          onClick={() => publisher.handlePublish(publisher.publishMode)}
          disabled={publisher.isPublishing || publisher.loading || !publisher.videoQueue || publisher.videoQueue.length === 0}
          className={`relative overflow-hidden w-full shrink-0 py-4 rounded-xl font-black text-xs tracking-widest transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md group ${
            publisher.isPublishing || publisher.loading || !publisher.videoQueue || publisher.videoQueue.length === 0
              ? 'bg-zinc-500/10 text-zinc-500 cursor-not-allowed border border-zinc-500/20'
              : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:-translate-y-1'
          }`}
        >
          {publisher.isPublishing || publisher.loading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin text-sm">⚙</span> {t('processing') || 'ĐANG CHẠY AUTOMATION...'}
            </div>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-2">
              🚀 {t('pubBatchBtn') || 'AUTO BATCH UPLOAD'}
            </span>
          )}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
        </button>
      </div>
    </div>
  )
}