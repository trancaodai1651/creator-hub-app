/* eslint-disable */
import React from 'react'
import { tauriApi } from '../utils/tauriAdapter'
import { GEMINI_SCRIPT_STYLES } from '../hooks/useTts'

const fieldClass = 'glass-input w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-red-400/70 focus:ring-2 focus:ring-red-400/10'
const buttonClass = 'glass-button rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50'

export const TtsTab: React.FC<{ tts: any, t: any, colors: any }> = ({ tts, colors }) => {
  const chooseReferenceAudio = async () => {
    const path = await tauriApi.invoke<string | null>('open_file_dialog')
    if (path) tts.setReferenceAudio(path)
  }

  const chooseFolder = async (setter: (value: string) => void) => {
    const path = await tauriApi.invoke<string | null>('open_folder_dialog')
    if (path) setter(path)
  }

  const selectedVoiceIsDesign = tts.selectedVoiceId === 'design'

  return (
    <div className={`glass-panel flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto rounded-[28px] border p-4 select-none custom-scrollbar sm:p-5 ${colors.c_borderT}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-4 dark:border-white/10">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500">Công cụ nội dung</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Giọng đọc AI với OmniVoice</h2>
          <p className={`mt-1 max-w-3xl text-sm ${colors.c_textSub}`}>Tạo kịch bản tiếp thị liên kết cho TikTok, Shopee và Facebook, sau đó duyệt rồi tạo giọng đọc theo đúng ngôn ngữ.</p>
        </div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${tts.status.installed ? 'border-emerald-400/30 text-emerald-600 dark:text-emerald-300' : 'border-amber-400/40 text-amber-700 dark:text-amber-300'}`}>
          <span className={`h-2 w-2 rounded-full ${tts.status.installed ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          {tts.status.installed ? 'OmniVoice sẵn sàng' : 'Chưa có lõi OmniVoice'}
        </div>
      </header>

      <section className="grid gap-3 xl:grid-cols-[1.05fr_1fr_1.2fr]">
        <div className="glass-subtle rounded-2xl border p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-65">Nền tảng tiếp thị</label>
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-black/10 p-1 dark:border-white/10">
            {([['tiktok', 'TikTok'], ['shopee', 'Shopee'], ['facebook', 'Facebook']] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => tts.setPlatform(id)} className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition ${tts.platform === id ? 'bg-red-500 text-white shadow-sm' : 'opacity-65 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10'}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="glass-subtle flex items-center justify-between gap-3 rounded-2xl border p-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-65">Trạng thái lõi</p>
            <p className={`mt-1 truncate text-xs ${colors.c_textSub}`}>{tts.status.message || 'Sẵn sàng kiểm tra'}</p>
          </div>
          <button type="button" disabled={tts.isInstalling} onClick={tts.handleInstallRuntime} className={`${buttonClass} shrink-0 ${tts.status.installed ? '' : 'border-red-400/40 text-red-500'}`}>{tts.isInstalling ? 'Đang cài...' : tts.status.installed ? 'Kiểm tra' : 'Cài lõi'}</button>
        </div>
        <div className="glass-subtle flex items-center gap-2 rounded-2xl border p-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-65">Dự án lưu giọng và âm thanh</label>
            <input readOnly value={tts.projectDir || 'Dự án mặc định của Creator Hub'} className={`${fieldClass} truncate py-2 text-xs`} />
          </div>
          <button type="button" onClick={() => chooseFolder(tts.setProjectDir)} className={`${buttonClass} mt-5 shrink-0 px-3 py-2`}>Chọn</button>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)]">
        <div className="glass-subtle rounded-2xl border p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-65">Thời lượng mục tiêu (giây)</label>
          <input type="number" min="5" max="600" step="5" value={tts.targetDuration} onChange={event => tts.setTargetDuration(Math.max(5, Math.min(600, Number(event.target.value) || 5)))} className={fieldClass} />
          <p className={`mt-2 text-[11px] ${colors.c_textSub}`}>Gemini điều chỉnh số từ theo thời lượng đã chọn.</p>
        </div>
        <div className="glass-subtle rounded-2xl border p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-65">Góc triển khai đa dạng</label>
          <select value={tts.scriptStyle} onChange={event => tts.setScriptStyle(event.target.value)} className={fieldClass}>
            {GEMINI_SCRIPT_STYLES.map(style => <option key={style.id} value={style.id}>{style.label}</option>)}
          </select>
          <p className={`mt-2 text-[11px] ${colors.c_textSub}`}>{tts.geminiConfigured ? 'Gemini sẵn sàng tạo phiên bản mới.' : 'Nhập khóa Gemini trong Cài đặt để sử dụng.'}</p>
        </div>
      </section>

      <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
        <div className="glass-subtle flex min-h-0 flex-col gap-4 rounded-2xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold">Kịch bản sản phẩm</h3>
              <p className={`mt-1 text-xs ${colors.c_textSub}`}>Tạo khung theo nền tảng, sửa trực tiếp, rồi chọn duyệt.</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tts.isApproved ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'}`}>{tts.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={tts.productName} onChange={event => tts.setProductName(event.target.value)} placeholder="Tên sản phẩm" className={fieldClass} />
            <input value={tts.offer} onChange={event => tts.setOffer(event.target.value)} placeholder="Ưu đãi hoặc giá bán" className={fieldClass} />
            <textarea value={tts.benefits} onChange={event => tts.setBenefits(event.target.value)} placeholder="Điểm nổi bật, lợi ích chính" className={`${fieldClass} min-h-[82px] resize-y sm:col-span-2`} />
            <input value={tts.proof} onChange={event => tts.setProof(event.target.value)} placeholder="Bằng chứng, đánh giá hoặc uy tín" className={fieldClass} />
            <input value={tts.cta} onChange={event => tts.setCta(event.target.value)} placeholder="Lời kêu gọi hành động" className={fieldClass} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={tts.handleGenerateGeminiScript} disabled={tts.isGeneratingScript} className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/15 transition hover:bg-red-400 disabled:cursor-wait disabled:opacity-50">{tts.isGeneratingScript ? 'Gemini đang viết...' : 'Tạo kịch bản bằng Gemini'}</button>
            <button type="button" onClick={tts.handleGenerateScript} className={`${buttonClass} text-sm`}>Tạo nhanh bằng mẫu có sẵn</button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide opacity-65">Biên tập hoặc dán kịch bản</label>
              <div className={`flex flex-wrap items-center gap-3 text-xs ${colors.c_textSub}`}>
                <span>Ngôn ngữ: <strong className="font-semibold text-red-500">{tts.detectedLanguage.label}</strong></span>
                {tts.estimatedDuration > 0 && <span>Ước tính: <strong className="font-semibold text-red-500">{tts.estimatedDuration} giây</strong> · Mục tiêu: <strong className="font-semibold text-red-500">{tts.targetDuration} giây</strong></span>}
              </div>
            </div>
            <textarea value={tts.scriptText} onChange={event => tts.setScriptText(event.target.value)} placeholder="Dán kịch bản sản phẩm vào đây nếu không dùng mẫu tự động..." className={`${fieldClass} min-h-[250px] flex-1 resize-y leading-6`} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={tts.handleApproveScript} disabled={!tts.scriptText.trim()} className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${tts.isApproved ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white hover:bg-red-400'} disabled:opacity-45`}>{tts.isApproved ? 'Đã duyệt kịch bản' : 'Duyệt kịch bản'}</button>
              <button type="button" onClick={tts.handleUsePastedScript} disabled={!tts.scriptText.trim() || tts.isApproved} className={`${buttonClass} py-2.5 text-xs`}>Dùng bản đã dán</button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="glass-subtle rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Thư viện giọng trong dự án</h3>
                <p className={`mt-1 text-xs ${colors.c_textSub}`}>Chọn giọng đã lưu để dùng ngay, không cần clone lại.</p>
              </div>
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-500">{tts.voiceLibrary.length} giọng</span>
            </div>
            <select value={tts.selectedVoiceId} onChange={event => tts.setSelectedVoiceId(event.target.value)} className={fieldClass}>
              {tts.voiceLibrary.map((voice: any) => <option key={voice.id} value={voice.id}>{voice.name}{voice.source === 'bundled' ? ' · Có sẵn' : voice.mode === 'clone' ? ' · Đã lưu' : ''}</option>)}
              <option value="design">Thiết kế giọng theo mô tả</option>
            </select>
            <div className={`mt-2 flex items-center justify-between gap-2 text-[11px] ${colors.c_textSub}`}>
              <span>{tts.builtInVoiceCount > 0 ? `${tts.builtInVoiceCount} giọng có sẵn từ thư mục voices` : 'Đặt tệp prompt .pt vào thư mục voices để dùng ngay'}</span>
              <button type="button" onClick={tts.refreshBundledVoices} className="shrink-0 font-semibold text-red-500 hover:underline">Nạp lại</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([['auto', 'Tự động'], ['cpu', 'CPU'], ['gpu', 'GPU']] as const).map(([id, label]) => (
                <button type="button" key={id} onClick={() => tts.setDevice(id)} className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${tts.device === id ? 'border-red-400 bg-red-500 text-white' : 'border-black/10 opacity-70 hover:opacity-100 dark:border-white/10'}`}>{label}</button>
              ))}
            </div>
            {selectedVoiceIsDesign && <textarea value={tts.voiceInstruction} onChange={event => tts.setVoiceInstruction(event.target.value)} placeholder="Mô tả giọng muốn tạo" className={`${fieldClass} mt-3 min-h-[84px] resize-y text-xs`} />}
          </div>

          <div className="glass-subtle rounded-2xl border p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold">Lưu giọng từ âm thanh mẫu</h3>
              <p className={`mt-1 text-xs ${colors.c_textSub}`}>Tệp mẫu nên dài khoảng 3 đến 10 giây, có nội dung cùng ngôn ngữ kịch bản.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input value={tts.voiceName} onChange={event => tts.setVoiceName(event.target.value)} placeholder="Tên giọng lưu trong dự án" className={fieldClass} />
              <button type="button" onClick={chooseReferenceAudio} className={`${buttonClass} whitespace-nowrap`}>Chọn âm thanh mẫu</button>
            </div>
            <p className={`mt-2 truncate text-xs ${colors.c_textSub}`}>{tts.referenceAudio || 'Chưa chọn tệp âm thanh mẫu'}</p>
            <textarea value={tts.referenceText} onChange={event => tts.setReferenceText(event.target.value)} placeholder="Nội dung chính xác của âm thanh mẫu" className={`${fieldClass} mt-2 min-h-[74px] resize-y text-xs`} />
            <button type="button" onClick={tts.handleCloneVoice} disabled={tts.isCloning} className={`${buttonClass} mt-3 w-full border-red-400/40 text-red-500`}>{tts.isCloning ? 'Đang lưu giọng...' : 'Lưu giọng vào dự án'}</button>
          </div>

          <div className="glass-subtle rounded-2xl border p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-65">Thư mục xuất âm thanh</label>
            <div className="flex gap-2">
              <input readOnly value={tts.outputDir || 'Lưu trong thư mục âm thanh của dự án'} className={`${fieldClass} min-w-0 truncate`} />
              <button type="button" onClick={() => chooseFolder(tts.setOutputDir)} className={`${buttonClass} shrink-0 px-3`}>Chọn</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        <div className={`min-w-0 text-xs ${colors.c_textSub}`}>
          <span className="mr-2">{tts.generatedPath ? 'Tệp vừa tạo:' : 'Quy trình:'}</span>
          <span className="font-medium">{tts.generatedPath || 'Duyệt kịch bản → chọn giọng → tạo giọng đọc'}</span>
        </div>
        <button type="button" onClick={tts.handleGenerateTTS} disabled={tts.isTtsProcessing || !tts.isApproved} className="rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:bg-zinc-400/60">{tts.isTtsProcessing ? 'Đang tạo giọng...' : 'Tạo giọng từ kịch bản đã duyệt'}</button>
      </footer>
    </div>
  )
}
