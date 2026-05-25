/* eslint-disable */
import React from 'react'

interface JoinerTabProps {
  joiner: any
  t: (key: string, data?: any) => string
  isDark: boolean
  colors: { c_bgTab: string; c_bgInput: string; c_btnSec: string; c_bgPanel: string; c_textSub: string; c_borderT: string }
}

export const JoinerTab: React.FC<JoinerTabProps> = ({ joiner, t, isDark, colors }) => {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden w-full select-none bg-transparent p-2 gap-4">
      
      {/* KHU VỰC KÉO THẢ & HIỂN THỊ DANH SÁCH */}
      <div 
        onDrop={joiner.handleDrop} 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
        className={`flex-1 flex flex-col border-2 border-dashed rounded-3xl relative overflow-hidden group transition-all duration-500 ${isDark ? 'border-zinc-700 hover:border-red-500/50 bg-[#16161a]' : 'border-zinc-300 hover:border-red-400 bg-white'}`}
      >
        {joiner.videoList.length === 0 ? (
          <div onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.scanDirectory(path); }} className="w-full h-full flex flex-col items-center justify-center cursor-pointer relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className={`w-24 h-24 mb-6 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-[0_10px_40px_-10px_rgba(239,68,68,0.4)] ${isDark ? 'bg-zinc-800/80 group-hover:bg-red-500/20' : 'bg-zinc-100 group-hover:bg-red-50'}`}>
              <span className="text-5xl drop-shadow-sm">📥</span>
            </div>
            <h3 className={`text-2xl md:text-3xl font-black mb-3 tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>{t('joinTitle', 'Kéo Thả Hoặc Click Chọn Thư Mục')}</h3>
            <div className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-sm backdrop-blur-sm transition-colors ${isDark ? 'bg-zinc-800/50 text-zinc-400 border border-zinc-700' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
              {t('joinEmpty', 'Chưa tải tệp tin nào')}
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full p-6 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="font-black text-lg text-emerald-500 tracking-wide">{t('joinLoadedAZ', { count: joiner.videoList.length })}</span>
              </div>
              <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.scanDirectory(path); }} className={`text-xs font-bold px-5 py-2.5 rounded-xl border hover:shadow-md transition-all active:scale-95 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'}`}>
                🔄 {t('btnChangeFolder', 'Thay đổi thư mục')}
              </button>
            </div>
            <div className={`flex-1 overflow-y-auto border rounded-2xl p-3 shadow-inner custom-scrollbar ${isDark ? 'border-zinc-800/60 bg-[#0f0f12]/80' : 'border-zinc-200 bg-zinc-50/80'}`}>
              {joiner.videoList.map((p: string, i: number) => (
                <div key={i} className={`text-sm p-3.5 border-b last:border-0 truncate font-semibold flex items-center gap-4 transition-colors rounded-xl mb-1 ${isDark ? 'border-zinc-800/50 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200/60 text-zinc-700 hover:bg-white hover:shadow-sm'}`}>
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-red-500/10 text-red-500 font-black text-xs shrink-0">{i + 1}</span> 
                  {p.split(/[/\\]/).pop()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {joiner.isProcessing && ( 
        <div className={`shrink-0 border rounded-3xl p-5 shadow-sm relative overflow-hidden ${isDark ? 'bg-[#16161a] border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent"></div>
          <div className="flex justify-between items-center mb-3 relative z-10">
            <span className={`text-sm font-bold tracking-wide ${joiner.isPaused ? 'text-yellow-500' : 'animate-pulse text-blue-500'}`}>⚡ {joiner.progressMsg}</span>
            <span className="text-sm font-black text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg shadow-inner">{joiner.progressPercent}%</span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden border relative z-10 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            <div className={`h-full transition-all duration-300 relative ${joiner.isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-red-500 to-rose-600'}`} style={{ width: `${joiner.progressPercent}%` }}>
              {!joiner.isPaused && <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>}
            </div>
          </div>
        </div> 
      )}
      
      {/* BENTO GRID CONTROLS */}
      <div className="shrink-0 flex items-stretch gap-4 w-full h-[220px]">
        
        {/* THẺ 1: CHIẾN THUẬT & PHẦN CỨNG */}
        <div className={`flex-1 flex flex-col justify-between p-5 rounded-[24px] border shadow-sm ${isDark ? 'bg-[#16161a] border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b pb-2 border-zinc-500/5">
              <label className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{t('joinDuration', 'THỜI LƯỢNG KỊCH BẢN')}</label>
              <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1 shadow-inner ${isDark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <input type="number" value={joiner.minTime} onChange={(e) => joiner.setMinTime(Number(e.target.value))} className="w-12 bg-transparent text-center text-sm font-black focus:text-red-500 focus:outline-none" />
                <span className="text-zinc-500 font-bold">-</span>
                <input type="number" value={joiner.maxTime} onChange={(e) => joiner.setMaxTime(Number(e.target.value))} className="w-12 bg-transparent text-center text-sm font-black focus:text-red-500 focus:outline-none" />
                <span className="text-[11px] font-bold text-zinc-400 pl-0.5">Phút</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="flex items-center justify-between cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-zinc-500/5 transition-colors">
                <input type="checkbox" className="hidden" checked={joiner.requirePillar} onChange={(e) => { const val = e.target.checked; joiner.setRequirePillar(val); if (val) joiner.setSingleMode(false); }} />
                <span className={`text-sm font-bold truncate pr-2 ${joiner.requirePillar ? 'text-red-500' : (isDark ? 'text-zinc-400' : 'text-zinc-600')}`}>{t('joinPillar', 'Chứa 1 video dài (Trụ cột)')}</span>
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${joiner.requirePillar ? 'bg-red-500' : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${joiner.requirePillar ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer group px-2 py-1.5 rounded-xl hover:bg-zinc-500/5 transition-colors">
                <input type="checkbox" className="hidden" checked={joiner.singleMode} onChange={(e) => { const val = e.target.checked; joiner.setSingleMode(val); if (val) joiner.setRequirePillar(false); }} />
                <span className={`text-sm font-bold truncate pr-2 ${joiner.singleMode ? 'text-blue-500' : (isDark ? 'text-zinc-400' : 'text-zinc-600')}`}>{t('joinSingleMode', 'Xử lý đơn lẻ 1-1 (Không gộp)')}</span>
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${joiner.singleMode ? 'bg-blue-500' : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${joiner.singleMode ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>
          </div>

          <div className={`flex items-center justify-between border-t pt-3 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
            <label className="flex items-center gap-2.5 cursor-pointer group max-w-[60%]">
              <input type="checkbox" className="hidden" checked={joiner.useGpu} onChange={(e) => joiner.setUseGpu(e.target.checked)} />
              <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${joiner.useGpu ? 'bg-orange-500' : (isDark ? 'bg-zinc-700' : 'bg-zinc-300')}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${joiner.useGpu ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              
              <span className={`text-xs font-bold tracking-wide truncate transition-colors ${joiner.useGpu ? (isDark ? 'text-orange-500' : 'text-orange-600') : (isDark ? 'text-zinc-400' : 'text-zinc-500')}`} title={joiner.useGpu ? joiner.gpuName : joiner.cpuName}>
                {joiner.useGpu ? joiner.gpuName : joiner.cpuName}
              </span>
            </label>
            
            <select 
              value={joiner.hardwareMode || 'max'} 
              onChange={(e) => joiner.setHardwareMode(e.target.value)} 
              className={`border text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none shadow-sm cursor-pointer transition-colors ${
                joiner.useGpu 
                  ? (isDark ? 'text-orange-400 bg-zinc-900 border-zinc-700' : 'text-orange-600 bg-orange-50 border-orange-200')
                  // 🚀 ĐÃ SỬA: Bám sát thiết kế Light Mode CPU (Nền xanh nhạt, viền xanh dương, chữ xanh đậm)
                  : (isDark ? 'text-blue-400 bg-zinc-900 border-zinc-700' : 'text-blue-600 bg-blue-50 border-blue-200')
              }`}
            >
              {joiner.useGpu ? (
                <>
                  <option value="max">🔥 Max Speed</option>
                  <option value="balanced">⚖️ GPU Balance</option>
                  <option value="low">❄️ GPU Eco</option>
                </>
              ) : (
                <>
                  <option value="max">🔥 CPU Max</option>
                  <option value="balanced">🌀 CPU Balance</option>
                  <option value="low">❄️ CPU Eco</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* THẺ 2: PHÂN KHU ĐỒ HỌA & NƠI LƯU */}
        <div className={`flex-[1.35] flex flex-col justify-between p-5 rounded-[24px] border shadow-sm ${isDark ? 'bg-[#16161a] border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>ĐÓNG DẤU LOGO</label>
              <div className="flex items-center gap-2 w-full">
                <input type="text" readOnly value={joiner.logoPath || "No Logo Mode"} className={`flex-1 border rounded-xl px-3 py-1.5 text-xs font-medium truncate focus:outline-none min-w-0 shadow-inner ${isDark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} />
                <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-logo-dialog'); if (path) joiner.setLogoPath(path); }} className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'}`}>Chọn</button>
                {joiner.logoPath && <button onClick={() => joiner.setLogoPath('')} className="text-xs text-red-500 font-bold px-2 py-1.5 shrink-0 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors">✕</button>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
               <label className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>KÍCH THƯỚC: <span className="text-red-500 font-bold ml-1">{joiner.logoSize}</span></label>
               <input type="range" min="50" max="300" step="10" value={joiner.logoSize} onChange={(e) => joiner.setLogoSize(Number(e.target.value))} className="w-full mt-2.5 accent-red-500 cursor-pointer" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>VỊ TRÍ HIỂN THỊ LOGO</label>
              <select value={joiner.logoPosition} onChange={(e) => joiner.setLogoPosition(e.target.value)} className={`w-full border text-xs font-bold rounded-xl px-3 py-1.5 focus:border-red-500 focus:outline-none shadow-sm cursor-pointer h-[32px] ${isDark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <option value="top-left">Góc Trái Trên</option><option value="top-right">Góc Phải Trên</option><option value="bottom-left">Góc Trái Dưới</option><option value="bottom-right">Góc Phải Dưới</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className={`text-[11px] font-black uppercase tracking-widest ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>TỶ LỆ KHUNG HÌNH XUẤT</label>
              <select value={joiner.joinRatio} onChange={(e) => joiner.setJoinRatio(e.target.value)} className={`w-full border text-xs text-red-500 font-black rounded-xl px-3 py-1.5 focus:border-red-500 focus:outline-none shadow-sm cursor-pointer h-[32px] ${isDark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                <option value="original">Bản gốc (Original Layout)</option><option value="16:9">Ngang chuẩn 16:9 (Youtube)</option><option value="9:16">Dọc 9:16 (Shorts/Reels/Tiktok)</option><option value="1:1">Vuông 1:1 (Square Feed)</option>
              </select>
            </div>
          </div>

          <div className={`flex items-center gap-3 border-t pt-4 mt-1 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
            <input type="text" readOnly value={joiner.outputFolder || "Lưu cùng thư mục đầu vào (Mặc định)"} className={`flex-1 border rounded-xl px-3 py-1.5 text-xs font-medium truncate focus:outline-none shadow-inner ${isDark ? 'bg-[#0f0f12] border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`} />
            <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.setOutputFolder(path); }} className={`text-xs font-bold px-4 py-1.5 rounded-xl border transition-all active:scale-95 ${isDark ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'}`}>Đổi nơi lưu</button>
          </div>
        </div>

        {/* 🚀 THẺ 3: NÚT RUN KHỔNG LỒ (ĐÃ KHÔI PHỤC LẠI MÀU ĐỎ ĐẸP MẮT) */}
        <div className="w-[180px] shrink-0 flex flex-col">
          {!joiner.isProcessing ? ( 
            <button onClick={joiner.handleStartProcess} className="w-full h-full bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-[24px] flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_15px_30px_-10px_rgba(239,68,68,0.6)] hover:-translate-y-1 active:scale-95 border border-red-400/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20"></div>
              <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">🚀</span>
              <span className="font-black text-xl tracking-wide drop-shadow-md z-10">VẬN HÀNH</span>
              <span className="text-[10px] font-bold text-red-100 uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-md mt-1 z-10">BẮT ĐẦU NGAY</span>
            </button> 
          ) : ( 
            <div className="flex flex-col gap-3 h-full">
              <button onClick={joiner.handlePauseToggle} className={`flex-1 rounded-[20px] font-black text-sm text-white shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${joiner.isPaused ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30' : 'bg-zinc-700 hover:bg-zinc-600 shadow-zinc-900/30'}`}>
                <span className="text-2xl">{joiner.isPaused ? '▶️' : '⏸'}</span>
                <span>{joiner.isPaused ? 'TIẾP TỤC' : 'TẠM DỪNG'}</span>
              </button>
              <button onClick={joiner.handleCancel} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-[20px] text-sm shadow-lg shadow-red-600/30 transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                <span className="text-2xl">⏹</span>
                <span>HỦY BỎ</span>
              </button>
            </div> 
          )}
        </div>

      </div>
    </div>
  )
}