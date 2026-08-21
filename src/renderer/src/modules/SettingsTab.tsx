/* eslint-disable */
import React from 'react'

const inputClass = 'glass-input w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-red-400/70'

export const SettingsTab: React.FC<{ cfg: any, t: any, colors: any, isDark: boolean, onCheckUpdate: () => void }> = ({ cfg, t, colors, isDark, onCheckUpdate }) => (
  <div className={`glass-panel custom-scrollbar flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto rounded-[28px] border p-5 sm:p-7 ${colors.c_borderT}`}>
    <header>
      <h2 className="text-2xl font-semibold tracking-tight">{t('setMainTitle') || 'Cài đặt hệ thống'}</h2>
      <p className={`mt-1 text-sm ${colors.c_textSub}`}>Tùy chỉnh ngôn ngữ, giao diện, kết nối và cập nhật ứng dụng.</p>
    </header>

    <div className="grid gap-4 border-t border-black/10 pt-5 dark:border-white/10 xl:grid-cols-2">
      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-3 block text-sm font-semibold">Ngôn ngữ giao diện</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => cfg.setLanguage('vi')} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${cfg.language === 'vi' ? 'bg-red-500 text-white' : 'opacity-70 hover:opacity-100'}`}>Tiếng Việt</button>
          <button type="button" onClick={() => cfg.setLanguage('en')} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${cfg.language === 'en' ? 'bg-red-500 text-white' : 'opacity-70 hover:opacity-100'}`}>English</button>
        </div>
      </section>

      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-3 block text-sm font-semibold">Giao diện</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {([['dark', 'Tối'], ['light', 'Sáng'], ['system', 'Theo hệ thống']] as const).map(([id, label]) => (
            <button type="button" key={id} onClick={() => cfg.setThemeSetting(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${cfg.themeSetting === id ? 'bg-red-500 text-white' : 'opacity-70 hover:opacity-100'}`}>{label}</button>
          ))}
        </div>
      </section>

      <section className="glass-subtle rounded-2xl border p-4 xl:col-span-2">
        <label className="mb-3 block text-sm font-semibold">Cỡ chữ</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([['small', 'Nhỏ'], ['medium', 'Vừa'], ['large', 'Lớn'], ['xlarge', 'Rất lớn']] as const).map(([id, label]) => (
            <button type="button" key={id} onClick={() => cfg.setFontSize(id)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${cfg.fontSize === id ? 'bg-red-500 text-white' : 'opacity-70 hover:opacity-100'}`}>{label}</button>
          ))}
        </div>
      </section>

      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-2 block text-sm font-semibold">Khóa Groq cho trợ lý AI</label>
        <input type="password" value={cfg.groqKey || ''} onChange={event => cfg.setGroqKey(event.target.value)} placeholder="gsk_..." className={inputClass} />
      </section>

      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-2 block text-sm font-semibold">Giọng đọc AI cục bộ</label>
        <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${colors.c_bgInput} ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
          OmniVoice được tích hợp trong tab Giọng đọc AI. Giọng clone và tệp âm thanh được lưu theo dự án, không cần khóa dịch vụ bên ngoài.
        </div>
      </section>

      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-2 block text-sm font-semibold">YouTube Client ID</label>
        <input value={cfg.youtubeClientId || ''} onChange={event => cfg.setYoutubeClientId(event.target.value)} placeholder="Mã ứng dụng YouTube" className={inputClass} />
      </section>
      <section className="glass-subtle rounded-2xl border p-4">
        <label className="mb-2 block text-sm font-semibold">YouTube Client Secret</label>
        <input type="password" value={cfg.youtubeClientSecret || ''} onChange={event => cfg.setYoutubeClientSecret(event.target.value)} placeholder="Mã bí mật YouTube" className={inputClass} />
      </section>

      <section className="glass-subtle flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 xl:col-span-2">
        <div>
          <p className="text-sm font-semibold">Cập nhật phần mềm</p>
          <p className={`mt-1 text-xs ${colors.c_textSub}`}>Kiểm tra bản phát hành mới trên GitHub và cài bản cập nhật khi có.</p>
        </div>
        <button type="button" onClick={onCheckUpdate} className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400">Kiểm tra cập nhật</button>
      </section>
    </div>
  </div>
)
