/* eslint-disable */
import React from 'react'

interface WelcomeModalProps {
  language: 'vi' | 'en'
  setLanguage: (lang: 'vi' | 'en') => void
  themeSetting: 'dark' | 'light' | 'system'
  setThemeSetting: (theme: 'dark' | 'light' | 'system') => void
  isDark: boolean
  onComplete: () => void
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  language,
  setLanguage,
  themeSetting,
  setThemeSetting,
  isDark,
  onComplete
}) => {
  // Bộ từ điển mini nội bộ phục vụ riêng cho màn hình Onboarding thay đổi realtime
  const localText = {
    vi: {
      title: "Chào mừng đến với CREATOR HUB",
      sub: "Vui lòng thiết lập ngôn ngữ và giao diện ưu thích để bắt đầu tối ưu hóa trải nghiệm hệ thống của bạn.",
      langLabel: "1. Chọn Ngôn ngữ hệ thống (Language):",
      themeLabel: "2. Chọn Giao diện hiển thị (Interface Theme):",
      dark: "🌙 Giao diện Tối (Dark Mode)",
      light: "☀️ Giao diện Sáng (Light Mode)",
      system: "💻 Theo Hệ thống (Windows/Mac)",
      btn: "KÍCH HOẠT HỆ THỐNG"
    },
    en: {
      title: "Welcome to CREATOR HUB",
      sub: "Please configure your preferred language and theme interface to customize your workspace.",
      langLabel: "1. Select System Language:",
      themeLabel: "2. Select Interface Theme:",
      dark: "🌙 Dark Mode Theme",
      light: "☀️ Light Mode Theme",
      system: "💻 Match System Preferences",
      btn: "LAUNCH APPLICATION"
    }
  }

  const text = localText[language]

  // Tính toán màu sắc động dựa trên Theme đang lựa chọn thử nghiệm (Realtime Preview)
  const boxBg = isDark ? 'bg-[#171717] border-[#262626] text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-md transition-colors duration-300 ${isDark ? 'bg-black/80' : 'bg-zinc-900/40'}`}>
      <div className={`w-[520px] p-8 rounded-3xl border ${boxBg} flex flex-col gap-6 transform scale-100 transition-all duration-300`}>
        
        {/* Tiêu đề */}
        <div className="text-center flex flex-col gap-2">
          <span className="text-5xl animate-bounce">🚀</span>
          <h2 className="text-2xl font-black text-red-500 tracking-wide uppercase">{text.title}</h2>
          <p className="text-xs font-semibold text-zinc-500 leading-relaxed px-4">{text.sub}</p>
        </div>

        <hr className={isDark ? 'border-zinc-800' : 'border-zinc-100'} />

        {/* Khối 1: Lựa chọn Ngôn ngữ */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-bold flex items-center gap-2">🌐 {text.langLabel}</label>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button 
              onClick={() => setLanguage('vi')} 
              className={`py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${language === 'vi' ? 'bg-red-500 border-red-600 text-white shadow-lg' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className={`py-3 rounded-xl font-bold text-sm border transition-all cursor-pointer ${language === 'en' ? 'bg-red-500 border-red-600 text-white shadow-lg' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}
            >
              🇺🇸 English
            </button>
          </div>
        </div>

        {/* Khối 2: Lựa chọn Chủ đề */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm font-bold flex items-center gap-2">🎨 {text.themeLabel}</label>
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={() => setThemeSetting('dark')} 
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border text-left flex justify-between items-center transition-all cursor-pointer ${themeSetting === 'dark' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span>{text.dark}</span>{themeSetting === 'dark' && <span>✓</span>}
            </button>
            <button 
              onClick={() => setThemeSetting('light')} 
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border text-left flex justify-between items-center transition-all cursor-pointer ${themeSetting === 'light' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span>{text.light}</span>{themeSetting === 'light' && <span>✓</span>}
            </button>
            <button 
              onClick={() => setThemeSetting('system')} 
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border text-left flex justify-between items-center transition-all cursor-pointer ${themeSetting === 'system' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}
            >
              <span>{text.system}</span>{themeSetting === 'system' && <span>✓</span>}
            </button>
          </div>
        </div>

        {/* Nút hoàn tất */}
        <button 
          onClick={onComplete}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-4 rounded-xl text-sm transition-transform active:scale-[0.98] shadow-lg cursor-pointer tracking-wider mt-2"
        >
          {text.btn}
        </button>
      </div>
    </div>
  )
}