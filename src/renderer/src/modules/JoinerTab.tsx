/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'
import { ScenarioSheet } from '../components/ScenarioSheet'

interface JoinerTabProps {
  joiner: any
  isDark: boolean
  canUseShortVersion?: boolean
}

const fileName = (path: string) => path.split(/[/\\]/).pop() || path
const panelClass = (isDark: boolean) => `rounded-[30px] border p-4 shadow-sm sm:p-5 ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200/80 bg-white/88'}`
const fieldClass = (isDark: boolean) => `mt-2 h-11 w-full rounded-2xl border px-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 ${isDark ? 'border-white/10 bg-white/[0.08] text-white' : 'border-zinc-200 bg-white/90 text-zinc-800'}`

const formatHardwareName = (name: string) => {
  if (!name) return ''
  return name
    .replace(/[\(\[]?\s*0x[0-9a-fA-F]+\s*[\)\]]?/gi, '')
    .replace(/\([A-Za-z0-9]{1,2}\)/g, '')
    .replace(/NVIDIA GeForce|AMD Radeon|Graphics|\bCPU\b|\bAPU\b/gi, '')
    .replace(/\s*@.*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const JoinerTab: React.FC<JoinerTabProps> = ({ joiner, isDark, canUseShortVersion = true }) => {
  const [formattedGpu, setFormattedGpu] = useState('Đang tải GPU...')
  const [formattedCpu, setFormattedCpu] = useState('Đang tải CPU...')
  const [showScenario, setShowScenario] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadHardware = async () => {
      try {
        const [cpu, gpu] = await Promise.all([
          tauriApi.invoke<string>('get_cpu_name'),
          tauriApi.invoke<string>('get_gpu_name')
        ])
        if (!mounted) return
        setFormattedCpu(formatHardwareName(cpu) || 'CPU hệ thống')
        setFormattedGpu(formatHardwareName((gpu || '').split('+')[0]) || 'GPU hệ thống')
      } catch {
        if (!mounted) return
        setFormattedCpu(formatHardwareName(joiner.cpuName) || 'CPU hệ thống')
        setFormattedGpu(formatHardwareName(joiner.gpuName) || 'GPU hệ thống')
      }
    }
    void loadHardware()
    return () => { mounted = false }
  }, [joiner.cpuName, joiner.gpuName])

  const chooseFolder = async () => {
    const path = await tauriApi.invoke<string | null>('open_folder_dialog')
    if (path) await joiner.scanDirectory(path)
  }

  const chooseLogo = async () => {
    const path = await tauriApi.invoke<string | null>('open_logo_dialog')
    if (path) joiner.setLogoPath(path)
  }

  const chooseOutputFolder = async () => {
    const path = await tauriApi.invoke<string | null>('open_folder_dialog')
    if (path) joiner.setOutputFolder(path)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-5">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-500">Công cụ video</p>
          <h1 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">Gộp Video</h1>
          <p className="mt-1 max-w-2xl text-sm opacity-60">Tạo bản dài và bản ngắn từ một kịch bản được xáo trộn cho mỗi lần vận hành.</p>
        </div>
        <div className={`rounded-full border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-zinc-200 bg-white/70'}`}><span className={`mr-2 inline-block h-2 w-2 rounded-full ${joiner.videoList.length ? 'bg-emerald-500' : 'bg-zinc-400'}`} />{joiner.videoList.length ? `${joiner.videoList.length} video nguồn` : 'Chưa có nguồn'}</div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className={panelClass(isDark)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4"><div><h2 className="text-base font-semibold">Video nguồn</h2><p className="mt-1 text-xs opacity-55">Chọn một thư mục chứa các video cần ghép.</p></div><button type="button" onClick={() => void chooseFolder()} className="rounded-2xl border border-current/10 px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10">{joiner.videoList.length ? 'Đổi thư mục' : 'Chọn thư mục'}</button></div>

            {joiner.videoList.length === 0 ? (
              <button type="button" onClick={() => void chooseFolder()} onDrop={joiner.handleDrop} onDragOver={event => event.preventDefault()} className={`mt-4 flex min-h-[clamp(300px,42vh,560px)] w-full flex-col items-center justify-center rounded-3xl border border-dashed text-center transition hover:border-red-400 hover:bg-red-500/5 ${isDark ? 'border-white/15' : 'border-zinc-300'}`}><span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-3xl text-red-500">▣</span><span className="mt-5 text-base font-semibold">Chọn thư mục video</span><span className="mt-1 max-w-xs text-xs leading-relaxed opacity-55">Các tệp sẽ được sắp xếp theo tên trước khi tạo kịch bản ngẫu nhiên.</span></button>
            ) : (
              <div className={`mt-4 h-[clamp(320px,42vh,620px)] overflow-y-auto rounded-3xl border p-2 custom-scrollbar ${isDark ? 'border-white/10 bg-black/10' : 'border-zinc-200 bg-zinc-50/70'}`}>{joiner.videoList.map((path: string, index: number) => <div key={path} className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-xs font-semibold text-red-500">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm" title={path}>{fileName(path)}</span></div>)}</div>
            )}

            {joiner.isProcessing && <div className={`mt-4 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-zinc-50'}`}><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate opacity-70">{joiner.progressMsg}</span><span className="shrink-0 font-semibold text-red-500">{joiner.progressPercent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className={`h-full rounded-full transition-all ${joiner.isPaused ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${joiner.progressPercent}%` }} /></div></div>}
          </section>

          <section className={panelClass(isDark)}>
            <div className="border-b border-current/10 pb-4"><h2 className="text-base font-semibold">Kịch bản & hiệu năng</h2><p className="mt-1 text-xs opacity-55">Mỗi lần vận hành sẽ xáo trộn lại thứ tự video.</p></div>
            <div className="mt-4 space-y-4">
              <div><label className="text-[11px] font-medium opacity-70">Thời lượng mục tiêu (phút)</label><div className="mt-2 grid grid-cols-2 gap-3"><input type="number" min="0.1" step="0.1" value={joiner.minTime} onChange={event => joiner.setMinTime(Number(event.target.value))} className={fieldClass(isDark)} /><input type="number" min="0.1" step="0.1" value={joiner.maxTime} onChange={event => joiner.setMaxTime(Number(event.target.value))} className={fieldClass(isDark)} /></div></div>
              <label className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm transition ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/60'}`}><span><span className="block font-medium">Ưu tiên video trụ cột</span><span className="mt-0.5 block text-xs opacity-55">Mỗi nhóm có một video dài làm nền.</span></span><input type="checkbox" checked={joiner.requirePillar} onChange={event => { const value = event.target.checked; joiner.setRequirePillar(value); if (value) joiner.setSingleMode(false) }} className="h-5 w-5 accent-red-500" /></label>
              <label className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm transition ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/60'}`}><span><span className="block font-medium">Xử lý 1-1</span><span className="mt-0.5 block text-xs opacity-55">Không ghép các video thành nhóm.</span></span><input type="checkbox" checked={joiner.singleMode} onChange={event => { const value = event.target.checked; joiner.setSingleMode(value); if (value) joiner.setRequirePillar(false) }} className="h-5 w-5 accent-blue-500" /></label>
              <div className={`rounded-2xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/60'}`}><div className="flex items-center justify-between gap-3"><span><span className="block text-sm font-medium">Bản ngắn</span><span className="mt-0.5 block text-xs opacity-55">Chỉ xử lý sau khi bản dài hoàn tất và khi được chọn.</span></span><input type="checkbox" checked={joiner.shortVersionEnabled} disabled={!canUseShortVersion} onChange={event => joiner.setShortVersionEnabled(event.target.checked)} className="h-5 w-5 accent-red-500" /></div><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-[11px] opacity-65">Thời lượng<input type="number" min="0.1" step="0.1" value={joiner.shortDuration} disabled={!canUseShortVersion || !joiner.shortVersionEnabled} onChange={event => joiner.setShortDuration(Number(event.target.value))} className={fieldClass(isDark)} /></label><label className="text-[11px] opacity-65">Tỷ lệ<select value={joiner.shortRatio} disabled={!canUseShortVersion || !joiner.shortVersionEnabled} onChange={event => joiner.setShortRatio(event.target.value)} className={fieldClass(isDark)}><option value="9:16">9:16 dọc</option><option value="3:4">3:4 dọc</option><option value="1:1">1:1 vuông</option><option value="4:3">4:3 ngang</option><option value="16:9">16:9 ngang</option></select></label></div>{!canUseShortVersion && <p className="mt-2 text-[11px] text-amber-500">Mã truy cập hiện tại chưa có quyền xuất bản ngắn.</p>}</div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-4"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"><input type="checkbox" checked={joiner.useGpu} onChange={event => joiner.setUseGpu(event.target.checked)} className="sr-only" /><span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${joiner.useGpu ? 'bg-red-500' : isDark ? 'bg-white/15' : 'bg-zinc-300'}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${joiner.useGpu ? 'translate-x-6' : 'translate-x-1'}`} /></span><span className="min-w-0"><span className="block text-sm font-medium">{joiner.useGpu ? 'Kết xuất bằng GPU' : 'Kết xuất bằng CPU'}</span><span className="block truncate text-xs opacity-55">{joiner.useGpu ? formattedGpu : formattedCpu}</span></span></label><select aria-label="Mức hiệu năng" value={joiner.hardwareMode || 'max'} onChange={event => joiner.setHardwareMode(event.target.value)} className={`h-10 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`}><option value="max">Tối đa</option><option value="balanced">Cân bằng</option><option value="low">Tiết kiệm</option></select></div>
            </div>
          </section>

          <section className={`${panelClass(isDark)} xl:col-span-2`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4"><div><h2 className="text-base font-semibold">Đầu ra & đóng dấu</h2><p className="mt-1 text-xs opacity-55">Logo và tỉ lệ được áp dụng theo phạm vi bạn chọn.</p></div><span className="rounded-full bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-500">{joiner.shortVersionEnabled ? 'Bản dài + bản ngắn' : 'Chỉ bản dài'}</span></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]"><div className="grid gap-4 sm:grid-cols-2"><div className="min-w-0"><label className="text-[11px] font-medium opacity-70">Logo</label><div className="mt-2 flex gap-2"><input readOnly value={joiner.logoPath || 'Chưa chọn logo'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`} /><button type="button" onClick={() => void chooseLogo()} className="h-11 rounded-2xl border border-current/10 px-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">Chọn</button>{joiner.logoPath && <button type="button" aria-label="Xóa logo" onClick={() => joiner.setLogoPath('')} className="h-11 w-11 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10">×</button>}</div></div><label className="text-[11px] font-medium opacity-70">Tỉ lệ video dài<select value={joiner.joinRatio} onChange={event => joiner.setJoinRatio(event.target.value)} className={fieldClass(isDark)}><option value="original">Bản gốc</option><option value="16:9">16:9 ngang</option><option value="4:3">4:3 ngang</option><option value="9:16">9:16 dọc</option><option value="3:4">3:4 dọc</option><option value="1:1">1:1 vuông</option></select></label><label className="text-[11px] font-medium opacity-70">Vị trí logo<select value={joiner.logoPosition} onChange={event => joiner.setLogoPosition(event.target.value)} className={fieldClass(isDark)}><option value="top-left">Góc trái trên</option><option value="top-right">Góc phải trên</option><option value="bottom-left">Góc trái dưới</option><option value="bottom-right">Góc phải dưới</option></select></label><label className="text-[11px] font-medium opacity-70">Phạm vi logo<select value={joiner.logoMode} onChange={event => joiner.setLogoMode(event.target.value)} className={fieldClass(isDark)}><option value="both">Dài + ngắn</option><option value="long">Chỉ video dài</option><option value="short">Chỉ video ngắn</option></select></label></div><div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-zinc-200 bg-white/60'}`}><div className="flex items-center justify-between gap-3"><label className="text-[11px] font-medium opacity-70">Kích thước logo</label><span className="text-sm font-semibold text-red-500">{joiner.logoSize}px</span></div><input type="range" min="50" max="300" step="10" value={joiner.logoSize} onChange={event => joiner.setLogoSize(Number(event.target.value))} className="mt-5 w-full accent-red-500" /><div className="mt-5 flex gap-2"><input readOnly value={joiner.outputFolder || 'Lưu cùng thư mục video nguồn'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`} /><button type="button" onClick={() => void chooseOutputFolder()} className="h-11 shrink-0 rounded-2xl border border-current/10 px-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">Đổi nơi lưu</button></div></div></div>
          </section>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-4"><p className="text-xs opacity-55">{joiner.shortVersionEnabled ? 'Bản ngắn sẽ bắt đầu sau khi bản dài hoàn tất.' : 'Chế độ mặc định chỉ xuất bản dài.'}</p><div className="flex flex-wrap gap-2">{(joiner.isProcessing || joiner.joinScenarioScripts.length > 0) && <button type="button" onClick={() => setShowScenario(true)} className="rounded-2xl border border-current/10 px-4 py-3 text-xs font-semibold transition hover:bg-current/8">Xem kịch bản</button>}{joiner.isProcessing ? <div className="flex gap-2"><button type="button" onClick={joiner.handlePauseToggle} className="rounded-2xl border border-current/10 px-4 py-3 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">{joiner.isPaused ? 'Tiếp tục' : 'Tạm dừng'}</button><button type="button" onClick={joiner.handleCancel} className="rounded-2xl bg-red-500 px-4 py-3 text-xs font-semibold text-white hover:bg-red-600">Hủy</button></div> : <button type="button" disabled={joiner.videoList.length === 0} onClick={joiner.handleStartProcess} className="rounded-2xl bg-red-500 px-7 py-3 text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">BẮT ĐẦU GỘP VIDEO</button>}</div></footer>
      {showScenario && <ScenarioSheet scripts={joiner.joinScenarioScripts} isDark={isDark} title="Kịch bản gộp video" onClose={() => setShowScenario(false)} />}
    </div>
  )
}
