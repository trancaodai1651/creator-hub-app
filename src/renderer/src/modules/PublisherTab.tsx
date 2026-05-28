/* eslint-disable */
import React from 'react'

export function PublisherTab({ publisher, t, isDark }: any) {
  const selectedVideo = publisher.videoQueue?.find((v: any) => v.id === publisher.selectedVideoId);

  const bgPanel = isDark ? 'bg-[#141414] border-zinc-800' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textLabel = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const inputBg = isDark ? 'bg-[#1a1a1a] border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900';

  return (
    <div className="w-full h-full flex gap-8 overflow-hidden animate-soft-up p-6">
      
      {/* 🎬 CỘT 1: HÀNG CHỜ VIDEO */}
      <div className={`w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-4 p-5 rounded-3xl border transition-colors duration-500 shadow-sm overflow-hidden ${bgPanel}`}>
        <div className="flex flex-col gap-4 pb-4 border-b border-zinc-500/10 shrink-0">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-xs font-black uppercase tracking-widest ${textLabel}`}>
              {t('pubQueueTitle') || 'HÀNG CHỜ'} ({publisher.videoQueue?.length || 0})
            </h3>
          </div>
          
          <button 
            onClick={publisher.handleImportVideo} 
            disabled={publisher.isPublishing || publisher.loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white py-3.5 rounded-xl text-xs font-black tracking-widest shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.3)] active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 flex justify-center items-center gap-2"
          >
            <span className="text-xl leading-none font-medium mb-0.5">+</span> {t('pubChooseVideo') || 'CHỌN VIDEO'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-1 flex flex-col gap-3 pr-1">
          {(!publisher.videoQueue || publisher.videoQueue.length === 0) ? (
            <div className={`h-40 flex flex-col gap-3 items-center justify-center text-center px-4 border-2 border-dashed rounded-2xl transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800/30 text-zinc-500' : 'border-zinc-300 bg-zinc-50 text-zinc-400'}`}>
              <span className="text-3xl opacity-50 drop-shadow-sm">📥</span>
              <span className="text-xs font-bold leading-relaxed">{t('pubQueueEmpty') || 'Bấm nút Chọn Video để bắt đầu Import'}</span>
            </div>
          ) : (
            publisher.videoQueue.map((video: any) => {
              const isSelected = publisher.selectedVideoId === video.id;
              return (
                <div 
                  key={video.id}
                  onClick={() => !publisher.isPublishing && publisher.setSelectedVideoId(video.id)}
                  className={`group relative flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 ${
                    isSelected 
                      ? 'border-red-500 bg-red-50 shadow-md ring-1 ring-red-500/30 dark:bg-red-500/10' 
                      : isDark ? 'border-zinc-800 hover:border-red-500/40 bg-[#1a1a1a]' : 'border-zinc-200 hover:border-red-400/50 bg-white shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors duration-300 ${
                    isSelected ? 'bg-red-500/10' : isDark ? 'bg-zinc-800 group-hover:bg-zinc-700' : 'bg-zinc-100 group-hover:bg-zinc-200'
                  }`}>
                    {video.status === 'success' ? '✅' : video.status === 'processing' ? '⚙️' : video.status === 'error' ? '❌' : '🎬'}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-6">
                    <div className={`text-xs font-bold truncate transition-colors ${textTitle}`} title={video.fileName}>
                      {video.fileName}
                    </div>
                    <div className={`text-[10px] font-black mt-1 uppercase tracking-wider transition-colors ${video.status === 'success' ? 'text-green-600 dark:text-green-500' : video.status === 'processing' ? 'text-orange-600 dark:text-orange-500' : video.status === 'error' ? 'text-red-600 dark:text-red-400' : textLabel}`}>
                      {t(`status_${video.status}`) || video.status}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); publisher.removeVideo(video.id); }}
                    disabled={publisher.isPublishing}
                    className="absolute right-3 w-7 h-7 rounded-lg bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-transparent hover:bg-red-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:rotate-90 disabled:hidden shadow-sm"
                    title={t('pubRemoveBtn') || 'Xóa video'}
                  >
                    ✕
                  </button>
                </div>
              )
            })
          )}
        </div>
        
        {publisher.videoQueue?.some((v: any) => v.status === 'success' || v.status === 'error') && (
          <div className="pt-4 border-t border-zinc-500/10 shrink-0">
            <button 
              onClick={publisher.handleResetStatuses}
              disabled={publisher.isPublishing || publisher.loading}
              className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-300 shadow-sm'
              }`}
            >
              <span>↻</span> {t('pubResetBtn') || 'LÀM MỚI TRẠNG THÁI'}
            </button>
          </div>
        )}
      </div>

      {/* 📝 CỘT 2: FORM NHẬP LIỆU CHÍNH */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <div className={`flex flex-col gap-5 transition-all duration-500 ${!selectedVideo ? 'opacity-30 pointer-events-none filter blur-[2px]' : ''}`}>
          
          <div className="flex items-center gap-3 px-2">
            <span className="text-2xl animate-bounce">📝</span>
            <h3 className={`text-sm font-black uppercase tracking-widest ${textTitle}`}>
              {t('pubMetaSection') || 'THÔNG TIN PHÁT HÀNH'}
            </h3>
          </div>

          <div className={`p-7 rounded-3xl border flex flex-col gap-6 shadow-sm transition-colors duration-500 ${bgPanel}`}>
            <div className="group">
              <label className={`text-[11px] font-black uppercase tracking-widest mb-3 flex items-center justify-between px-1 transition-colors group-focus-within:text-red-600 ${textLabel}`}>
                <span>{t('pubMetaTitle') || 'TIÊU ĐỀ VIDEO'}</span>
                {selectedVideo && (
                  <span className="text-red-500/80 truncate max-w-[320px] xl:max-w-[450px] ml-4 text-right font-bold normal-case tracking-normal" title={selectedVideo.fileName}>
                    ({selectedVideo.fileName})
                  </span>
                )}
              </label>
              <input 
                type="text"
                value={selectedVideo?.metadata.title || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'title', e.target.value)}
                placeholder={t('pubMetaTitlePlace') || 'Nhập tiêu đề thu hút người xem...'}
                className={`w-full px-5 py-4 rounded-xl border text-sm font-bold outline-none transition-all duration-300 focus:ring-4 focus:border-red-500/50 focus:ring-red-500/10 shadow-inner ${inputBg}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            <div className="group">
              <label className={`text-[11px] font-black uppercase tracking-widest mb-3 block px-1 transition-colors group-focus-within:text-red-600 ${textLabel}`}>{t('pubMetaDesc') || 'MÔ TẢ NỘI DUNG (DESCRIPTION)'}</label>
              <textarea 
                value={selectedVideo?.metadata.description || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'description', e.target.value)}
                placeholder={t('pubMetaDescPlace') || 'Viết nội dung mô tả chi tiết cho video của bạn tại đây...'}
                className={`w-full px-5 py-4 rounded-xl border text-sm font-medium h-[240px] outline-none resize-none custom-scrollbar transition-all duration-300 focus:ring-4 focus:border-red-500/50 focus:ring-red-500/10 shadow-inner ${inputBg}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            <div className="group">
              <label className={`text-[11px] font-black uppercase tracking-widest mb-3 block px-1 transition-colors group-focus-within:text-red-600 ${textLabel}`}>{t('pubMetaTags') || 'HASHTAGS'}</label>
              <input 
                type="text"
                value={selectedVideo?.metadata.hashtags || ''}
                onChange={(e) => publisher.updateMetadata(selectedVideo.id, 'hashtags', e.target.value)}
                placeholder={t('pubMetaTagsPlace') || 'Ví dụ: shorts, xuhuong, viral (cách nhau bởi dấu phẩy)'}
                className={`w-full px-5 py-4 rounded-xl border text-sm font-bold outline-none transition-all duration-300 focus:ring-4 focus:border-red-500/50 focus:ring-red-500/10 shadow-inner ${inputBg}`}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
              />
            </div>

            <div className="flex justify-end mt-4 pt-5 border-t border-zinc-500/10">
              <button
                type="button"
                onClick={() => publisher.handlePublishSingle(selectedVideo.id)}
                disabled={publisher.isPublishing || publisher.loading || !selectedVideo}
                className={`px-8 py-4 rounded-xl font-black text-xs tracking-widest uppercase transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md flex items-center gap-2 hover:-translate-y-1 ${
                  publisher.isPublishing || publisher.loading || !selectedVideo
                    ? (isDark ? 'bg-zinc-800 text-zinc-600 border border-zinc-700' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 shadow-none')
                    : (isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-red-400 border border-zinc-700 shadow-[0_4px_15px_rgba(0,0,0,0.3)]' : 'bg-white hover:bg-red-50 text-red-600 border border-zinc-200 hover:border-red-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]')
                }`}
              >
                <span className="text-lg">🚀</span> {t('pubSingleBtn') || 'ĐĂNG RIÊNG VIDEO NÀY'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ⚙️ CỘT 3: NỀN TẢNG & LOGS */}
      <div className="w-[320px] xl:w-[380px] shrink-0 flex flex-col h-full gap-6">
        
        <div className={`p-5 rounded-3xl border flex flex-col gap-6 shadow-sm shrink-0 ${bgPanel}`}>
          
          {/* DANH SÁCH PROFILE */}
          <div className="group">
            <label className={`text-[11px] font-black uppercase tracking-widest mb-2.5 block px-1 transition-colors group-focus-within:text-red-600 ${textLabel}`}>
              HỒ SƠ KÊNH (PROFILE)
            </label>
            <div className="flex items-center gap-2">
              <select 
                value={publisher.profileName}
                onChange={(e) => publisher.setProfileName(e.target.value)}
                disabled={publisher.isPublishing || publisher.loading}
                className={`flex-1 px-4 py-3.5 rounded-xl border text-sm font-bold outline-none transition-all duration-300 focus:ring-4 focus:border-red-500/50 cursor-pointer ${inputBg}`}
              >
                {(!publisher.savedProfiles || publisher.savedProfiles.length === 0) ? (
                  <option value="">-- Bấm (+) Tạo hồ sơ kênh --</option>
                ) : (
                  publisher.savedProfiles.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))
                )}
              </select>
              
              <button 
                type="button"
                onClick={publisher.handleAddProfile}
                disabled={publisher.isPublishing || publisher.loading}
                title="Thêm Kênh Mới"
                className="w-12 h-[52px] shrink-0 flex items-center justify-center rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-500 hover:text-white transition-all shadow-sm cursor-pointer"
              >
                ➕
              </button>
              
              <button 
                type="button"
                onClick={publisher.handleDeleteProfile}
                disabled={publisher.isPublishing || publisher.loading || !publisher.profileName}
                title="Xóa Kênh Này"
                className="w-12 h-[52px] shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-40"
              >
                🗑️
              </button>
            </div>
            <p className={`text-[10px] font-medium mt-2 px-1 leading-relaxed ${textLabel}`}>
              * Mỗi Hồ sơ lưu riêng biệt một phiên đăng nhập Gmail/TikTok/Facebook.
            </p>
          </div>

          <div className="h-px w-full bg-zinc-500/10"></div>

          {/* CHỌN NỀN TẢNG */}
          <div className="flex flex-col gap-3">
            <label className={`text-[11px] font-black uppercase tracking-widest block px-1 ${textLabel}`}>{t('pubSelectPlatform') || 'CHỌN NỀN TẢNG ĐÍCH'}</label>
            <div className="flex flex-col gap-3">
              {[
                { id: 'youtube', name: 'YouTube Studio', icon: '🔴' },
                { id: 'tiktok', name: 'TikTok Creator', icon: '⚫' },
                { id: 'facebook', name: 'Facebook Page', icon: '🔵' }
              ].map((platform) => {
                const isSelected = publisher.platforms?.[platform.id] || false;
                return (
                  <div key={platform.id} className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md cursor-pointer ${isSelected ? 'border-red-500 bg-red-50 shadow-[0_4px_12px_rgba(239,68,68,0.1)] dark:bg-red-500/10' : isDark ? 'border-zinc-800 bg-[#1a1a1a] hover:border-zinc-600' : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm'}`}>
                    <div className="flex items-center justify-between">
                      <div onClick={() => !publisher.isPublishing && publisher.togglePlatform(platform.id)} className={`flex items-center gap-3 text-xs flex-1 font-bold truncate pr-2 transition-colors ${isSelected ? 'text-red-600 dark:text-red-500' : textTitle}`}>
                        <span className={`transition-transform duration-300 text-xl ${isSelected ? 'scale-110' : 'opacity-70'}`}>{platform.icon}</span>
                        <span className="truncate">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); publisher.handleSetupAccount(platform.id); }} 
                          disabled={!publisher.profileName}
                          className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200 hover:text-zinc-900'}`}
                        >
                          {t('pubSettingBtn') || 'CÀI ĐẶT'}
                        </button>
                        <div onClick={() => !publisher.isPublishing && publisher.togglePlatform(platform.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition-all duration-300 ${isSelected ? 'bg-red-500 border-red-500 text-white scale-110 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'border-zinc-400 text-transparent'}`}>
                          ✓
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className={`absolute inset-0 rounded-3xl p-5 font-mono text-[11px] xl:text-xs font-medium leading-relaxed overflow-y-auto custom-scrollbar border transition-colors duration-500 shadow-inner ${isDark ? 'bg-[#0a0a0a] border-zinc-800/80 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}>
            {(!publisher.logs || publisher.logs.length === 0) ? (
              <div className="h-full flex items-center justify-center text-center opacity-50 px-4 animate-pulse">
                Hàng chờ trống.<br/>Vui lòng nạp video và nhấn Phát hành.
              </div>
            ) : (
              <div className="space-y-2 flex flex-col justify-end min-h-full">
                {publisher.logs.map((log: string, i: number) => (
                  <div key={i} className={`whitespace-pre-wrap animate-fade-in-up ${log.includes('✅') || log.includes('🟢') ? 'text-green-600 dark:text-green-400 font-bold' : log.includes('❌') ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>{log}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🚀 ĐÃ BỔ SUNG: KHỐI PHƯƠNG THỨC ĐĂNG GỒM CẢ PLAYWRIGHT */}
        <div className={`p-5 rounded-3xl border flex flex-col gap-5 shrink-0 transition-colors duration-500 shadow-sm ${bgPanel}`}>
          <div className="flex flex-col gap-3">
            <label className={`text-[10px] font-black uppercase tracking-widest block ${textLabel}`}>CHẾ ĐỘ LƯU</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="publishMode" className="w-4 h-4 accent-red-600 cursor-pointer" checked={publisher.publishMode === 'publish'} onChange={() => publisher.setPublishMode('publish')} disabled={publisher.isPublishing || publisher.loading}/>
                <span className={`text-[11px] font-bold transition-colors ${textTitle}`}>{t('pubModePublish') || 'Công khai'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="radio" name="publishMode" className="w-4 h-4 accent-zinc-500 cursor-pointer" checked={publisher.publishMode === 'draft'} onChange={() => publisher.setPublishMode('draft')} disabled={publisher.isPublishing || publisher.loading}/>
                <span className={`text-[11px] font-bold transition-colors ${textLabel}`}>{t('pubModeDraft') || 'Lưu nháp'}</span>
              </label>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-500/10"></div>

          <div className="flex flex-col gap-3">
            <label className={`text-[10px] font-black uppercase tracking-widest block ${textLabel}`}>PHƯƠNG THỨC ĐĂNG</label>
            <div className="flex flex-col gap-4">
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="uploadMethod" className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer" checked={publisher.uploadMethod === 'puppeteer'} onChange={() => publisher.setUploadMethod('puppeteer')} disabled={publisher.isPublishing || publisher.loading}/>
                <div className="flex flex-col leading-tight">
                  <span className={`text-xs font-bold transition-colors ${textTitle}`}>Trình duyệt giả lập (Puppeteer)</span>
                  <span className={`text-[10px] font-medium mt-1 ${textLabel}`}>Miễn phí, an toàn, giao diện thực tế.</span>
                </div>
              </label>
              
              {/* 🚀 LỰA CHỌN PLAYWRIGHT MỚI TOANH */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="uploadMethod" className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer" checked={publisher.uploadMethod === 'playwright'} onChange={() => publisher.setUploadMethod('playwright')} disabled={publisher.isPublishing || publisher.loading}/>
                <div className="flex flex-col leading-tight">
                  <span className={`text-xs font-bold transition-colors ${textTitle}`}>Trình duyệt tối ưu (Playwright)</span>
                  <span className={`text-[10px] font-medium mt-1 ${textLabel}`}>Tốc độ cao, bảo mật vân tay chống quét anti-bot.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="radio" name="uploadMethod" className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer" checked={publisher.uploadMethod === 'api'} onChange={() => publisher.setUploadMethod('api')} disabled={publisher.isPublishing || publisher.loading}/>
                <div className="flex flex-col leading-tight">
                  <span className={`text-xs font-bold transition-colors ${textTitle}`}>YouTube Data API v3</span>
                  <span className={`text-[10px] font-medium mt-1 ${textLabel}`}>Tốc độ cao, ngầm 100% (Cần Client ID).</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <button
          onClick={() => publisher.handlePublish()} 
          disabled={publisher.isPublishing || publisher.loading || !publisher.videoQueue || publisher.videoQueue.length === 0}
          className={`relative overflow-hidden w-full shrink-0 py-4 rounded-2xl font-black text-sm tracking-widest transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg group ${
            publisher.isPublishing || publisher.loading || !publisher.videoQueue || publisher.videoQueue.length === 0
              ? (isDark ? 'bg-zinc-800 text-zinc-600 border border-zinc-700' : 'bg-zinc-200 text-zinc-400 border border-zinc-300 shadow-none cursor-not-allowed')
              : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_6px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.4)] hover:-translate-y-1'
          }`}
        >
          {publisher.isPublishing || publisher.loading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin text-lg">⚙</span> CHẠY AUTOMATION...
            </div>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-2">
              🚀 AUTO BATCH UPLOAD
            </span>
          )}
        </button>
      </div>
    </div>
  )
}