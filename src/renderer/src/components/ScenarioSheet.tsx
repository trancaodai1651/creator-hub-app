import React from 'react'

export interface ScenarioChild {
  name?: string
  path?: string
  durationSecs?: number
}

export interface ScenarioEntry {
  outputName?: string
  outputPath?: string
  type?: string
  format?: string
  ratio?: string
  durationSecs?: number
  children?: ScenarioChild[]
}

interface ScenarioSheetProps {
  scripts: ScenarioEntry[]
  isDark: boolean
  title?: string
  onClose: () => void
}

const formatDuration = (value: unknown) => {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Chưa xác định'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainder = total % 60
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`
}

const fileName = (path?: string) => path?.split(/[/\\]/).pop() || path || 'Không rõ tên'

export const ScenarioSheet: React.FC<ScenarioSheetProps> = ({ scripts, isDark, title = 'Kịch bản xuất video', onClose }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-md sm:p-8" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className={`flex max-h-[min(86vh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? 'border-white/15 bg-zinc-950/95 text-white' : 'border-white/80 bg-white/96 text-zinc-900'}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-current/10 px-5 py-4 sm:px-7 sm:py-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-red-500">Chi tiết xử lý</p>
          <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className="mt-1 text-xs opacity-60">Tên đầu ra, các video con, thời lượng và định dạng của từng bản xuất.</p>
        </div>
        <button type="button" aria-label="Đóng bảng kịch bản" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/10 text-lg opacity-65 transition hover:bg-current/10 hover:opacity-100">×</button>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {scripts.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-[24px] border border-dashed border-current/15 text-sm opacity-60">Kịch bản đang được chuẩn bị.</div>
        ) : (
          <div className="space-y-3">
            {scripts.map((script, index) => {
              const children = Array.isArray(script.children) ? script.children : []
              const typeLabel = script.type === 'short' ? 'Bản ngắn' : 'Bản dài'
              return (
                <article key={`${script.outputPath || script.outputName || 'script'}-${index}`} className={`overflow-hidden rounded-[24px] border ${isDark ? 'border-white/10 bg-white/[0.045]' : 'border-zinc-200 bg-zinc-50/80'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={script.outputPath}>{script.outputName || fileName(script.outputPath)}</p>
                      <p className="mt-1 truncate text-xs opacity-55" title={script.outputPath}>{script.outputPath || 'Đường dẫn sẽ được chọn theo thư mục đầu ra'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-red-500">{typeLabel}</span>
                      <span className="rounded-full bg-current/5 px-2.5 py-1">{script.format || 'MP4'}</span>
                      <span className="rounded-full bg-current/5 px-2.5 py-1">{script.ratio === 'original' ? 'Bản gốc' : script.ratio || 'Bản gốc'}</span>
                      <span className="rounded-full bg-current/5 px-2.5 py-1">{formatDuration(script.durationSecs)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="border-b border-current/10 text-[10px] uppercase tracking-[0.08em] opacity-50">
                        <tr><th className="px-4 py-2.5 font-medium sm:px-5">Video con</th><th className="px-4 py-2.5 font-medium">Thời lượng</th><th className="px-4 py-2.5 font-medium">Định dạng</th><th className="px-4 py-2.5 font-medium">Loại</th></tr>
                      </thead>
                      <tbody>
                        {children.length === 0 ? <tr><td colSpan={4} className="px-4 py-4 opacity-50 sm:px-5">Không có video con trong kịch bản này.</td></tr> : children.map((child, childIndex) => <tr key={`${child.path || child.name || 'child'}-${childIndex}`} className="border-b border-current/5 last:border-0"><td className="max-w-[360px] truncate px-4 py-2.5 sm:px-5" title={child.path}>{child.name || fileName(child.path)}</td><td className="whitespace-nowrap px-4 py-2.5 opacity-70">{formatDuration(child.durationSecs)}</td><td className="px-4 py-2.5 opacity-70">MP4</td><td className="px-4 py-2.5 opacity-70">{typeLabel}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  </div>
)
