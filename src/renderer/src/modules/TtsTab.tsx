/* eslint-disable */
import React from 'react'

export const TtsTab: React.FC<{ tts: any, t: any, colors: any }> = ({ tts, t, colors }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-y-auto select-none ${colors.c_bgPanel}`}>
    <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('ttsTitle')}</h3><p className={`text-sm ${colors.c_textSub}`}>{t('ttsSub')}</p></div>
    <div className="grid grid-cols-2 gap-6 w-full border-t pt-4 border-zinc-500/10">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">{t('ttsStep1')}</label>
        <select value={tts.selectedVoice} onChange={(e) => tts.setSelectedVoice(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none w-full cursor-pointer ${colors.c_bgInput}`}>
          {tts.voices.length === 0 ? <option value="">{t('ttsNoVoice')}</option> : tts.voices.map((v: any) => <option key={v.id} value={v.id}>{v.name} [{v.category}]</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">{t('ttsStep2')}</label>
        <div className="flex items-center gap-2 w-full"><input type="text" readOnly value={tts.ttsFolder || t('dlDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-sm truncate focus:outline-none ${colors.c_bgInput}`} /><button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) tts.setTtsFolder(path); }} className={`border text-sm font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${colors.c_btnSec}`}>{t('btnChooseFolder')}</button></div>
      </div>
    </div>
    <div className="flex flex-col gap-2 w-full flex-1 min-h-[150px]">
      <label className="text-sm font-semibold">{t('ttsStep3')}</label>
      <textarea value={tts.ttsText} onChange={(e) => tts.setTtsText(e.target.value)} placeholder={t('ttsPlaceholder')} className={`w-full flex-1 border focus:border-red-500 rounded-2xl p-4 text-sm font-medium focus:outline-none resize-none ${colors.c_bgInput}`} />
    </div>
    <button onClick={tts.handleGenerateTTS} disabled={tts.isTtsProcessing || tts.voices.length === 0} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${tts.isTtsProcessing ? 'bg-zinc-600 text-zinc-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{t('btnTts')}</button>
  </div>
)