/* eslint-disable */
import React, { useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'
import { ScenarioSheet } from '../components/ScenarioSheet'

interface HighlightTabProps {
  joiner: any
  isDark: boolean
}

const fileName = (path: string) => path.split(/[/\\]/).pop() || path
const fieldClass = (isDark: boolean) => `mt-2 h-11 w-full rounded-2xl border px-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 ${isDark ? 'border-white/10 bg-white/[0.08] text-white' : 'border-zinc-200 bg-white/90 text-zinc-800'}`
const panelClass = (isDark: boolean) => `rounded-[30px] border p-4 shadow-sm sm:p-5 ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200/80 bg-white/88'}`

const outputOptions = [
  ['single-long', 'Một video dài'],
  ['multiple-long', 'Nhiều video dài'],
  ['single-short', 'Một video ngắn'],
  ['multiple-short', 'Nhiều video ngắn']
] as const

const OutputModePicker: React.FC<{ value: string; isDark: boolean; onChange: (value: string) => void }> = ({ value, isDark, onChange }) => {
  const [open, setOpen] = useState(false)
  const label = outputOptions.find(option => option[0] === value)?.[1] || 'Nhiều video dài'
  return (
    <div className="relative mt-2">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} className={`flex h-11 w-full items-center justify-between rounded-2xl border px-3 text-left text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 ${isDark ? 'border-white/10 bg-white/[0.08] text-white' : 'border-zinc-200 bg-white/90 text-zinc-800'}`}>
        <span>{label}</span><span className={`text-xs opacity-60 transition ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div role="listbox" className={`absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border p-1 shadow-2xl ${isDark ? 'border-white/15 bg-zinc-900' : 'border-zinc-200 bg-white'}`}>
        {outputOptions.map(([option, optionLabel]) => <button key={option} type="button" role="option" aria-selected={option === value} onClick={() => { onChange(option); setOpen(false) }} className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${option === value ? 'bg-red-500/12 text-red-500' : 'hover:bg-current/8'}`}>{optionLabel}</button>)}
      </div>}
    </div>
  )
}

