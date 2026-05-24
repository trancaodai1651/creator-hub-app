/* eslint-disable */
import React, { useState } from 'react'

interface DownloaderTabProps {
  dl: any;
  t: any;
  colors: any;
  isDark: boolean;
}

export const DownloaderTab: React.FC<DownloaderTabProps> = ({ dl, t, colors, isDark }) => {
  const [showGuide, setShowGuide] = useState(false);

  // 🚀 HÀM KHỬ LỖI MAC + KÍCH HOẠT TÌM KIẾM TỨC THÌ KHI ẤN ENTER
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (dl.searchInput.trim()) {
        dl.handleSearch(dl.searchInput.trim());
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-5 overflow-hidden select-none relative text-current p-5 lg:p-6">
      
      {/* HEADER SUB-BAR (🚀 Đglass dọn dẹp: Đã bóc viên thuốc capsule dọc màu đỏ cũ) */}
      <div className="shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black tracking-tight opacity-95">
            {t('dlTitle') || 'Trình Tải Video Đa Nền Tảng'}
          </h3>
        </div>
        
        <button 
          onClick={() => setShowGuide(true)}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 font-bold text-xs rounded-xl transition-all border shadow-sm hover:opacity-80 ${colors.c_bgInput} text-blue-500 border-blue-500/20`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          {t('dlGuideBtn') || 'Cẩm nang'}
        </button>
      </div>

      {/* ========================================== */}
      {/* 🚀 THANH CÔNG CỤ HIỆN ĐẠI (ĐÃ KHAI TỬ THẺ FORM) */}
      {/* ========================================== */}
      <div className={`shrink-0 flex flex-col md:flex-row items-stretch gap-2.5 p-2 rounded-xl border shadow-sm ${colors.c_bgInput} ${colors.c_borderT}`}>
        
        {/* NÚT PASTE (DÁN NHANH LINK TỪ CLIPBOARD) */}
        <button 
          onClick={dl.handleAddFromClipboard} 
          disabled={dl.isProcessing} 
          title={t('dlPasteTooltip')}
          className="shrink-0 bg-[#FF203B] hover:bg-red-600 text-white font-bold w-11 h-11 flex items-center justify-center rounded-xl shadow-md shadow-red-500/10 transition-all active:scale-95 disabled:opacity-70"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        </button>

        {/* KHỐI BOX INPUT MỚI - THAY THẾ FORM ĐỂ CHẶN ĐỨNG HOÀN TOÀN LOG MAC */}
        <div className={`flex-1 min-w-0 relative flex items-center rounded-xl border border-transparent focus-within:border-red-500/40 transition-colors ${colors.c_bgPanel}`}>
          <svg className="absolute left-3.5 w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            disabled={dl.isProcessing} 
            value={dl.searchInput} 
            onChange={(e) => dl.setSearchInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            placeholder={t('dlInputPlaceholder') || "Dán liên kết video hoặc nhập từ khóa cần tìm..."} 
            className="w-full bg-transparent text-current placeholder:opacity-35 text-[13px] font-bold px-3 py-2.5 pl-10 pr-24 focus:outline-none" 
          />
          <button 
            type="button"
            disabled={dl.isProcessing} 
            onClick={() => { if (dl.searchInput.trim()) dl.handleSearch(dl.searchInput.trim()); }}
            className="absolute right-1.5 px-3.5 py-1.5 bg-[#FF203B] hover:bg-red-600 text-white text-xs font-black rounded-lg shadow-sm"
          >
            {t('btnAdd') || '+ THÊM'}
          </button>
        </div>

        {/* THƯ MỤC LƯU & CHẾ ĐỘ NHẸ */}
        <div className={`shrink-0 flex items-center gap-3 px-3 py-1 rounded-xl border ${colors.c_bgPanel} ${colors.c_borderT}`}>
          <div className="flex items-center gap-2 border-r border-current pr-3 opacity-90">
            <span className="text-base" title={t('dlLabelSave')}>📂</span>
            <input type="text" readOnly value={dl.downloadFolder || t('dlDefaultDir') || 'Mặc định'} className="w-24 lg:w-36 bg-transparent text-xs font-bold truncate focus:outline-none cursor-default" />
            <button type="button" disabled={dl.isProcessing} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) dl.setDownloadFolder(path); }} className={`px-2.5 py-1 text-[10px] font-black rounded-lg border shadow-sm hover:opacity-70 ${colors.c_bgInput}`}>{t('btnChange') || 'Đổi'}</button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" checked={dl.isLight} onChange={(e) => dl.setIsLight(e.target.checked)} disabled={dl.isProcessing} />
              <div className={`w-4 h-4 rounded border-2 border-current opacity-30 peer-checked:opacity-100 peer-checked:bg-[#FF203B] peer-checked:border-[#FF203B] transition-all flex items-center justify-center ${colors.c_bgInput}`}>
                <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <span className={`text-[11px] font-black uppercase tracking-wider transition-colors ${colors.c_textSub} group-hover:text-[#FF203B] peer-checked:text-[#FF203B]`}>
              {t('dlLightModeShort') || 'Nhẹ'}
            </span>
          </label>
        </div>
      </div>

      {/* DANH SÁCH HÀNG CHỜ VÀ CÁC THÀNH PHẦN KHÁC */}
      <div className="flex-1 border rounded-2xl overflow-hidden relative flex flex-col custom-scrollbar shadow-inner">
        <div className={`absolute top-0 left-0 right-0 h-10 z-10 bg-gradient-to-b ${isDark ? 'from-zinc-900/40' : 'from-white/40'} to-transparent transition-opacity ${dl.queue.length > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
        
        <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 ${colors.c_bgInput}`}>
          {dl.queue.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-sm font-bold gap-3 ${colors.c_textSub}`}>
              <div className="w-16 h-16 opacity-15">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full fill-current">
                  <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464c-114.7 0-208-93.3-208-208S141.3 48 256 48s208 93.3 208 208-93.3 208-208 208zm16-208v-96c0-8.8-7.2-16-16-16s-16 7.2-16 16v96l-64 64c-6.2 6.2-6.2 16.4 0 22.6s16.4 6.2 22.6 0l57.4-57.4 57.4 57.4c6.2 6.2 16.4 6.2 22.6 0s6.2-16.4 0-22.6l-64-64z"/>
                </svg>
              </div>
              {t('dlQueueEmpty') || 'Hàng chờ trống. Hãy nhập link hoặc từ khóa để bắt đầu!'}
            </div>
          ) : (
            dl.queue.map((task: any) => (
              <div key={task.id} className={`animate-[slide-up_0.15s_ease-out] relative flex flex-col sm:flex-row gap-4 p-3.5 rounded-2xl transition-all border shadow-sm ${task.status === 'success' ? 'border-green-500 bg-green-500/10' : task.status === 'error' ? 'border-red-500 bg-red-500/10' : `${colors.c_bgPanel} ${colors.c_borderT}`}`}>
                <div className={`w-full sm:w-44 h-24 bg-black/10 rounded-xl overflow-hidden shrink-0 relative border ${colors.c_borderT}`}>
                  {task.thumbnail ? <img src={task.thumbnail} alt="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-[10px] animate-pulse font-medium opacity-40">Loading...</div>}
                  {task.status === 'success' && <div className="absolute inset-0 bg-green-500/80 backdrop-blur-[1px] flex items-center justify-center text-white font-bold text-xs animate-[fade-in_0.3s_ease-out] flex-col gap-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> {t('dl_msg_done')}</div>}
                </div>
                
                <div className="flex-1 flex flex-col justify-center min-w-0 pr-10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-sm text-white ${task.platform?.bg.split(' ')[0].replace('/10', '')} shrink-0`}>{task.platform?.name || 'WEB'}</span>
                    <div className="text-[13px] font-black truncate opacity-90" title={task.title}>{task.title}</div>
                  </div>
                  
                  <div className={`flex flex-wrap items-center gap-3.5 mt-1 mb-2 ${task.status === 'success' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-colors shadow-sm ${colors.c_bgInput} ${colors.c_borderT}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${colors.c_textSub}`}>{t('dlLabelRes') || 'Chất lượng'}:</span>
                      <select disabled={dl.isProcessing || task.status === 'success'} value={task.selectedResolution} onChange={(e) => dl.setTaskResolution(task.id, e.target.value)} className="text-[11px] font-black bg-transparent focus:outline-none cursor-pointer text-current">
                        {task.availableResolutions?.map((res: string) => <option key={res} value={res} className="bg-zinc-800 text-white">{res === 'best' ? (t('dlBest') || 'Nét nhất') : `${res}p`}</option>)}
                      </select>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors shadow-sm focus-within:border-red-400 ${colors.c_bgInput} ${colors.c_borderT}`}>
                      <span className="text-[10px] font-bold text-[#FF203B] uppercase tracking-wide flex items-center gap-1">✂ {t('dlLabelCut') || 'Cắt'}:</span>
                      <input type="text" placeholder="1:00" disabled={dl.isProcessing || task.status === 'success'} value={task.startTime} onChange={(e) => dl.setTaskStartTime(task.id, e.target.value)} className="w-10 text-[11px] font-black bg-transparent text-center focus:outline-none placeholder:opacity-30 text-current" />
                      <span className="opacity-50 font-black">-</span>
                      <input type="text" placeholder="2:30" disabled={dl.isProcessing || task.status === 'success'} value={task.endTime} onChange={(e) => dl.setTaskEndTime(task.id, e.target.value)} className="w-10 text-[11px] font-black bg-transparent text-center focus:outline-none placeholder:opacity-30 text-current" />
                    </div>
                  </div>
                
                  <div className="mt-auto w-full">
                    {task.status === 'downloading' ? (
                      <>
                        <div className="flex justify-between text-[9px] font-bold mb-1"><span className="text-[#FF203B] animate-pulse truncate">{t(task.msgKey) || task.msgKey}</span><span className="text-[#FF203B]">{task.percent}%</span></div>
                        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-[#FF203B] transition-all duration-300 relative rounded-full"><div className="absolute inset-0 bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div></div></div>
                      </>
                    ) : (
                      <div className="text-[10px] font-bold">
                        {task.status === 'idle' ? <span className={`${colors.c_textSub}`}>{t('dlStatusIdle') || 'Đang chờ lệnh...'}</span> : task.status === 'success' ? <span className="text-green-500">✔ {t('dlStatusSuccess') || 'Thành công!'}</span> : <span className="text-red-500">❌ {t(task.msgKey) || 'Lỗi'}</span>}
                      </div>
                    )}
                  </div>
                </div>
                
                <button onClick={() => dl.removeTask(task.id)} disabled={dl.isProcessing} className={`absolute right-3.5 top-3.5 w-6 h-6 flex items-center justify-center rounded-full border hover:bg-[#FF203B] hover:text-white hover:border-transparent transition-all shadow-sm text-xs ${colors.c_bgInput} ${colors.c_borderT}`}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* ACTION BUTTON */}
      <button 
        onClick={dl.handleStartBatch} 
        disabled={dl.isProcessing || dl.queue.length === 0} 
        className={`shrink-0 w-full font-black tracking-widest py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-md ${dl.isProcessing || dl.queue.length === 0 ? `opacity-40 cursor-not-allowed ${colors.c_bgInput}` : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:-translate-y-0.5 active:translate-y-0'}`}
      >
        {dl.isProcessing ? `${t('dlBtnProcessing') || 'ĐANG XỬ LÝ...'}` : `🚀 ${t('dlBtnStart') || 'BẮT ĐẦU TẢI XUỐNG'}`}
      </button>

      {/* MODAL KẾT QUẢ TÌM KIẾM */}
      {dl.showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transform-gpu will-change-transform animate-[fade-in_0.12s_ease-out] text-current">
          <div className={`w-full max-w-3xl rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[82vh] border transform-gpu will-change-transform ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <div className={`flex items-center justify-between p-5 border-b ${colors.c_bgInput} ${colors.c_borderT}`}>
              <div>
                <h2 className="text-xl font-black flex items-center gap-2 opacity-90">🔍 {t('dlSearchTitle') || 'Kết quả tìm kiếm cho:'} "{dl.searchInput}"</h2>
                <p className={`text-[11px] font-bold mt-1 ${colors.c_textSub}`}>{t('dlSearchSub') || 'Click vào video để nạp vào hàng chờ.'}</p>
              </div>
              <button onClick={() => dl.setShowSearchModal(false)} className={`w-8 h-8 flex items-center justify-center rounded-full border shadow-sm hover:opacity-70 transition-colors font-bold ${colors.c_bgPanel} ${colors.c_borderT}`}>✕</button>
            </div>
            
            <div className={`p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[250px] ${colors.c_bgPanel}`}>
              {dl.isSearching ? (
                <div className="absolute inset-0 bg-black/5 dark:bg-black/20 flex flex-col items-center justify-center py-12 backdrop-blur-xs z-20">
                  <svg className="animate-spin h-9 w-9 mb-3 text-[#FF203B]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="font-black text-xs uppercase tracking-widest text-[#FF203B]">{t('dlSearchScanning') || 'Đang quét dữ liệu toàn cầu...'}</p>
                </div>
              ) : dl.searchResults?.length === 0 ? (
                <div className="text-center py-12 opacity-50 font-bold">{t('dlSearchEmpty') || 'Không tìm thấy video nào.'}</div>
              ) : (
                dl.searchResults?.map((res: any) => (
                  <div 
                    key={res.id} 
                    onClick={() => { dl.addVideoToQueue(res.url); dl.setShowSearchModal(false); }} 
                    className={`flex gap-4 p-3 rounded-xl border cursor-pointer hover:border-[#FF203B] hover:shadow-md transition-all duration-150 transform-gpu group ${colors.c_bgInput} ${colors.c_borderT}`}
                  >
                    <div className="w-36 h-20 bg-black/10 rounded-lg overflow-hidden shrink-0 relative">
                      {res.thumbnail && <img src={res.thumbnail} alt="thumb" loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">{res.duration}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="text-[13px] font-bold opacity-90 truncate group-hover:text-[#FF203B] transition-colors" title={res.title}>{res.title}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded max-w-[180px] truncate ${colors.c_textSub}`}>{res.channel}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CẨM NANG MODAL */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fade-in_0.15s_ease-out] text-current">
          <div className={`w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <div className={`flex items-center justify-between p-5 border-b ${colors.c_bgInput} ${colors.c_borderT}`}>
              <h2 className="text-lg font-black flex items-center gap-2 opacity-95">📖 {t('dlGuideTitle') || 'Cẩm Nang Lấy Link'}</h2>
              <button onClick={() => setShowGuide(false)} className={`w-8 h-8 flex items-center justify-center rounded-full border shadow-sm font-bold ${colors.c_bgPanel} ${colors.c_borderT}`}>✕</button>
            </div>
            <div className={`p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs font-semibold ${colors.c_bgPanel}`}>
               <div className={`p-4 rounded-xl border flex gap-4 ${colors.c_bgInput} ${colors.c_borderT}`}>
                <div className="px-3 py-1 bg-[#FF0000] text-white rounded font-black tracking-wider shadow-sm text-xs shrink-0">YouTube</div>
                <p className="pt-0.5">{t('dlGuideSingleDesc') || 'Mở video → Bấm Chia sẻ → Chọn Sao chép liên kết.'}</p>
              </div>
            </div>
            <div className={`p-4 border-t text-center ${colors.c_bgInput} ${colors.c_borderT}`}>
              <button onClick={() => setShowGuide(false)} className="px-8 py-2 bg-[#FF203B] hover:bg-red-600 text-white font-black rounded-lg transition-all shadow-md">{t('btnClose') || 'ĐÓNG'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}