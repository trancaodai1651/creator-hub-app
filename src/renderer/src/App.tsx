/* eslint-disable */
import { useState, useEffect } from 'react'
import { translations } from './constants/locales'
import { DARK_THEME, LIGHT_THEME } from './constants/theme'
import { SIDEBAR_TABS } from './constants/navigation'

// Import đầy đủ 100% Hooks điều phối dữ liệu
import { useJoiner } from './hooks/useJoiner'
import { useDownloader } from './hooks/useDownloader'
import { useConverter } from './hooks/useConverter'
import { useTts } from './hooks/useTts'
import { useRenamer } from './hooks/useRenamer'
import { useInstaller } from './hooks/useInstaller'
import { useUninstaller } from './hooks/useUninstaller'
import { useCleaner } from './hooks/useCleaner'
import { useChatbot } from './hooks/useChatbot'
import { usePublisher } from './hooks/usePublisher'

// Import giao diện các Tabs độc lập và Component Màn hình khởi động
import { SplashScreen } from './modules/SplashScreen'
import { JoinerTab } from './modules/JoinerTab'
import { DownloaderTab } from './modules/DownloaderTab'
import { ConverterTab } from './modules/ConverterTab'
import { TtsTab } from './modules/TtsTab'
import { RenamerTab } from './modules/RenamerTab'
import { InstallerTab } from './modules/InstallerTab'
import { UninstallerTab } from './modules/UninstallerTab'
import { CleanerTab } from './modules/CleanerTab'
import { SettingsTab } from './modules/SettingsTab'
import { WelcomeModal } from './modules/WelcomeModal'
import { GuideTab } from './modules/GuideTab'
import { ChatbotTab } from './modules/ChatbotTab'
import { PublisherTab } from './modules/PublisherTab'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [platform, setPlatform] = useState('win32')
  const [language, setLanguage] = useState<'vi' | 'en'>(() => (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi')
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(() => (localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system') || 'dark')
  
  // State điều chỉnh kích thước chữ tổng cục
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(
    () => (localStorage.getItem('hub_font_size') as any) || 'medium'
  )

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('hub_theme') || 'dark'
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [customModal, setCustomModal] = useState<any>(null)
  const [updateProgress, setUpdateProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)

  // STATE CHO MÀN HÌNH KHỞI ĐỘNG (SPLASH SCREEN)
  const [bootState, setBootState] = useState<'booting' | 'fading' | 'done'>('booting')
  const [bootProgress, setBootProgress] = useState(0)

  useEffect(() => {
    const progressTimer = setTimeout(() => setBootProgress(100), 100)
    const fadeTimer = setTimeout(() => setBootState('fading'), 2200)
    const doneTimer = setTimeout(() => setBootState('done'), 2700)

    return () => {
      clearTimeout(progressTimer)
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => {
    return localStorage.getItem('hub_first_run') !== 'false'
  })

  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('hub_groq_key') || '')
  const [elevenKey, setElevenKey] = useState(() => localStorage.getItem('hub_eleven_key') || '')

  const t = (key: string, replaceData?: any) => {
    let str = (translations as any)[language]?.[key] || key
    if (replaceData) { Object.keys(replaceData).forEach((k: string) => { str = str.replace(`{${k}}`, replaceData[k]) }) }
    return str
  }

  // Khởi tạo đầy đủ các Hook bộ não điều khiển dữ liệu
  const joiner = useJoiner(t, setCustomModal)
  const dl = useDownloader(t, setCustomModal)
  const conv = useConverter(t, setCustomModal, groqKey)
  const tts = useTts(t, setCustomModal, elevenKey, activeTab)
  const ren = useRenamer(t, setCustomModal)
  const ins = useInstaller(t, setCustomModal)
  const un = useUninstaller(t, setCustomModal, activeTab)
  const clean = useCleaner(t, setCustomModal, activeTab)
  const chat = useChatbot(t, setCustomModal, groqKey) 
  const pub = usePublisher(setCustomModal)

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-platform').then((res: string) => setPlatform(res))
  }, [])

  useEffect(() => {
    localStorage.setItem('hub_lang', language)
  }, [language])

  // Cấu hình tỷ lệ kích thước font chữ hệ thống
  useEffect(() => {
    localStorage.setItem('hub_font_size', fontSize)
    const sizeMap = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' }
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px'
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('hub_theme', themeSetting)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleThemeCalculation = () => {
      let darkActive = false
      if (themeSetting === 'dark') darkActive = true
      else if (themeSetting === 'light') darkActive = false
      else darkActive = mediaQuery.matches

      setIsDark(darkActive)

      if (darkActive) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    handleThemeCalculation()
    mediaQuery.addEventListener('change', handleThemeCalculation)
    return () => mediaQuery.removeEventListener('change', handleThemeCalculation)
  }, [themeSetting])

  const colors = isDark ? DARK_THEME : LIGHT_THEME

  const handleCheckUpdate = async (isManual = false) => {
    try {
      if (isManual) {
        setCustomModal({
          show: true, title: "🔍 ĐANG KIỂM TRA", message: "Hệ thống đang kết nối đám mây GitHub để quét tìm phiên bản. Vui lòng đợi trong giây lát..."
        })
      }
      const result: any = await Promise.race([
        (window as any).electron.ipcRenderer.invoke('check-for-updates'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_NO_HANDLER')), 3000))
      ]);
      if (result && result.hasUpdate) {
        setCustomModal({
          show: true,
          title: `🚀 PHÁT HIỆN BẢN CẬP NHẬT MỚI (v${result.latestVersion})`,
          message: `Nội dung cập nhật:\n${result.releaseNotes}\n\nVui lòng bấm OK để tải về tự động.`,
          onConfirm: async () => {
            setUpdateProgress({ show: true, msg: t('updateConnecting'), percent: 0 });
            (window as any).electron.ipcRenderer.on('update-progress', (_e: any, data: any) => {
              setUpdateProgress({ show: true, msg: data.message, percent: data.percent })
            })
            await (window as any).electron.ipcRenderer.invoke('trigger-auto-update', { downloadUrl: result.downloadUrl, fileName: result.fileName, language: language })
          }
        })
      }
    } catch (err) {}
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('hub_first_run', 'false')
    setIsFirstRun(false)
  }

  const virtualLogoDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`;

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-200 ${colors.c_bgMain} ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
      
      {/* VÙNG KÉO THẢ CỬA SỔ DRAG NATIVE */}
      <div 
        className="fixed top-0 left-0 right-[180px] h-14 select-none bg-transparent"
        style={{ WebkitAppRegion: 'drag', zIndex: 99999999 } as any}
      />

      {/* MÀN HÌNH KHỞI ĐỘNG SPLASH SCREEN */}
      <SplashScreen 
        bootState={bootState} 
        bootProgress={bootProgress} 
        isDark={isDark} 
        t={t} 
        logo={virtualLogoDataUri} 
      />

      {/* ========================================================== */}
      {/* 1. TOP HEADER TOOLBAR */}
      {/* ========================================================== */}
      <header 
        className={`h-14 flex items-center justify-between pl-[96px] pr-6 border-b select-none shrink-0 transition-all shadow-sm ${
          isDark ? 'bg-[#18181b] border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
        } backdrop-blur-md`} 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-6 h-6 shrink-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-black tracking-wider uppercase opacity-90">CREATOR HUB</span>
            <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner">v1.1.1</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all shadow-sm ${
            isDark ? 'bg-zinc-800 border-zinc-700/60 text-zinc-200 hover:border-red-500/50' : 'bg-white border-zinc-200 text-zinc-700 hover:border-red-400'
          }`}
        >
          <span>⚙️</span>
          <span>{t('settings')}</span>
        </button>
      </header>
      
      {/* ========================================================== */}
      {/* 2. KHU VỰC LAYOUT PANEL CHÍNH */}
      {/* ========================================================== */}
      <div className={`flex-1 flex overflow-hidden p-4 gap-4 transition-all ${isDark ? 'bg-[#0f0f12]' : 'bg-zinc-50'}`}>
        
        {/* ================= SIDEBAR NAVIGATION ================= */}
        {activeTab !== 'home' && (
          <aside className={`w-[285px] flex flex-col p-3.5 shrink-0 rounded-[1.25rem] border shadow-sm ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
              {SIDEBAR_TABS.map((tab: any) => {
                const isActive = activeTab === tab.id
                const isLocked = tab.isWip; // 🚀 Khóa nếu tab có cờ DEV

                return (
                  <button 
                    key={tab.id} 
                    disabled={isLocked} // Ngắt tính năng Click hệ thống
                    onClick={() => !isLocked && setActiveTab(tab.id)} 
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isLocked 
                        ? `opacity-40 cursor-not-allowed ${isDark ? 'text-zinc-500' : 'text-zinc-400'}` // Nền mờ, trỏ chuột cấm
                        : isActive 
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/10' 
                          : isDark ? 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span className={`text-base shrink-0 ${isLocked ? 'grayscale opacity-50' : ''}`}>{tab.icon}</span> 
                    <span className="truncate text-left font-bold flex-1">{t(tab.nameKey)}</span>
                    {isLocked && <span className="ml-auto text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">DEV</span>}
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* WORKSPACE CONTENT LÕI CHÍNH */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-up { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          `}</style>

          {/* TRANG CHỦ HOME (DASHBOARD BENTO GRID) */}
          {activeTab === 'home' && (
            <header className="w-full text-center mb-8 mt-4 shrink-0 px-4 opacity-0 animate-fade-in-up select-none">
              <h2 className="text-3xl md:text-[40px] font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-sm tracking-tight leading-tight">
                {t('welcome')}
              </h2>
              <p className={`text-xs md:text-sm mt-2 font-medium tracking-widest uppercase ${colors.c_textSub}`}>
                Hệ sinh thái tối ưu hóa hiệu suất
              </p>
            </header>
          )}

          {activeTab === 'home' && (
            <>
              <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 pb-2 flex flex-col">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-7 w-full p-2">
                  {SIDEBAR_TABS.filter((tab: any) => tab.id !== 'home').map((tab: any, index: number) => {
                    const isLocked = tab.isWip; // 🚀 Khóa nếu tab có cờ DEV

                    return (
                      <div 
                        key={tab.id} 
                        onClick={() => !isLocked && setActiveTab(tab.id)}
                        className={`group relative p-6 md:p-7 rounded-[32px] md:rounded-[40px] transition-all duration-500 ease-out flex flex-col gap-4 overflow-hidden border opacity-0 animate-fade-in-up ${
                          isLocked 
                            ? `opacity-40 cursor-not-allowed ${isDark ? 'border-zinc-800/30 bg-[#16161a]/30' : 'border-zinc-200/50 bg-zinc-50/50'}` // Box mờ, mất hover nếu DEV
                            : `cursor-pointer ${isDark ? 'border-zinc-800/80 bg-[#16161a] text-white hover:bg-[#1f1f24]' : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'} hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.25)] hover:border-red-500/50`
                        }`}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        {!isLocked && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>}
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
                            isLocked 
                              ? isDark ? 'bg-zinc-800/30 grayscale' : 'bg-zinc-200/50 grayscale'
                              : isDark ? 'bg-zinc-800/60 group-hover:bg-red-500/20' : 'bg-zinc-100 group-hover:bg-red-50'
                          }`}>
                            <span className={`text-2xl md:text-3xl transition-transform duration-300 ease-out drop-shadow-md ${!isLocked && 'group-hover:scale-110 group-hover:rotate-6'}`}>{tab.icon}</span>
                          </div>
                          {isLocked && (
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                              Đang phát triển
                            </span>
                          )}
                        </div>
                        <div className="relative z-10 mt-2">
                          <h3 className={`text-lg md:text-xl font-black transition-colors duration-300 ${isLocked ? (isDark ? 'text-zinc-500' : 'text-zinc-400') : 'text-red-500 group-hover:text-red-400'}`}>
                            {t(tab.nameKey)}
                          </h3>
                          <p className={`text-xs md:text-sm mt-2 leading-relaxed transition-colors duration-300 ${isLocked ? (isDark ? 'text-zinc-600' : 'text-zinc-400') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`}>
                            {t(tab.descKey)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="shrink-0 pt-6 pb-2 w-full flex justify-center items-center opacity-0 animate-fade-in-up select-none" style={{ animationDelay: '500ms' }}>
                <div className={`flex items-center gap-4 px-6 md:px-8 py-2 md:py-3 rounded-full border backdrop-blur-md shadow-sm ${isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-white/50 border-zinc-200'}`}>
                  <span className="w-4 md:w-8 h-[1px] bg-gradient-to-r from-transparent to-zinc-500"></span>
                  <p className={`text-[10px] md:text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {t('engineeredBy')} <span className="text-red-500 font-black text-sm ml-1">TCD</span>
                  </p>
                  <span className="w-4 md:w-8 h-[1px] bg-gradient-to-l from-transparent to-zinc-500"></span>
                </div>
              </div>
            </>
          )}

          {/* ĐIỀU PHỐI HIỂN THỊ CÁC COMPONENT TAB CON */}
          {activeTab !== 'home' && (
            <div 
              key={activeTab} 
              className={`w-full h-full flex-1 flex flex-col overflow-hidden opacity-0 animate-fade-in-up rounded-[1.25rem] border shadow-md ${colors.c_bgPanel} ${colors.c_borderT}`}
              style={{ animationDuration: '0.3s' }}
            >
              {activeTab === 'joiner' && <JoinerTab joiner={joiner} t={t} isDark={isDark} colors={colors} />}
              {activeTab === 'downloader' && <DownloaderTab dl={dl} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'converter' && <ConverterTab conv={conv} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'tts' && <TtsTab tts={tts} t={t} colors={colors} />}
              {activeTab === 'renamer' && <RenamerTab ren={ren} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'installer' && <InstallerTab ins={ins} t={t} colors={colors} isDark={isDark} platform={platform} />}
              {activeTab === 'uninstaller' && <UninstallerTab un={un} t={t} colors={colors} isDark={isDark} platform={platform} />}
              {activeTab === 'cleaner' && <CleanerTab clean={clean} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'chatbot' && <ChatbotTab chat={chat} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'publisher' && <PublisherTab publisher={pub} t={t} colors={colors} isDark={isDark} />}
              {activeTab === 'guide' && <GuideTab t={t} colors={colors} isDark={isDark} />}
              
              {activeTab === 'settings' && (
                <SettingsTab 
                  cfg={{ language, setLanguage, themeSetting, setThemeSetting, fontSize, setFontSize, groqKey, setGroqKey, elevenKey, setElevenKey }} 
                  t={t} 
                  colors={colors} 
                  isDark={isDark} 
                  onCheckUpdate={() => handleCheckUpdate(true)} 
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* POPUP SYSTEM WINDOW MODAL */}
      {customModal?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] transition-all backdrop-blur-xs p-4">
          <div className={`w-[480px] p-6 rounded-2xl border ${colors.c_bgPanel} ${colors.c_borderT} shadow-2xl relative flex flex-col gap-4 transform scale-100 transition-all duration-200`}>
            <button onClick={() => setCustomModal(null)} className={`absolute top-4 right-4 text-base font-bold select-none cursor-pointer ${colors.c_textSub} hover:text-red-500 transition-colors`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-2.5 border-zinc-500/10 shrink-0">
              <span className="text-xl">🔔</span>
              <h4 className="text-md font-black text-red-500 tracking-wide uppercase">{customModal.title}</h4>
            </div>
            <div className={`text-sm font-semibold py-1 leading-relaxed whitespace-pre-line overflow-y-auto max-h-[300px] pr-2 custom-scrollbar ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
              {customModal.message}
            </div>
            <button 
              onClick={async () => {
                const action = customModal.onConfirm;
                setCustomModal(null);
                if (action) { await action() }
              }} 
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-xs tracking-widest shadow-md transition-transform active:scale-[0.98]"
            >
              {t('modalConfirm') || 'XÁC NHẬN'}
            </button>
          </div>
        </div>
      )}

      {/* POPUP LOCK-SCREEN TIẾN TRÌNH CẬP NHẬT */}
      {updateProgress?.show && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] backdrop-blur-md transition-all">
          <div className={`w-[500px] p-8 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-5 text-center`}>
            <span className="text-5xl animate-spin mb-2">⚙️</span>
            <h3 className="text-xl font-black text-red-500 tracking-wide uppercase">{t('updateProgressTitle') || 'Đang Nâng Cấp Hệ Thống'}</h3>
            <p className={`text-xs font-semibold leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
              {t('updateProgressDesc') || 'Creator Hub đang tải tệp tin cài đặt chính thức từ đám mây.\nVui lòng giữ nguyên cửa sổ, hệ thống sẽ tự động tắt và khởi chạy bảng cập nhật ngay sau khi hoàn tất.'}
            </p>
            <div className="mt-4 w-full">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-red-500 animate-pulse truncate max-w-[380px]">{updateProgress.msg}</span>
                <span className="text-red-500 font-black">{updateProgress.percent}%</span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden border ${colors.c_bgInput}`}>
                <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-200" style={{ width: `${updateProgress.percent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFirstRun && (
        <WelcomeModal 
          language={language} setLanguage={setLanguage}
          themeSetting={themeSetting} setThemeSetting={setThemeSetting}
          isDark={isDark} onComplete={handleOnboardingComplete}
        />
      )}

    </div>
  )
}