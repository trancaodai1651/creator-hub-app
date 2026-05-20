/* eslint-disable */
import React from 'react'

export const RenamerTab: React.FC<{ ren: any, t: any, colors: any, isDark: boolean }> = ({ ren, t, colors, isDark }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-hidden ${colors.c_bgPanel}`}>
    <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('renamerTitle')}</h3><p className={`text-sm ${colors.c_textSub}`}>{t('renamerSub')}</p></div>
    <button onClick={async () => { const files = await window.electron.ipcRenderer.invoke('open-multi-files-dialog'); if (files && files.length > 0) { ren.setSelectedFiles(files) } }} className={`w-full py-5 border-2 border-dashed border-red-500/30 rounded-2xl font-bold text-sm hover:border-red-500 text-center transition-all cursor-pointer ${colors.c_bgTab}`}>{ren.selectedFiles.length > 0 ? t('renamerBtnLoaded', { count: ren.selectedFiles.length }) : t('renamerBtnAdd')}</button>
    <div className="grid grid-cols-5 gap-4 w-full border-t pt-4 border-zinc-500/10 items-end">
      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerMode')}</label><select value={ren.keepOriginal ? 'true' : 'false'} onChange={(e) => ren.setKeepOriginal(e.target.value === 'true')} className={`w-full border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer ${colors.c_bgInput}`}><option value="true">{t('renamerKeep')}</option><option value="false">{t('renamerRemove')}</option></select></div>
      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerFind')}</label><input type="text" disabled={!ren.keepOriginal} value={ren.findText} onChange={(e) => ren.setFindText(e.target.value)} placeholder={ren.keepOriginal ? "..." : t('renamerNotAvailable')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${colors.c_bgInput} disabled:opacity-40`} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerReplace')}</label><input type="text" disabled={!ren.keepOriginal} value={ren.replaceText} onChange={(e) => ren.setReplaceText(e.target.value)} placeholder={ren.keepOriginal ? "..." : t('renamerNotAvailable')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${colors.c_bgInput} disabled:opacity-40`} /></div>
      <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerPrefix')}</label><input type="text" value={ren.renamePrefix} onChange={(e) => ren.setRenamePrefix(e.target.value)} placeholder={t('renamerPrefixPlaceholder')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${colors.c_bgInput}`} /></div>
      <div className={`p-2.5 border rounded-xl flex flex-col gap-1.5 ${colors.c_bgTab}`}>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none"><input type="checkbox" checked={ren.useCounter} onChange={(e) => ren.setUseCounter(e.target.checked)} className="accent-red-500" /><span>{t('renamerAddNumber')}</span></label>
        <div className="grid grid-cols-2 gap-1.5">
          <input type="number" disabled={!ren.useCounter} value={ren.counterStart} onChange={(e) => ren.setCounterStart(Number(e.target.value))} className="w-full border rounded px-1.5 py-0.5 text-[11px] text-center focus:outline-none disabled:opacity-40 bg-black/20" /><select value={ren.counterDigits} disabled={!ren.useCounter} onChange={(e) => ren.setCounterDigits(Number(e.target.value))} className="w-full border rounded px-1 text-[11px] focus:outline-none disabled:opacity-40 bg-black/20 cursor-pointer"><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select>
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium">
      <table className="w-full text-left border-collapse">
        <thead><tr className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b font-bold`}><th className="p-3 w-1/2">{t('renamerCol1')}</th><th className="p-3 w-1/2 text-red-500">{t('renamerCol2')}</th></tr></thead>
        <tbody>{ren.selectedFiles.length === 0 ? (<tr><td colSpan={2} className="p-10 text-center text-zinc-400 font-semibold">{t('renamerEmpty')}</td></tr>) : ren.selectedFiles.map((item: any, idx: number) => { const finalNewName = ren.buildNewFileName(item.name, idx); return (<tr key={idx} className={`border-b ${isDark ? 'border-zinc-900/50 hover:bg-zinc-900/30' : 'border-zinc-200/50 hover:bg-zinc-50'}`}><td className="p-3 truncate max-w-xs text-zinc-400 font-medium">{item.name}{item.ext}</td><td className="p-3 truncate max-w-xs text-red-500 font-bold">{finalNewName}{item.ext}</td></tr>) })}</tbody>
      </table>
    </div>
    <button onClick={ren.handleApplyRename} disabled={ren.selectedFiles.length === 0} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${ren.selectedFiles.length === 0 ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{t('renamerBtnApply')}</button>
  </div>
)