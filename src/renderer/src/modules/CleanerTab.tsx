/* eslint-disable */
import React from 'react'

export const CleanerTab: React.FC<{ clean: any, t: any, colors: any, isDark: boolean }> = ({ clean, t, colors }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-hidden ${colors.c_bgPanel}`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('cleanerTitle')}</h3>
        <p className={`text-sm ${colors.c_textSub}`}>{t('cleanerSub')}</p>
      </div>
      {/* ĐÃ SỬA LỖI: Gọi hàm formatBytes kết hợp tổng dung lượng realtime từ Hook */}
      <div className="bg-red-500/10 border border-red-500/30 text-red-500 font-bold px-5 py-2.5 rounded-xl text-sm">
        {clean.isScanningJunk ? t('cleanerScanWait') : t('cleanerTotal', { size: clean.formatBytes(clean.totalJunkBytes) })}
      </div>
    </div>
    
    <div className="flex gap-4 border-t pt-4 border-zinc-500/10 shrink-0">
      <button onClick={clean.handleScanJunkFiles} disabled={clean.isScanningJunk} className={`flex-1 py-4 rounded-xl font-bold text-base border cursor-pointer transition-all ${colors.c_btnSec} disabled:opacity-40`}>
        {clean.isScanningJunk ? t('cleanerScanWait') : t('cleanerScanBtn')}
      </button>
      <button onClick={clean.handleExecuteCleanJunk} disabled={clean.isScanningJunk || clean.selectedJunkIds.length === 0 || clean.totalJunkBytes === 0} className="bg-red-600 hover:bg-red-500 text-white font-bold text-base px-12 py-4 rounded-xl transition-all disabled:bg-zinc-600 shrink-0 cursor-pointer">
        {t('cleanerCleanBtn')}
      </button>
    </div>
    
    <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium">
      <div className="grid grid-cols-1 divide-y divide-zinc-500/10">
        {clean.isScanningJunk && (clean.junkList || []).length === 0 ? (
          <div className="p-20 text-center text-red-500 text-base font-bold animate-pulse">{t('cleanerScanning')}</div>
        ) : (clean.junkList || []).length === 0 ? (
          <div className="p-16 text-center text-zinc-400 font-semibold">{t('cleanerEmpty')}</div>
        ) : (clean.junkList || []).map((junk: any) => {
          const isChecked = clean.selectedJunkIds.includes(junk.id); 
          return (
            <div key={junk.id} onClick={() => !clean.isScanningJunk && clean.setSelectedJunkIds(isChecked ? clean.selectedJunkIds.filter((id: string) => id !== junk.id) : [...clean.selectedJunkIds, junk.id])} className={`p-5 flex items-center justify-between transition-colors select-none cursor-pointer ${isChecked ? 'bg-red-500/5' : 'hover:bg-zinc-500/5'}`}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-5 h-5 border rounded flex items-center justify-center shrink-0 ${colors.c_bgInput}`}>{isChecked && <span className="text-red-500 font-bold text-xs">✓</span>}</div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-red-500 truncate">{junk.name}</span>
                  <span className={`text-xs mt-0.5 ${colors.c_textSub}`}>{junk.desc}</span>
                  <span className="text-[10px] text-zinc-500 truncate font-mono mt-1">{junk.path}</span>
                </div>
              </div>
              <div className="text-right pl-6 shrink-0">
                <span className="text-sm font-bold text-orange-500">{clean.formatBytes(junk.size)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </div>
)