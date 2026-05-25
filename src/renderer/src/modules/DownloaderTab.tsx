/* eslint-disable */
import React, { useState } from 'react'

interface DownloaderTabProps {
  dl: any;
  t: any;
  colors: any;
  isDark: boolean;
}

const SUPPORTED_PLATFORMS = [
  { name: 'Instagram', color: 'text-pink-500', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6zm4.4 4.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2zm0 2a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zm4.3-3.1a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z' },
  { name: 'X (Twitter)', color: 'text-zinc-800 dark:text-zinc-200', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.15H5.059z' },
  { name: 'Threads', color: 'text-zinc-800 dark:text-zinc-200', path: 'M14.167 11.026a4.437 4.437 0 0 0-3.326-1.428c-2.316 0-4.008 1.782-4.008 4.227 0 2.457 1.692 4.253 4.02 4.253 1.83 0 3.197-1.077 3.593-2.614h-1.613c-.347.784-1.168 1.242-1.98 1.242-1.353 0-2.325-1.018-2.325-2.73 0-.083.003-.163.008-.242h5.922c.038-.507.038-1.05-.125-1.603a4.137 4.137 0 0 0-.166-.549zm-1.642 1.543h-4.22c.112-1.272.932-2.072 2.1-2.072s1.954.76 2.12 2.072zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.924 16.486c-.958 2.046-2.903 3.328-5.352 3.328-3.315 0-5.837-2.39-5.837-5.918 0-3.52 2.502-5.932 5.795-5.932 2.062 0 3.738 1.055 4.544 2.65l.06-.94h1.564v8.324c0 2.083-.757 3.535-2.016 4.398-1.047.718-2.454.996-3.834.821v-1.638c1.078.117 2.115.013 2.825-.472.82-.562 1.32-1.583 1.32-3.155l-.048-1.466h-.021z' },
  { name: 'Twitch', color: 'text-purple-500', path: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' },
  { name: 'Bilibili', color: 'text-sky-500', path: 'M17.81 4.47c-.4.09-.76.35-1.01.7l-1.57 2.18h-6.46l-1.57-2.18c-.3-.42-.8-.66-1.3-.61-.51.04-.95.36-1.14.84-.19.49-.07 1.04.31 1.4L6.96 8.5H5c-1.65 0-3 1.35-3 3v8c0 1.65 1.35 3 3 3h14c1.65 0 3-1.35 3-3v-8c0-1.65-1.35-3-3-3h-1.96l1.89-1.7c.38-.36.5-1 .31-1.49-.2-.48-.65-.8-1.16-.84h-.27zm1.19 6.03V19.5c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-9c0-.55.45-1 1-1h12c.55 0 1 .45 1 1zm-9 3.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm6 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z' },
  { name: 'Pinterest', color: 'text-red-500', path: 'M12 0C5.4 0 0 5.4 0 12c0 5.1 3.2 9.4 7.6 11.2-.1-.9-.2-2.4 0-3.4.2-.9 1.4-6 1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.4-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.7-7.3 8-7.3 4.2 0 7.4 3 7.4 7 0 4.2-2.6 7.5-6.3 7.5-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1-1 2.4-1.5 3.1 1.1.3 2.3.5 3.6.5 6.6 0 12-5.4 12-12S18.6 0 12 0z' },
  { name: 'Reddit', color: 'text-orange-500', path: 'M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-6.07-1.72l1.27-5.95 4.15.88c.02 1.22 1.03 2.22 2.25 2.22 1.24 0 2.25-1.01 2.25-2.25S21.43.67 20.19.67c-1.02 0-1.89.7-2.16 1.63L13.3 1.3c-.22-.04-.44.08-.5.3l-1.42 6.67c-2.38.06-4.55.72-6.23 1.75C4.58 9.24 3.65 8.75 2.64 8.75c-1.65 0-3 1.35-3 3 0 1.22.75 2.27 1.8 2.74-.03.22-.05.45-.05.69 0 4.34 4.77 7.87 10.63 7.87 5.86 0 10.63-3.53 10.63-7.87 0-.25-.02-.48-.06-.7 1.02-.47 1.76-1.51 1.76-2.73zM7.5 13.88c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm8.56 5.37c-1.18 1.18-3.4 1.25-3.9 1.25s-2.73-.07-3.9-1.25c-.18-.18-.18-.46 0-.64.18-.18.46-.18.64 0 .8.8 2.22.98 3.26.98 1.05 0 2.47-.18 3.26-.98.18-.18.46-.18.64 0 .18.18.18.46 0 .64zm-.56-3.37c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
  { name: 'Vimeo', color: 'text-blue-400', path: 'M22.4 7.2c-.1 2-1.5 4.8-4.2 8.3-2.9 3.7-5.3 5.5-7.2 5.5-1.2 0-2.2-1.1-3.1-3.4-.6-2.1-1.1-4.1-1.7-6.2-.6-2.5-1.3-3.2-2.1-3.2-.2 0-.6.3-1.3.8l-1.1-1.4c1.1-1 2.2-2.1 3.5-3.2 1.6-1.5 2.9-2.3 3.8-2.5 1.8-.4 2.9.4 3.4 2.2.5 2.1.8 3.6 1 4.8.4 2.5.9 3.8 1.5 3.8.5 0 1.2-.7 2.1-2.2.9-1.5 1.4-2.7 1.5-3.6.2-1.7-1.1-2.5-3.8-2.5 1.4-4.5 4.8-5.3 10.2-2.5.8.3 1.2 1.1 1.3 2.2z' }
];

export const DownloaderTab: React.FC<DownloaderTabProps> = ({ dl, t, colors, isDark }) => {
  const [showGuide, setShowGuide] = useState(false);

  const safeT = (key: string, fallback: string): string => {
    if (!key) return fallback;
    const res = t(key);
    if (!res || res === key || res.includes('dl_') || res.includes('DL')) {
      return fallback;
    }
    return res;
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); e.stopPropagation();
      if (dl.searchInput.trim()) dl.handleSearch(dl.searchInput.trim());
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden select-none p-5 lg:p-6 bg-transparent">
      
      <style>{`
        @keyframes shineFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .hover-shine-effect:hover::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: shineFlow 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
          border-radius: inherit;
        }
      `}</style>

      <div className="shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between pl-1">
          <h2 className="text-2xl font-black tracking-tight drop-shadow-sm flex items-center gap-2">
            <span className="text-[28px] drop-shadow-md transform-gpu hover:scale-110 transition-transform">📥</span> {safeT('dlTitle', 'Trình Tải Video')}
          </h2>
          <button onClick={() => setShowGuide(true)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase transition-all shadow-sm active:scale-95 border ${colors.c_bgPanel} ${colors.c_borderT} hover:bg-zinc-500/10`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {safeT('dlGuideBtn', 'Cẩm nang')}
          </button>
        </div>

        <div className={`flex flex-col xl:flex-row gap-3 p-3 rounded-2xl shadow-sm border transition-all ${colors.c_bgPanel} ${colors.c_borderT}`}>
          
          <div className="flex-1 flex items-center gap-3">
            <button onClick={dl.handleAddFromClipboard} title={safeT('dlPasteTooltip', 'Dán link')} className="shrink-0 bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-md shadow-rose-500/20 border border-transparent">
              <svg className="w-5 h-5 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </button>
            
            <div className={`flex-1 flex items-center h-12 rounded-xl px-4 border transition-all focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500/50 ${colors.c_bgInput} ${colors.c_borderT}`}>
              <svg className="w-5 h-5 opacity-40 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={dl.searchInput} onChange={(e) => dl.setSearchInput(e.target.value)} onKeyDown={handleInputKeyDown} spellCheck={false} placeholder={safeT('dlInputPlaceholder', 'Dán link hoặc tìm kiếm...')} className="flex-1 bg-transparent text-[13px] font-bold focus:outline-none placeholder:opacity-40 h-full text-current" />
            </div>
          </div>

          <div className={`flex items-center gap-4 px-4 h-12 rounded-xl border ${colors.c_bgInput} ${colors.c_borderT}`}>
            <div className={`flex items-center gap-3 ${dl.isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-70 transition-opacity'}`} onClick={async () => { if(!dl.isProcessing){ const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) dl.setDownloadFolder(path); }}}>
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-600 dark:text-zinc-300 text-base shadow-inner shrink-0">📁</div>
              <div className="flex flex-col justify-center">
                <span className={`text-[9px] font-black uppercase tracking-widest opacity-50`}>{safeT('dlLabelSave', 'Lưu tại')}</span>
                <span className="text-[11px] font-bold max-w-[120px] truncate opacity-90 mt-0.5">{dl.downloadFolder || safeT('dlDefaultDir', 'Mặc định (Downloads)')}</span>
              </div>
            </div>
            
            <div className="w-px h-6 bg-current opacity-10"></div>

            <label className="flex items-center gap-3 cursor-pointer group min-w-[145px]">
              <div className="flex flex-col items-end justify-center w-full">
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${dl.fastMode ? 'text-rose-500' : 'text-blue-500'}`}>{safeT('dlGlobalFastMode', 'Chế độ')}</span>
                <span className={`text-[11px] font-black uppercase transition-colors mt-0.5 ${dl.fastMode ? 'text-rose-500' : 'text-blue-500'}`}>
                  {dl.fastMode ? safeT('dlFastModeOn', '⚡ TẢI NHANH') : safeT('dlFastModeOff', '✨ CHẤT LƯỢNG CAO')}
                </span>
              </div>
              <div className="relative flex items-center justify-center shrink-0">
                <input type="checkbox" className="peer sr-only" checked={dl.fastMode} onChange={(e) => dl.toggleGlobalFastMode(e.target.checked)} />
                <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 border shrink-0 ${dl.fastMode ? 'bg-rose-500 border-rose-600' : 'bg-blue-600 border-blue-700'}`}>
                  <span className="inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-md" style={{ transform: dl.fastMode ? 'translateX(16px)' : 'translateX(0px)' }} />
                </div>
              </div>
            </label>
          </div>

        </div>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col mt-1">
        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-widest opacity-40">
              {safeT('dlQueueHeader', 'Danh sách chờ')} ({dl.queue.length})
            </span>
            {dl.queue.length > 0 && !dl.isProcessing && (
                <button onClick={dl.handleClearQueue} className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-rose-500/10 active:scale-95">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {safeT('dlBtnClear', 'XÓA TẤT CẢ')}
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-3 py-2 pl-3 pr-4">
          {dl.queue.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-[13px] font-bold gap-4 opacity-40`}>
              <div className="w-24 h-24 bg-current opacity-5 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-4xl opacity-50 grayscale">🛒</span>
              </div>
              {safeT('dlQueueEmpty', 'Hàng chờ đang trống. Hãy dán link để nạp video!')}
            </div>
          ) : (
            dl.queue.map((task: any) => (
              <div key={task.id} className={`group hover-shine-effect relative flex flex-row items-center gap-3.5 p-2.5 mx-1.5 my-1 rounded-[20px] transition-all duration-300 ease-out shadow-sm hover:shadow-lg bg-clip-padding border overflow-hidden ${
                task.status === 'success' 
                  ? 'opacity-60 grayscale-[20%] border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:opacity-100 transition-opacity' 
                  : task.status === 'error' 
                    ? 'border-red-500/30 bg-red-500/5' 
                    : `${colors.c_bgPanel} ${colors.c_borderT} hover:border-zinc-300 dark:hover:border-zinc-500 hover:-translate-y-0.5`
              }`}>
                
                <div className="w-[144px] h-[81px] bg-black/5 dark:bg-white/5 rounded-[14px] overflow-hidden shrink-0 relative shadow-inner">
                  {task.thumbnail ? <img src={task.thumbnail} alt="thumb" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-[9px] animate-pulse opacity-40 font-bold uppercase tracking-widest">Đang tải...</div>}
                  
                  {task.status === 'success' && (
                    <div onClick={() => dl.handlePlayVideo(task.localPath)} className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-zinc-800/90 transition-all duration-300 flex-col gap-1 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                      <svg className="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      <span className="drop-shadow-md">{safeT('dlBtnWatchNow', 'XEM NGAY')}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col min-w-0 justify-between h-[81px] py-0.5 relative z-10">
                  
                  <div className="flex items-center justify-between gap-3 w-full pr-1">
                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm text-white ${task.platform?.bg.split(' ')[0].replace('/10', '')} shrink-0`}>{task.platform?.name || 'WEB'}</span>
                      <h4 className="text-[13px] font-black truncate opacity-90 drop-shadow-sm">{task.title}</h4>
                    </div>
                    {task.status !== 'downloading' && (
                      <button onClick={() => dl.removeTask(task.id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-red-500 hover:text-white transition-all text-[10px] opacity-0 group-hover:opacity-100 shrink-0 shadow-sm border border-transparent hover:border-red-600">✕</button>
                    )}
                  </div>
                  
                  <div className={`flex flex-wrap items-center gap-2 mt-auto mb-1 ${task.status === 'success' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                    
                    <div className="flex items-center px-2 py-1 h-7 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                      <span className="text-[9px] font-black opacity-50 uppercase mr-1.5">{safeT('dlLabelRes', 'Chất lượng')}</span>
                      <select disabled={task.status === 'downloading' || task.status === 'success'} value={task.selectedResolution} onChange={(e) => dl.setTaskResolution(task.id, e.target.value)} className="text-[10px] font-black bg-transparent focus:outline-none cursor-pointer">
                        {task.availableResolutions?.map((res: string) => <option key={res} value={res} className="bg-zinc-800 text-white">{res === 'best' ? safeT('dlBest', 'Tốt nhất') : `${res}p`}</option>)}
                      </select>
                    </div>

                    <div className={`flex items-center px-2 py-1 h-7 rounded-lg bg-black/5 dark:bg-white/5 border shadow-sm transition-all ${task.status === 'downloading' ? 'border-black/5 dark:border-white/5' : task.isLight ? 'border-black/5 dark:border-white/5 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 focus-within:bg-rose-500/5' : 'border-black/5 dark:border-white/5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20 focus-within:bg-blue-500/5'}`}>
                      <span className={`text-[9px] font-black uppercase mr-1.5 transition-colors ${task.isLight ? 'text-rose-500' : 'text-blue-500'}`}>✂ {safeT('dlLabelCut', 'Cắt')}</span>
                      <div className="flex items-center font-mono text-[11px] font-black tracking-widest px-1 py-0.5 rounded">
                        <input type="text" id={`startMin-${task.id}`} placeholder="00" maxLength={2} disabled={task.status === 'downloading' || task.status === 'success'} value={task.startMin} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); dl.setTaskStartMin(task.id, val); if (val.length >= 2) document.getElementById(`startSec-${task.id}`)?.focus(); }} className="w-[18px] bg-transparent text-center focus:outline-none placeholder:opacity-20" />
                        <span className="opacity-40 -mx-0.5">:</span>
                        <input type="text" id={`startSec-${task.id}`} placeholder="00" maxLength={2} disabled={task.status === 'downloading' || task.status === 'success'} value={task.startSec} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); dl.setTaskStartSec(task.id, val); if (val.length >= 2) document.getElementById(`endMin-${task.id}`)?.focus(); }} className="w-[18px] bg-transparent text-center focus:outline-none placeholder:opacity-20" />
                      </div>
                      <span className="mx-1 opacity-20 font-black">-</span>
                      <div className="flex items-center font-mono text-[11px] font-black tracking-widest px-1 py-0.5 rounded">
                        <input type="text" id={`endMin-${task.id}`} placeholder="00" maxLength={2} disabled={task.status === 'downloading' || task.status === 'success'} value={task.endMin} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); dl.setTaskEndMin(task.id, val); if (val.length >= 2) document.getElementById(`endSec-${task.id}`)?.focus(); }} className="w-[18px] bg-transparent text-center focus:outline-none placeholder:opacity-20" />
                        <span className="opacity-40 -mx-0.5">:</span>
                        <input type="text" id={`endSec-${task.id}`} placeholder="00" maxLength={2} disabled={task.status === 'downloading' || task.status === 'success'} value={task.endSec} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); dl.setTaskEndSec(task.id, val); }} className="w-[18px] bg-transparent text-center focus:outline-none placeholder:opacity-20" />
                      </div>
                    </div>

                    <label className={`flex items-center gap-2 px-2 py-1 h-7 rounded-lg border shadow-sm cursor-pointer transition-colors ${task.status === 'downloading' ? 'opacity-50 pointer-events-none' : ''} ${task.isLight ? 'bg-rose-500/10 border-rose-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                      <input type="checkbox" className="hidden" disabled={task.status === 'success'} checked={task.isLight} onChange={(e) => dl.setTaskIsLight(task.id, e.target.checked)} />
                      <div className={`h-4 w-7 rounded-full transition-colors flex items-center px-0.5 border shrink-0 ${task.isLight ? 'bg-rose-500 border-rose-600' : 'bg-blue-500 border-blue-600'}`}>
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform shadow-sm" style={{ transform: task.isLight ? 'translateX(10px)' : 'translateX(0px)' }} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${task.isLight ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {task.isLight ? safeT('dlLocalFastMode', 'Nhanh') : safeT('dlLocalHighQuality', 'Nét')}
                      </span>
                    </label>
                  </div>
                
                  <div className="w-full relative h-[14px] flex items-end">
                    {task.status === 'downloading' ? (
                      <div className="w-full flex items-center gap-2">
                        <div className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${task.isLight ? 'text-rose-500' : 'text-blue-500'}`}>
                          {task.percent}% - <span className="animate-pulse opacity-80">{task.msgKey === 'dl_msg_starting' ? safeT('dl_msg_starting', 'Khởi động...') : task.msgKey === 'dl_msg_cutting' ? safeT('dl_msg_cutting', 'Đang cắt video...') : 'Đang xử lý...'}</span>
                        </div>
                        <div className="flex-1 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-300 rounded-full relative overflow-hidden ${task.isLight ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} style={{ width: `${task.percent}%` }}>
                             <div className="absolute inset-0 bg-white/20 w-full transform -translate-x-full animate-[shineFlow_1s_infinite]" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold w-full">
                        {task.status === 'fetching' ? <span className="text-rose-500 flex items-center gap-1.5"><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> {safeT('dlStatusFetching', 'Đang nạp dữ liệu...')}</span> : 
                         task.status === 'idle' ? <span className="opacity-40">{safeT('dlStatusIdle', 'Đang chờ tải...')}</span> : 
                         task.status === 'success' ? <span className="text-emerald-500 font-black uppercase flex items-center gap-1 animate-[slide-up_0.3s_ease-out]">✔ {safeT('dlStatusSuccess', 'Hoàn tất!')}</span> : 
                         <span className="text-red-500 uppercase font-black">❌ {safeT('dl_msg_error', 'Lỗi tải xuống')}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="shrink-0 pt-1">
        {!dl.isProcessing ? (
          <button 
            onClick={dl.handleStartBatch} 
            disabled={dl.queue.filter((t: any) => t.status === 'idle' || t.status === 'error').length === 0} 
            className={`w-full font-black tracking-[0.2em] uppercase py-3.5 rounded-[16px] text-[13px] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${dl.queue.filter((t: any) => t.status === 'idle' || t.status === 'error').length === 0 ? `opacity-50 cursor-not-allowed ${colors.c_bgInput}` : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            <svg className="w-5 h-5 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {safeT('dlBtnStart', 'BẮT ĐẦU TẢI XUỐNG')}
          </button>
        ) : (
          <button 
            onClick={dl.handleCancelQueue} 
            className="w-full font-black tracking-[0.2em] uppercase py-3.5 rounded-[16px] text-[13px] transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:scale-[1.01] active:scale-95"
          >
            <svg className="w-5 h-5 animate-pulse text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
            {safeT('dlBtnStop', 'DỪNG TIẾN TRÌNH')}
          </button>
        )}
      </div>

      {dl.showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.15s_ease-out]">
          <div className={`w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <div className={`flex items-center justify-between p-6 border-b ${colors.c_borderT}`}>
              <div>
                <h2 className="text-xl font-black">{safeT('dlSearchTitle', 'Kết quả tìm kiếm')}</h2>
                <p className={`text-xs font-bold mt-1 opacity-60`}>{safeT('dlSearchSub', 'Click vào video để nạp vào hàng chờ.')}</p>
              </div>
              <button onClick={() => dl.setShowSearchModal(false)} className={`w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all font-bold`}>✕</button>
            </div>
            <div className={`p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 min-h-[300px]`}>
              {dl.isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                  <svg className="animate-spin h-10 w-10 mb-4 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <p className="font-black text-xs uppercase tracking-widest">{safeT('dlSearchScanning', 'Đang quét dữ liệu...')}</p>
                </div>
              ) : dl.searchResults?.length === 0 ? (
                <div className="text-center py-20 opacity-50 font-bold">{safeT('dlSearchEmpty', 'Không tìm thấy kết quả.')}</div>
              ) : (
                dl.searchResults?.map((res: any) => (
                  <div key={res.id} onClick={() => { dl.addVideoToQueue(res.url); dl.setShowSearchModal(false); }} className={`flex gap-4 p-3 rounded-2xl border cursor-pointer hover:border-zinc-400 hover:shadow-md transition-all group ${colors.c_bgInput} ${colors.c_borderT}`}>
                    <div className="w-40 h-24 bg-black/10 rounded-xl overflow-hidden relative shadow-inner">
                      {res.thumbnail && <img src={res.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />}
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">{res.duration}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
                      <div className="text-[14px] font-black drop-shadow-sm group-hover:text-zinc-500 transition-colors line-clamp-2">{res.title}</div>
                      <div className={`text-[11px] font-bold mt-2 opacity-60 flex items-center gap-1.5`}><span className="w-2 h-2 rounded-full bg-current opacity-40"></span> {res.channel}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.15s_ease-out]">
          <div className={`w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <div className={`flex items-center justify-between p-6 border-b ${colors.c_borderT}`}>
              <h2 className="text-xl font-black flex items-center gap-2">
                <span className="text-2xl drop-shadow-sm">📖</span> 
                {safeT('dlGuideTitle', 'Cẩm nang lấy Link')}
              </h2>
              <button onClick={() => setShowGuide(false)} className={`w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all font-bold`}>✕</button>
            </div>
            
            <div className={`p-6 text-[13px] font-bold flex flex-col gap-4 overflow-y-auto custom-scrollbar ${colors.c_bgPanel}`}>
               <div className="flex flex-col gap-3">
                 <p className="opacity-60 uppercase tracking-widest text-[10px]">{safeT('dlGuideSupport', 'Hướng dẫn lấy liên kết từ các nền tảng chính:')}</p>
                 
                 <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 ${colors.c_bgInput} ${colors.c_borderT}`}>
                   <span className="bg-red-500 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shrink-0 mt-0.5 shadow-md">YouTube</span>
                   <p className="leading-relaxed opacity-80">Mở video muốn tải 👉 Bấm nút <b className="text-red-500">Chia sẻ</b> 👉 Chọn <b>Sao chép liên kết</b>.</p>
                 </div>

                 <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 ${colors.c_bgInput} ${colors.c_borderT}`}>
                   <span className="bg-zinc-800 dark:bg-white dark:text-zinc-900 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shrink-0 mt-0.5 shadow-md">TikTok</span>
                   <p className="leading-relaxed opacity-80">Mở video 👉 Bấm biểu tượng <b className="text-zinc-800 dark:text-white">Chia sẻ</b> 👉 Bấm chọn <b>Sao chép liên kết</b>.</p>
                 </div>

                 <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm transition-colors hover:border-zinc-300 dark:hover:border-zinc-600 ${colors.c_bgInput} ${colors.c_borderT}`}>
                   <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shrink-0 mt-0.5 shadow-md">Facebook</span>
                   <p className="leading-relaxed opacity-80">Bấm vào nút <b className="text-blue-500">Chia sẻ</b> ở dưới Video / Reels 👉 Chọn <b>Sao chép liên kết</b>.</p>
                 </div>
               </div>

               <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 shadow-sm mt-2 ${colors.c_bgInput} ${colors.c_borderT}`}>
                 <span className="text-[11px] font-black uppercase opacity-60 tracking-widest">{safeT('dlGuideSupportAll', 'Nền tảng hỗ trợ tải video trực tiếp:')}</span>
                 <div className="flex flex-wrap gap-2.5">
                   {SUPPORTED_PLATFORMS.map(p => (
                      <div key={p.name} title={p.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:scale-105 hover:shadow-md transition-all cursor-default">
                         <svg className={`w-4 h-4 ${p.color}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d={p.path} />
                         </svg>
                         <span className="text-[10px] font-black tracking-wide">{p.name}</span>
                      </div>
                   ))}
                 </div>
               </div>

            </div>
          </div>
        </div>
      )}

      {dl.previewUrl && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 lg:p-10 bg-black/95 backdrop-blur-2xl animate-[fade-in_0.2s_ease-out]">
          <div className="w-full max-w-5xl flex flex-col gap-4 relative animate-[slide-up_0.2s_ease-out]">
            <div className="flex justify-between items-center px-4">
              <span className="text-xs font-black tracking-widest text-white/50 uppercase">Trình phát Nội bộ</span>
              <button onClick={() => dl.setPreviewUrl(null)} className="bg-white/10 hover:bg-rose-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all active:scale-90 backdrop-blur-md">✕</button>
            </div>
            <div className="w-full aspect-video bg-black rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10">
              <video src={dl.previewUrl} controls autoPlay className="w-full h-full object-contain outline-none" />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}