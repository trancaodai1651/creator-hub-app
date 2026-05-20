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
    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden w-full">
      <div 
        onDrop={joiner.handleDrop} 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} 
        className={`flex-1 flex flex-col border-2 border-dashed rounded-3xl relative overflow-hidden group hover:border-red-500/50 transition-colors ${colors.c_bgTab}`}
      >
        {joiner.videoList.length === 0 ? (
          <div onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.scanDirectory(path); }} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            <span className="text-6xl mb-4 group-hover:-translate-y-2 transition-transform duration-300">📥</span>
            <h3 className="text-2xl font-bold mb-2">{t('joinTitle')}</h3>
            <div className={`border px-4 py-2 rounded-full text-sm font-semibold ${colors.c_bgInput}`}>{t('joinEmpty')}</div>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full p-6">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="font-bold text-base text-red-500">{t('joinLoadedAZ', { count: joiner.videoList.length })}</span>
              <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.scanDirectory(path); }} className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${colors.c_btnSec}`}>{t('btnChangeFolder')}</button>
            </div>
            <div className={`flex-1 overflow-y-auto border rounded-2xl p-3 shadow-inner ${isDark ? 'border-zinc-800 bg-[#0f0f0f]' : 'border-zinc-200 bg-zinc-50'}`}>
              {joiner.videoList.map((p: string, i: number) => (
                <div key={i} className={`text-sm p-3 border-b last:border-0 truncate font-medium flex items-center gap-3 ${isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900/50' : 'border-zinc-200 text-zinc-700 hover:bg-white'} transition-colors rounded-lg`}>
                  <span className="text-red-500 font-bold min-w-[24px]">{i + 1}.</span> {p.split(/[/\\]/).pop()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {joiner.isProcessing && ( 
        <div className={`shrink-0 border rounded-2xl p-5 ${colors.c_bgPanel}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${joiner.isPaused ? 'text-yellow-500' : 'animate-pulse'}`}>{joiner.progressMsg}</span>
            <span className="text-sm font-bold text-red-500">{joiner.progressPercent}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${colors.c_bgInput}`}>
            <div className={`h-full transition-all duration-300 ${joiner.isPaused ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${joiner.progressPercent}%` }}></div>
          </div>
        </div> 
      )}
      
      <div className={`shrink-0 border rounded-3xl p-6 flex items-center gap-8 w-full ${colors.c_bgPanel}`}>
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3"><label className={`${colors.c_textSub} text-sm font-medium`}>{t('joinDuration')}</label><div className="flex items-center gap-2"><input type="number" value={joiner.minTime} onChange={(e) => joiner.setMinTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${colors.c_bgInput}`} /><span className="text-gray-500">-</span><input type="number" value={joiner.maxTime} onChange={(e) => joiner.setMaxTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${colors.c_bgInput}`} /><span className={`${colors.c_textSub} text-sm`}>{t('joinMinutes')}</span></div></div>
            <label className="flex items-center gap-3 cursor-pointer select-none"><input type="checkbox" checked={joiner.requirePillar} onChange={(e) => joiner.setRequirePillar(e.target.checked)} className="hidden" /><div className={`w-5 h-5 rounded border flex items-center justify-center ${colors.c_bgInput}`}>{joiner.requirePillar && <span className="text-red-500 font-bold text-xs">✓</span>}</div><span className="text-sm font-medium">{t('joinPillar')}</span></label>
            <label className="flex items-center gap-3 cursor-pointer select-none ml-2">
              <input type="checkbox" checked={joiner.useGpu} onChange={(e) => joiner.setUseGpu(e.target.checked)} className="hidden" />
              <div className={`w-5 h-5 rounded border flex items-center justify-center ${colors.c_bgInput}`}>{joiner.useGpu && <span className="text-red-500 font-bold text-xs">✓</span>}</div>
              <span className="text-sm font-medium text-orange-500">{t('useGpu')}</span>
            </label>
          </div>

          <div className={`flex flex-col gap-1.5 border-t pt-3 ${colors.c_borderT}`}><label className={`${colors.c_textSub} text-xs font-medium`}>{t('joinOutput')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={joiner.outputFolder || t('joinDefault')} className={`flex-1 border rounded-lg px-3 py-1.5 text-sm truncate focus:outline-none ${colors.c_bgInput}`} /><button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) joiner.setOutputFolder(path); }} className={`text-xs font-bold px-4 py-1.5 rounded-lg shrink-0 border transition-colors ${colors.c_btnSec}`}>{t('btnChooseFolder')}</button></div></div>
          <div className={`grid grid-cols-5 gap-6 border-t pt-3.5 w-full ${colors.c_borderT}`}>
            <div className="flex flex-col gap-1.5 min-w-0 col-span-2">
              <label className={`${colors.c_textSub} text-xs font-medium`}>{t('joinLogo')}</label>
              <div className="flex items-center gap-2 w-full">
                <input type="text" readOnly value={joiner.logoPath || "No Logo Mode"} className={`flex-1 border rounded-lg px-3 py-1.5 text-xs truncate focus:outline-none min-w-0 ${colors.c_bgInput}`} />
                <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-logo-dialog'); if (path) joiner.setLogoPath(path); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 border transition-colors ${colors.c_btnSec}`}>{t('btnChooseLogo')}</button>
                {joiner.logoPath && <button onClick={() => joiner.setLogoPath('')} className="text-xs text-red-500 font-medium px-1 shrink-0 hover:text-red-400 transition-colors">{t('btnDelete')}</button>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className={`${colors.c_textSub} text-xs font-medium`}>{t('logoSize')}</label>
              <div className="flex items-center gap-2">
                <input type="range" min="50" max="800" step="10" value={joiner.logoSize} onChange={(e) => joiner.setLogoSize(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer" />
                <span className="text-xs font-bold text-red-500 w-8 text-right">{joiner.logoSize}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 col-span-1"><label className={`${colors.c_textSub} text-xs font-medium`}>{t('joinPosition')}</label><select value={joiner.logoPosition} onChange={(e) => joiner.setLogoPosition(e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none h-[32px] ${colors.c_bgInput}`}><option value="top-left">{t('posTopLeft')}</option><option value="top-right">{t('posTopRight')}</option><option value="bottom-left">{t('posBottomLeft')}</option><option value="bottom-right">{t('posBottomRight')}</option></select></div>
            <div className="flex flex-col gap-1.5 col-span-1"><label className={`${colors.c_textSub} text-xs font-medium`}>{t('joinRatio')}</label><select value={joiner.joinRatio} onChange={(e) => joiner.setJoinRatio(e.target.value)} className={`w-full border text-sm text-red-500 font-semibold rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none h-[32px] ${colors.c_bgInput}`}><option value="original">{t('ratioOriginal')}</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option></select></div>
          </div>
        </div>
        {!joiner.isProcessing ? ( <button onClick={joiner.handleStartProcess} className="bg-red-600 hover:bg-red-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shrink-0 transition-transform active:scale-95 shadow-lg">{t('start')}</button> ) : ( <div className="flex gap-2 h-full shrink-0"><button onClick={joiner.handlePauseToggle} className="py-4 px-4 rounded-2xl font-bold text-sm bg-zinc-600 text-white shadow-md">{joiner.isPaused ? t('btnResume') : t('btnPause')}</button><button onClick={joiner.handleCancel} className="bg-red-600 text-white font-bold py-4 px-4 rounded-2xl text-sm shadow-md">{t('btnCancel')}</button></div> )}
      </div>
    </div>
  )
}