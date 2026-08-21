/* eslint-disable */
import React from 'react'
import { tauriApi } from '../utils/tauriAdapter'

interface HighlightTabProps {
  joiner: any
  isDark: boolean
}

const fileName = (path: string) => path.split(/[/\\]/).pop() || path

const selectClass = (isDark: boolean) => `mt-2 h-11 w-full rounded-2xl border px-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 ${isDark ? 'border-white/10 bg-white/[0.06] text-white' : 'border-zinc-200 bg-white text-zinc-800'}`
const inputClass = (isDark: boolean) => `mt-2 h-11 w-full rounded-2xl border px-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 ${isDark ? 'border-white/10 bg-white/[0.06] text-white' : 'border-zinc-200 bg-white text-zinc-800'}`
const panelClass = (isDark: boolean) => `rounded-[28px] border p-4 shadow-sm sm:p-5 ${isDark ? 'border-white/10 bg-white/[0.035]' : 'border-zinc-200/80 bg-white/70'}`

export const HighlightTab: React.FC<HighlightTabProps> = ({ joiner, isDark }) => {
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-500">Media tool</p>
          <h1 className="mt-1 truncate text-2xl font-semibold sm:text-3xl">Cắt Highlight</h1>
          <p className="mt-1 max-w-2xl text-sm opacity-60">Chọn các mốc từ video dài, sau đó xuất thành một hoặc nhiều video mới.</p>
        </div>
        <div className={`rounded-full border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.05]' : 'border-zinc-200 bg-white/70'}`}>
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
          {joiner.highlightSegments.length} đoạn đã chọn
        </div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
          <section className={panelClass(isDark)}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4">
              <div>
                <h2 className="text-base font-semibold">Nguồn video dài</h2>
                <p className="mt-1 text-xs opacity-55">Có thể chọn nhiều file và tạo nhiều đoạn trên cùng một file.</p>
              </div>
              <button type="button" onClick={() => void joiner.chooseHighlightVideos()} className="rounded-2xl bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600">
                + Chọn video
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {joiner.highlightSegments.map((segment: any, index: number) => (
                <div key={segment.id} className={`grid gap-3 rounded-2xl border p-3 sm:grid-cols-[minmax(0,1fr)_110px_110px_42px] sm:items-end ${isDark ? 'border-white/10 bg-white/[0.025]' : 'border-zinc-200 bg-zinc-50/70'}`}>
                  <label className="min-w-0 text-[11px] font-medium opacity-70">
                    Đoạn {index + 1}
                    <select value={segment.videoPath} onChange={event => joiner.updateHighlightSegment(segment.id, { videoPath: event.target.value })} className={`${selectClass(isDark)} truncate`}>
                      <option value={segment.videoPath}>{fileName(segment.videoPath)}</option>
                      {joiner.highlightSegments.filter((item: any) => item.videoPath !== segment.videoPath).map((item: any) => <option key={item.videoPath} value={item.videoPath}>{fileName(item.videoPath)}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] font-medium opacity-70">
                    Bắt đầu (s)
                    <input type="number" min="0" step="0.1" value={segment.startSecs} onChange={event => joiner.updateHighlightSegment(segment.id, { startSecs: Number(event.target.value) })} className={inputClass(isDark)} />
                  </label>
                  <label className="text-[11px] font-medium opacity-70">
                    Kết thúc (s)
                    <input type="number" min="0.1" step="0.1" value={segment.endSecs} onChange={event => joiner.updateHighlightSegment(segment.id, { endSecs: Number(event.target.value) })} className={inputClass(isDark)} />
                  </label>
                  <button type="button" aria-label={`Xóa đoạn ${index + 1}`} onClick={() => joiner.removeHighlightSegment(segment.id)} className="h-11 rounded-2xl border border-red-500/25 text-red-500 transition hover:bg-red-500/10">×</button>
                </div>
              ))}

              {joiner.highlightSegments.length === 0 && (
                <button type="button" onClick={() => void joiner.chooseHighlightVideos()} className={`flex min-h-[250px] w-full flex-col items-center justify-center rounded-3xl border border-dashed text-center transition hover:border-blue-400 hover:bg-blue-500/5 ${isDark ? 'border-white/15' : 'border-zinc-300'}`}>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl text-blue-500">✂</span>
                  <span className="mt-4 text-sm font-semibold">Chọn video dài để bắt đầu</span>
                  <span className="mt-1 text-xs opacity-55">Mỗi đoạn có mốc bắt đầu và kết thúc riêng.</span>
                </button>
              )}

              <button type="button" disabled={joiner.highlightSegments.length === 0} onClick={joiner.addHighlightSegment} className="rounded-2xl border border-current/10 px-4 py-2.5 text-xs font-semibold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/10">
                + Thêm đoạn khác
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className={panelClass(isDark)}>
              <div className="border-b border-current/10 pb-4">
                <h2 className="text-base font-semibold">Đầu ra</h2>
                <p className="mt-1 text-xs opacity-55">Chọn số lượng file và khung hình cho highlight.</p>
              </div>
              <div className="mt-4 space-y-4">
                <label className="block text-[11px] font-medium opacity-70">Kiểu xuất<select value={joiner.highlightOutputMode} onChange={event => joiner.setHighlightOutputMode(event.target.value)} className={selectClass(isDark)}><option value="single-long">Một video dài</option><option value="multiple-long">Nhiều video dài</option><option value="single-short">Một video ngắn</option><option value="multiple-short">Nhiều video ngắn</option></select></label>
                <label className="block text-[11px] font-medium opacity-70">Tỷ lệ khung hình<select value={joiner.highlightRatio} onChange={event => joiner.setHighlightRatio(event.target.value)} className={selectClass(isDark)}><option value="original">Bản gốc</option><option value="9:16">9:16</option><option value="3:4">3:4</option><option value="1:1">1:1</option><option value="4:3">4:3</option><option value="16:9">16:9</option></select></label>
              </div>
            </section>

            <section className={panelClass(isDark)}>
              <div className="border-b border-current/10 pb-4">
                <h2 className="text-base font-semibold">Đóng dấu logo</h2>
                <p className="mt-1 text-xs opacity-55">Cấu hình riêng cho các file highlight đang xuất.</p>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <input readOnly value={joiner.logoPath || 'Chưa chọn logo'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`} />
                  <button type="button" onClick={() => void chooseLogo()} className="h-11 rounded-2xl border border-current/10 px-3 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10">Chọn</button>
                  {joiner.logoPath && <button type="button" aria-label="Xóa logo" onClick={() => joiner.setLogoPath('')} className="h-11 w-11 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10">×</button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <label className="block text-[11px] font-medium opacity-70">Vị trí<select value={joiner.logoPosition} onChange={event => joiner.setLogoPosition(event.target.value)} className={selectClass(isDark)}><option value="top-left">Góc trái trên</option><option value="top-right">Góc phải trên</option><option value="bottom-left">Góc trái dưới</option><option value="bottom-right">Góc phải dưới</option></select></label>
                  <label className="block text-[11px] font-medium opacity-70">Phạm vi<select value={joiner.logoMode} onChange={event => joiner.setLogoMode(event.target.value)} className={selectClass(isDark)}><option value="both">Dài + ngắn</option><option value="long">Chỉ video dài</option><option value="short">Chỉ video ngắn</option></select></label>
                </div>
                <label className="block text-[11px] font-medium opacity-70">Kích thước <span className="text-red-500">{joiner.logoSize}px</span><input type="range" min="50" max="300" step="10" value={joiner.logoSize} onChange={event => joiner.setLogoSize(Number(event.target.value))} className="mt-3 w-full accent-red-500" /></label>
              </div>
            </section>

            <section className={panelClass(isDark)}>
              <div className="flex items-center gap-3">
                <input readOnly value={joiner.outputFolder || 'Lưu cùng thư mục video nguồn'} className={`h-11 min-w-0 flex-1 rounded-2xl border px-3 text-xs outline-none ${isDark ? 'border-white/10 bg-white/[0.06]' : 'border-zinc-200 bg-white'}`} />
                <button type="button" onClick={() => void chooseOutputFolder()} className="h-11 shrink-0 rounded-2xl border border-current/10 px-3 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/10">Đổi nơi lưu</button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-current/10 pt-4">
        <p className="text-xs opacity-55">{joiner.highlightProcessing ? 'Đang xử lý các đoạn highlight...' : 'Thứ tự đoạn được giữ nguyên theo danh sách bên trên.'}</p>
        <button type="button" disabled={joiner.highlightProcessing || joiner.highlightSegments.length === 0} onClick={() => void joiner.handleHighlightExport()} className="rounded-2xl bg-blue-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
          {joiner.highlightProcessing ? 'ĐANG XỬ LÝ...' : 'XUẤT HIGHLIGHT'}
        </button>
      </footer>
    </div>
  )
}
