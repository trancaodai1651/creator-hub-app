/* eslint-disable */
import React from 'react'

export const UninstallerTab: React.FC<{ un: any, t: any, colors: any, isDark: boolean, platform: string }> = ({ un, t, colors, isDark, platform }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-hidden select-none ${colors.c_bgPanel}`}>
    <div className="flex justify-between items-start">
      <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('uninsTitle')}</h3><p className={`text-sm ${colors.c_textSub}`}>{t('uninsSub')}</p></div>
      <div className="bg-red-500/10 border border-red-500/30 text-red-500 font-bold px-4 py-2 rounded-xl text-xs">{t('uninsTotal', { count: un.systemApps.length })}</div>
    </div>
    <div className="flex items-center gap-3 w-full border-t pt-4 border-zinc-500/10">
      <input type="text" value={un.uninstallerSearch} onChange={(e) => un.setUninstallerSearch(e.target.value)} placeholder={t('uninsSearch')} className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold focus:border-red-500 focus:outline-none ${colors.c_bgInput}`} />
      <button onClick={un.loadSystemApps} disabled={un.isScanningApps} className={`text-xs font-bold px-5 py-3.5 rounded-xl border shrink-0 ${colors.c_btnSec}`}>{un.isScanningApps ? t('uninsScanning') : t('uninsRescan')}</button>
    </div>
    <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium relative">
      <table className="w-full text-left border-collapse table-fixed">
        <thead className="sticky top-0 z-10">
          <tr className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b font-bold text-zinc-400`}><th className="p-3 w-1/3">{t('uninsCol1')}</th><th className="p-3 w-1/4">{t('uninsCol2')}</th><th className="p-3 w-1/6 text-center">{t('uninsCol3')}</th><th className="p-3 w-1/6 text-center">{t('uninsCol4')}</th></tr>
        </thead>
        <tbody>
          {un.isScanningApps ? (<tr><td colSpan={4} className="p-20 text-center text-red-500 text-sm font-bold animate-pulse">{t('uninsWait') || 'ĐANG TRUY VẤN DỮ LIỆU...'}</td></tr>) : un.systemApps.length === 0 ? (<tr><td colSpan={4} className="p-10 text-center text-zinc-400 font-semibold">{t('uninsEmpty')}</td></tr>) : un.systemApps.filter((app: any) => app.name?.toLowerCase().includes(un.uninstallerSearch.toLowerCase())).map((appInfo: any, idx: number) => (
            <tr key={idx} className={`border-b ${isDark ? 'border-zinc-900/50 hover:bg-zinc-900/40' : 'border-zinc-200/50 hover:bg-zinc-50'}`}>
              <td className="p-3 font-bold truncate text-red-500 flex items-center gap-2"><span>📱</span> <span className="truncate">{appInfo.name}</span></td>
              <td className="p-3 truncate text-zinc-400" title={appInfo.path}>{appInfo.publisher || t('uninsUnknown')}</td>
              <td className="p-3 text-center text-zinc-500 font-semibold">{appInfo.version || "---"}</td>
              <td className="p-3 text-center"><button onClick={() => un.handleCleanUninstall(appInfo)} className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer active:scale-95">{platform === 'darwin' ? t('uninsBtnMac') : t('uninsBtnWin') || 'GỠ CÀI ĐẶT'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      {un.uninstallConfirm?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] transition-all backdrop-blur-xs p-4 animate-fadeIn">
          <div className={`w-[540px] p-7 rounded-3xl border ${colors.c_bgPanel} border-zinc-500/10 shadow-2xl relative flex flex-col gap-5 text-left`}>
            <div className="flex items-center gap-3 border-b pb-3.5 border-zinc-500/10">
              <span className="text-3xl">🗑️</span>
              <div className="flex flex-col"><h4 className="text-lg font-black text-red-500 tracking-wide uppercase">{t('uninsModalTitle')}</h4><p className={`text-[11px] font-semibold ${colors.c_textSub}`}>{t('uninsModalSub')}</p></div>
            </div>
            <p className="text-sm font-bold leading-relaxed py-1">{t('uninsConfirmQuestion', { name: un.uninstallConfirm.appInfo.name })}</p>
            <div className="grid grid-cols-2 gap-4 my-1">
              <div onClick={() => un.setUninstallConfirm({ ...un.uninstallConfirm, mode: 'clean' })} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 items-start select-none ${un.uninstallConfirm.mode === 'clean' ? 'border-red-500 bg-red-500/5' : 'border-zinc-500/10 hover:border-zinc-500/30'}`}>
                <span className="text-xl mt-0.5">🛡️</span>
                <div className="flex flex-col gap-0.5"><span className="text-xs font-black uppercase text-red-500">{t('uninsModeCleanTitle')}</span><span className="text-[10px] font-bold text-green-500">{t('uninsModeCleanBadge')}</span><span className={`text-[11px] font-medium leading-normal mt-1 ${colors.c_textSub}`}>{t('uninsModeCleanDesc')}</span></div>
              </div>
              <div onClick={() => un.setUninstallConfirm({ ...un.uninstallConfirm, mode: 'basic' })} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex gap-3 items-start select-none ${un.uninstallConfirm.mode === 'basic' ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-500/10 hover:border-zinc-500/30'}`}>
                <span className="text-xl mt-0.5">⚡</span>
                <div className="flex flex-col gap-0.5"><span className="text-xs font-black uppercase text-amber-500">{t('uninsModeBasicTitle')}</span><span className="text-[10px] font-bold text-zinc-500">{t('uninsModeBasicBadge')}</span><span className={`text-[11px] font-medium leading-normal mt-1 ${colors.c_textSub}`}>{t('uninsModeBasicDesc')}</span></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4 border-zinc-500/10 mt-1">
              <button onClick={() => un.setUninstallConfirm(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-zinc-500/10 hover:bg-zinc-500/20 transition-all cursor-pointer">{t('uninsBtnCancel')}</button>
              <button onClick={un.confirmAndExecuteUninstall} className="px-6 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-md transition-all active:scale-[0.97] cursor-pointer">{t('uninsBtnConfirm')}</button>
            </div>
          </div>
        </div>
      )}
      
      {/* ====================================================================
      MODAL 2: MÀN HÌNH KHÓA TIẾN TRÌNH 3 BƯỚC + DẤU X VÀ NÚT ÉP ĐI TIẾP
      ==================================================================== */}
      {un.uninsProgress?.show && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] backdrop-blur-md transition-all">
          <div className={`w-[520px] p-8 rounded-3xl border ${isDark ? 'bg-[#141414] border-zinc-800' : 'bg-white border-zinc-200'} shadow-2xl flex flex-col gap-6 text-center relative`}>
            
            {/* DẤU X ĐỂ HỦY QUÁ TRÌNH */}
            <button onClick={un.handleCancelProgress} className="absolute top-5 right-6 text-xl font-bold text-zinc-600 hover:text-red-500 transition-colors">
              ✕
            </button>

            <div className="flex justify-center gap-6 items-center my-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${un.uninsProgress.percent <= 35 ? 'bg-orange-500 border-orange-600 text-white animate-pulse shadow-lg shadow-orange-500/20' : 'bg-green-600 border-green-700 text-white'}`}>1</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Prepare</span>
              </div>
              <div className="w-12 h-0.5 bg-zinc-700 -mt-4"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${un.uninsProgress.percent > 35 && un.uninsProgress.percent <= 65 ? 'bg-yellow-500 border-yellow-600 text-white animate-pulse shadow-lg shadow-yellow-500/20' : un.uninsProgress.percent > 65 ? 'bg-green-600 border-green-700 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>2</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Registry</span>
              </div>
              <div className="w-12 h-0.5 bg-zinc-700 -mt-4"></div>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${un.uninsProgress.percent > 65 ? 'bg-green-500 border-green-600 text-white animate-pulse shadow-lg shadow-green-500/20' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>3</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Folder</span>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-red-500 tracking-wide uppercase">Deep Clean Uninstall Engine</h3>
            
            <div className="w-full mt-2">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-red-500 truncate max-w-[400px] animate-pulse">{un.uninsProgress.msg}</span>
                <span className="text-red-500 font-black">{un.uninsProgress.percent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden border border-zinc-800 bg-[#0f0f0f]">
                <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-300" style={{ width: `${un.uninsProgress.percent}%` }}></div>
              </div>

              {/* NÚT ÉP QUÉT XUẤT HIỆN KHI BỊ KẸT Ở BƯỚC 1 (Dưới 35%) */}
              {un.uninsProgress.percent <= 35 && (
                <div className="mt-5 flex justify-center animate-fadeIn">
                  <button onClick={un.handleForceContinue} className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300 underline decoration-zinc-700 hover:decoration-zinc-400 underline-offset-4 transition-all">
                    Đã gỡ xong mà vẫn chưa chạy? Bấm vào đây để Quét Rác ngay
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
  </div>
)