export const HighlightTab: React.FC<HighlightTabProps> = ({ joiner, isDark }) => {
  const [showScenario, setShowScenario] = useState(false)

  const chooseLogo = async () => {
    const path = await tauriApi.invoke<string | null>('open_logo_dialog')
    if (path) joiner.setLogoPath(path)
  }

  const chooseOutputFolder = async () => {
    const path = await tauriApi.invoke<string | null>('open_folder_dialog')
    if (path) joiner.setOutputFolder(path)
  }

  const isShort = joiner.highlightOutputMode.includes('short')
  const isRandom = joiner.highlightProcessingMode === 'random'
  const hasScenario = joiner.highlightProcessing || joiner.highlightScenarioScripts.length > 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-5">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-500">Công cụ video</p>
          <h1 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">Cắt đoạn nổi bật</h1>
          <p className="mt-1 max-w-2xl text-sm opacity-60">Chọn các mốc từ video dài, sau đó xuất thành một hoặc nhiều video mới.</p>
        </div>
        <div className={`rounded-full border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white/85'}`}><span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />{joiner.highlightSegments.length} đoạn đã chọn</div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.72fr)]">
          <section className={panelClass(isDark)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4">
              <div><h2 className="text-base font-semibold">Nguồn video dài</h2><p className="mt-1 text-xs opacity-55">Có thể chọn nhiều tệp và tạo nhiều đoạn trên cùng một tệp.</p></div>
              <button type="button" onClick={() => void joiner.chooseHighlightVideos()} className="rounded-2xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600">+ Chọn video</button>
            </div>

            <div className="mt-4 space-y-3">
              {joiner.highlightSegments.length > 0 && <div className="max-h-[min(56vh,620px)] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {joiner.highlightSegments.map((segment: any, index: number) => <div key={segment.id} className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1fr)_110px_110px_42px] sm:items-end ${isDark ? 'border-white/10 bg-white/[0.045]' : 'border-zinc-200 bg-zinc-50/85'}`}>
                  <label className="min-w-0 text-[11px] font-medium opacity-70">Đoạn {index + 1}<select value={segment.videoPath} onChange={event => joiner.updateHighlightSegment(segment.id, { videoPath: event.target.value })} className={`${fieldClass(isDark)} truncate`}><option value={segment.videoPath}>{fileName(segment.videoPath)}</option>{joiner.highlightSegments.filter((item: any) => item.videoPath !== segment.videoPath).map((item: any) => <option key={item.videoPath} value={item.videoPath}>{fileName(item.videoPath)}</option>)}</select></label>
                  <label className="text-[11px] font-medium opacity-70">Bắt đầu (giây)<input type="number" min="0" step="0.1" value={segment.startSecs} onChange={event => joiner.updateHighlightSegment(segment.id, { startSecs: Number(event.target.value) })} className={fieldClass(isDark)} /></label>
                  <label className="text-[11px] font-medium opacity-70">Kết thúc (giây)<input type="number" min="0.1" step="0.1" value={segment.endSecs} onChange={event => joiner.updateHighlightSegment(segment.id, { endSecs: Number(event.target.value) })} className={fieldClass(isDark)} /></label>
                  <button type="button" aria-label={`Xóa đoạn ${index + 1}`} onClick={() => joiner.removeHighlightSegment(segment.id)} className="h-11 rounded-2xl border border-red-500/25 text-red-500 transition hover:bg-red-500/10">×</button>
                </div>)}
              </div>}

              {joiner.highlightSegments.length === 0 && <button type="button" onClick={() => void joiner.chooseHighlightVideos()} className={`flex min-h-[min(42vh,420px)] w-full flex-col items-center justify-center rounded-3xl border border-dashed text-center transition hover:border-blue-400 hover:bg-blue-500/5 ${isDark ? 'border-white/15' : 'border-zinc-300'}`}><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-500">✂</span><span className="mt-4 text-sm font-semibold">Chọn video dài để bắt đầu</span><span className="mt-1 text-xs opacity-55">Mỗi đoạn có mốc bắt đầu và kết thúc riêng.</span></button>}
              <button type="button" disabled={joiner.highlightSegments.length === 0} onClick={joiner.addHighlightSegment} className="rounded-2xl border border-current/10 px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10">+ Thêm đoạn khác</button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className={panelClass(isDark)}>
              <div className="border-b border-current/10 pb-4"><h2 className="text-base font-semibold">Kịch bản và đầu ra</h2><p className="mt-1 text-xs opacity-55">Cắt trực tiếp từng đoạn hoặc xáo trộn thành kịch bản mới.</p></div>
              <div className="mt-4 space-y-4">
                <label className="block text-[11px] font-medium opacity-70">Cách xử lý<select value={joiner.highlightProcessingMode} onChange={event => joiner.setHighlightProcessingMode(event.target.value)} className={fieldClass(isDark)}><option value="direct">Cắt trực tiếp theo danh sách</option><option value="random">Tạo kịch bản ngẫu nhiên</option></select></label>
                <label className="block text-[11px] font-medium opacity-70">Kiểu xuất<OutputModePicker value={joiner.highlightOutputMode} isDark={isDark} onChange={joiner.setHighlightOutputMode} /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[11px] font-medium opacity-70">Tỷ lệ bản dài<select value={joiner.highlightRatio} onChange={event => joiner.setHighlightRatio(event.target.value)} className={fieldClass(isDark)}><option value="original">Bản gốc</option><option value="16:9">16:9 ngang</option><option value="4:3">4:3 ngang</option><option value="9:16">9:16 dọc</option><option value="3:4">3:4 dọc</option><option value="1:1">1:1 vuông</option></select></label>
                  <label className="text-[11px] font-medium opacity-70">Tỷ lệ bản ngắn<select value={joiner.highlightShortRatio} disabled={!isShort} onChange={event => joiner.setHighlightShortRatio(event.target.value)} className={fieldClass(isDark)}><option value="9:16">9:16 dọc</option><option value="3:4">3:4 dọc</option><option value="1:1">1:1 vuông</option><option value="4:3">4:3 ngang</option><option value="16:9">16:9 ngang</option></select></label>
                </div>
                <label className="block text-[11px] font-medium opacity-70">Thời lượng bản ngắn (phút)<input type="number" min="0.1" step="0.1" value={joiner.highlightShortDuration} disabled={!isShort} onChange={event => joiner.setHighlightShortDuration(Number(event.target.value))} className={fieldClass(isDark)} /></label>
                {isRandom && <div className={`space-y-3 rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-zinc-200 bg-zinc-50/85'}`}><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-medium opacity-70">Tối thiểu (phút)<input type="number" min="0.1" step="0.1" value={joiner.highlightMinTime} onChange={event => joiner.setHighlightMinTime(Number(event.target.value))} className={fieldClass(isDark)} /></label><label className="text-[11px] font-medium opacity-70">Tối đa (phút)<input type="number" min="0.1" step="0.1" value={joiner.highlightMaxTime} onChange={event => joiner.setHighlightMaxTime(Number(event.target.value))} className={fieldClass(isDark)} /></label></div><label className="flex items-center justify-between gap-3 text-sm"><span><span className="block font-medium">Ưu tiên video trụ cột</span><span className="mt-0.5 block text-xs opacity-55">Ưu tiên đoạn lấy từ video nguồn dài hơn 10 phút.</span></span><input type="checkbox" checked={joiner.highlightRequirePillar} onChange={event => joiner.setHighlightRequirePillar(event.target.checked)} className="h-5 w-5 accent-blue-500" /></label></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-4"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={joiner.useGpu} onChange={event => joiner.setUseGpu(event.target.checked)} className="sr-only" /><span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${joiner.useGpu ? 'bg-blue-500' : isDark ? 'bg-white/15' : 'bg-zinc-300'}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${joiner.useGpu ? 'translate-x-6' : 'translate-x-1'}`} /></span><span className="min-w-0"><span className="block text-sm font-medium">{joiner.useGpu ? 'Kết xuất bằng GPU' : 'Kết xuất bằng CPU'}</span><span className="block truncate text-xs opacity-55">{joiner.useGpu ? joiner.gpuName : joiner.cpuName}</span></span></label><select aria-label="Mức hiệu năng" value={joiner.hardwareMode || 'max'} onChange={event => joiner.setHardwareMode(event.target.value)} className={`h-10 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.08]' : 'border-zinc-200 bg-white/90'}`}><option value="max">Tối đa</option><option value="balanced">Cân bằng</option><option value="low">Tiết kiệm</option></select></div>
              </div>
            </section>

            <section className={panelClass(isDark)}>
              <div className="border-b border-current/10 pb-4"><h2 className="text-base font-semibold">Đóng dấu logo</h2><p className="mt-1 text-xs opacity-55">Áp dụng cho bản dài, bản ngắn hoặc cả hai.</p></div>
              <div className="mt-4 space-y-4"><div className="flex gap-2"><input readOnly value={joiner.logoPath || 'Chưa chọn logo'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-sm outline-none ${isDark ? 'border-white/10 bg-white/[0.08]' : 'border-zinc-200 bg-white/90'}`} /><button type="button" onClick={() => void chooseLogo()} className="h-11 shrink-0 rounded-2xl border border-current/10 px-3 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10">Chọn</button></div><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-medium opacity-70">Vị trí<select value={joiner.logoPosition} onChange={event => joiner.setLogoPosition(event.target.value)} className={fieldClass(isDark)}><option value="top-left">Góc trái trên</option><option value="top-right">Góc phải trên</option><option value="bottom-left">Góc trái dưới</option><option value="bottom-right">Góc phải dưới</option></select></label><label className="text-[11px] font-medium opacity-70">Phạm vi<select value={joiner.logoMode} onChange={event => joiner.setLogoMode(event.target.value)} className={fieldClass(isDark)}><option value="both">Dài + ngắn</option><option value="long">Chỉ video dài</option><option value="short">Chỉ video ngắn</option></select></label></div><label className="block text-[11px] font-medium opacity-70">Kích thước <span className="text-red-500">{joiner.logoSize}px</span><input type="range" min="50" max="300" step="10" value={joiner.logoSize} onChange={event => joiner.setLogoSize(Number(event.target.value))} className="mt-3 w-full accent-blue-500" /></label></div>
            </section>

            <section className={panelClass(isDark)}><div className="flex gap-2"><input readOnly value={joiner.outputFolder || 'Lưu cùng thư mục video nguồn'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.08]' : 'border-zinc-200 bg-white/90'}`} /><button type="button" onClick={() => void chooseOutputFolder()} className="h-11 shrink-0 rounded-2xl border border-current/10 px-3 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10">Đổi nơi lưu</button></div></section>
          </aside>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-4"><p className="text-xs opacity-55">{joiner.highlightProcessing ? 'Đang xử lý các đoạn nổi bật...' : isRandom ? 'Kịch bản sẽ được xáo trộn ở mỗi lần vận hành.' : 'Thứ tự đoạn được giữ nguyên theo danh sách bên trên.'}</p><div className="flex flex-wrap gap-2">{hasScenario && <button type="button" onClick={() => setShowScenario(true)} className="rounded-2xl border border-current/10 px-4 py-3 text-xs font-semibold transition hover:bg-current/8">Xem kịch bản</button>}<button type="button" disabled={joiner.highlightProcessing || joiner.highlightSegments.length === 0} onClick={() => void joiner.handleHighlightExport()} className="rounded-2xl bg-blue-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">{joiner.highlightProcessing ? 'ĐANG XỬ LÝ...' : 'XUẤT ĐOẠN NỔI BẬT'}</button></div></footer>
      {showScenario && <ScenarioSheet scripts={joiner.highlightScenarioScripts} isDark={isDark} title="Kịch bản cắt đoạn nổi bật" onClose={() => setShowScenario(false)} />}
    </div>
  )
}
