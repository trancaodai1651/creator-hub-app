/* eslint-disable */
import { useState, useEffect } from 'react'
import { translations } from './constants/locales'
import { DARK_THEME, LIGHT_THEME } from './constants/theme'
import { SIDEBAR_TABS } from './constants/navigation'

// Import Hooks điều phối dữ liệu
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

// Import giao diện các Tabs độc lập
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
  const [isDark, setIsDark] = useState(true)
  const [customModal, setCustomModal] = useState<any>(null)
  const [updateProgress, setUpdateProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)

  // ==========================================
  // STATE CHO MÀN HÌNH KHỞI ĐỘNG (SPLASH SCREEN)
  // ==========================================
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

  // Khởi tạo các Hook
  const joiner = useJoiner(t, setCustomModal)
  const dl = useDownloader(t, setCustomModal)
  const conv = useConverter(t, setCustomModal, groqKey)
  const tts = useTts(t, setCustomModal, elevenKey, activeTab)
  const ren = useRenamer(t, setCustomModal)
  const ins = useInstaller(t, setCustomModal)
  const un = useUninstaller(t, setCustomModal, activeTab)
  const clean = useCleaner(t, setCustomModal, activeTab)
  const chat = useChatbot(t, setCustomModal, groqKey) // Đã được đưa vào trong hàm App()
  const pub = usePublisher(t, setCustomModal)

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-platform').then((res: string) => setPlatform(res))
  }, [])

  useEffect(() => {
    localStorage.setItem('hub_lang', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('hub_theme', themeSetting)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeCalculation = () => {
      if (themeSetting === 'dark') setIsDark(true)
      else if (themeSetting === 'light') setIsDark(false)
      else setIsDark(mediaQuery.matches)
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

      // Xử lý thông minh: Thêm cơ chế Timeout tránh treo App nếu Backend không có Handler
      const result: any = await Promise.race([
        (window as any).electron.ipcRenderer.invoke('check-for-updates'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_NO_HANDLER')), 3000))
      ]);
      
      if (result && result.error) {
        setCustomModal({ show: true, title: "⚠️ LỖI ĐỊNH TUYẾN CẬP NHẬT", message: result.message })
        return
      }
      
      if (result && result.hasUpdate) {
        setCustomModal({
          show: true,
          title: `🚀 PHÁT HIỆN BẢN CẬP NHẬT MỚI (v${result.latestVersion})`,
          message: `Hệ thống phát hiện phiên bản bạn đang dùng (v${result.currentVersion}) đã cũ.

Nội dung cập nhật:
${result.releaseNotes}

Vui lòng bấm OK để hệ thống tiến hành tự động tải về phiên bản mới.`,
          onConfirm: async () => {
            setUpdateProgress({ show: true, msg: t('updateConnecting') || 'Đang kết nối cổng tải GitHub...', percent: 0 });
            (window as any).electron.ipcRenderer.on('update-progress', (_e: any, data: any) => {
              setUpdateProgress({ show: true, msg: data.message, percent: data.percent })
            })
            const res = await (window as any).electron.ipcRenderer.invoke('trigger-auto-update', { 
              downloadUrl: result.downloadUrl, fileName: result.fileName, language: language 
            })
            
            if (!res.success) {
              setUpdateProgress(null)
              setCustomModal({ show: true, title: t('updateError') || "LỖI TẢI CẬP NHẬT", message: res.message })
            }
          }
        })
      } else {
        if (isManual) {
          setCustomModal({
            show: true, title: "🎉 THÔNG BÁO HỆ THỐNG", message: `Tuyệt vời! Creator Hub của bạn hiện đang ở phiên bản mới nhất (v${result.currentVersion}). Không cần nâng cấp gì thêm!`
          })
        }
      }
    } catch (err: any) {
      console.warn("Lỗi kiểm tra cập nhật (Bỏ qua nếu đang ở môi trường Dev):", err.message);
      if (isManual) {
        // Bắt lỗi cụ thể để báo lại cho người dùng
        let errorMsg = err.message;
        if (errorMsg.includes('No handler registered') || errorMsg.includes('TIMEOUT')) {
           errorMsg = "Tính năng tự động cập nhật đang chạy ở chế độ Phát triển (Dev Mode) hoặc Core Backend chưa được cấu hình. Tính năng này chỉ hoạt động khi bạn Build ra file cài đặt (.exe / .app) !";
        }
        setCustomModal({ show: true, title: "⚠️ CHƯA KÍCH HOẠT UPDATE", message: errorMsg })
      }
    }
  }

  useEffect(() => {
    if (isFirstRun) return
    const timer = setTimeout(() => { handleCheckUpdate(false) }, 3000)
    return () => clearTimeout(timer)
  }, [isFirstRun])

  const handleOnboardingComplete = () => {
    localStorage.setItem('hub_first_run', 'false')
    setIsFirstRun(false)
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${colors.c_bgMain}`}>
      
      {/* 🚀 THẺ DIV KÉO THẢ INLINE SIÊU CẤP ĐÃ ĐƯỢC CHÈN ĐÚNG VỊ TRÍ */}
      <div 
        className="fixed top-0 left-0 right-[140px] h-10 select-none bg-transparent"
        style={{ WebkitAppRegion: 'drag', zIndex: 99999999 } as any}
      />

      {/* ========================================== */}
      {/* 🚀 MÀN HÌNH KHỞI ĐỘNG (SPLASH SCREEN)      */}
      {/* ========================================== */}
      {bootState !== 'done' && (
        <div className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-500 ease-in-out ${bootState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute w-72 h-72 bg-red-600/20 blur-[100px] rounded-full animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            {/* LOGO CHÍNH (THAY TÀU VŨ TRỤ) */}
            <div className="w-24 h-24 mb-6 animate-bounce drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full">
                <defs>
                  <linearGradient id="brandLg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <filter id="glowLg" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="15" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="256" cy="256" r="140" fill="none" stroke="url(#brandLg)" strokeWidth="40" opacity="0.15" />
                <circle cx="256" cy="256" r="140" fill="none" stroke="url(#brandLg)" strokeWidth="40" strokeDasharray="200 120" strokeLinecap="round" transform="rotate(-90 256 256)" filter="url(#glowLg)"/>
                <path d="M216 186 L336 256 L216 326 Z" fill="url(#brandLg)" filter="url(#glowLg)" />
                <path d="M340 160 L350 130 L380 120 L350 110 L340 80 L330 110 L300 120 L330 130 Z" fill="#ffffff" filter="url(#glowLg)" opacity="0.9" />
              </svg>
            </div>
            <h1 className="text-5xl font-black text-white tracking-[0.25em] uppercase drop-shadow-lg">
              Creator<span className="text-red-500">Hub</span>
            </h1>
            <p className="text-zinc-500 text-xs font-bold tracking-widest mt-4 uppercase animate-pulse">
              Đang nạp hệ sinh thái...
            </p>
            <div className="w-64 h-1.5 bg-zinc-800 rounded-full mt-10 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all ease-out"
                style={{ width: `${bootProgress}%`, transitionDuration: '2000ms' }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {/* ========================================== */}
      {/* SIDEBAR NAVIGATION (Ẩn khi ở tab Dashboard)*/}
      {/* ========================================== */}
      {activeTab !== 'home' && (
        // 👇 TÍCH HỢP ĐỒNG THỜI QUYỀN KÉO THẢ (drag) VÀ KHÓA BÔI XANH (select-none) CHO SIDEBAR
        <aside className={`w-80 flex flex-col p-6 shrink-0 border-r select-none ${colors.c_bgPanel}`} style={{ WebkitAppRegion: 'drag' } as any}>
          <div className="mb-10 select-none flex items-center gap-3">
            {/* 🚀 KHỐI LOGO VECTOR SVG */}
            <div className="w-11 h-11 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full drop-shadow-md">
                <defs>
                  <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="12" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="256" cy="256" r="140" fill="none" stroke="url(#brand)" strokeWidth="40" opacity="0.15" />
                <circle cx="256" cy="256" r="140" fill="none" stroke="url(#brand)" strokeWidth="40" strokeDasharray="200 120" strokeLinecap="round" transform="rotate(-90 256 256)" filter="url(#glow)"/>
                <path d="M216 186 L336 256 L216 326 Z" fill="url(#brand)" filter="url(#glow)" />
                <path d="M340 160 L350 130 L380 120 L350 110 L340 80 L330 110 L300 120 L330 130 Z" fill="#ffffff" filter="url(#glow)" opacity="0.9" />
              </svg>
            </div>
            
            {/* TÊN ỨNG DỤNG & VERSION */}
            <div className="flex flex-col justify-center">
              <h1 className="text-[22px] font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 tracking-wide leading-none">
                CREATOR HUB
              </h1>
              <p className="text-[10px] text-zinc-500 mt-1.5 font-bold tracking-widest uppercase">
                v1.1.1 | {t('createdBy')}
              </p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {SIDEBAR_TABS.map((tab: any) => {
              const isActive = activeTab === tab.id
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  style={{ WebkitAppRegion: 'no-drag' } as any} // Trả lại quyền click cho nút bấm
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-red-500 text-white shadow-md' 
                      : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span> 
                  <span className="truncate text-left">{t(tab.nameKey)}</span>
                  
                  {tab.isWip && (
                    <span className={`ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'text-white bg-white/20' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      DEV
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto">
            <button 
              onClick={() => setActiveTab('settings')} 
              style={{ WebkitAppRegion: 'no-drag' } as any} // Trả lại quyền click cho nút Settings
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-red-500 text-white' : 'text-zinc-500 hover:bg-[#262626]'}`}
            >
              ⚙️ <span>{t('settings')}</span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================== */}
      {/* MAIN VIEW CONTENT                            */}
      {/* ========================================== */}
      <main className={`flex-1 p-5 md:p-10 flex flex-col h-screen overflow-hidden relative ${activeTab === 'home' ? 'max-w-[1400px] mx-auto w-full' : ''}`}>

        {/* 🎨 CSS nội bộ cho hiệu ứng xuất hiện mượt mà */}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>

        {/* ========================================== */}
        {/* HEADER TÙY BIẾN (CHỈ HIỂN THỊ Ở TRANG CHỦ)   */}
        {/* ========================================== */}
        {activeTab === 'home' && (
          // 👇 KHÓA BÔI XANH CHO TOÀN BỘ HEADER TRANG CHỦ
          <header className="w-full flex justify-between items-center mb-6 md:mb-10 mt-2 shrink-0 px-2 md:px-4 opacity-0 animate-fade-in-up select-none">
            <div className="w-10 md:w-14"></div> {/* Spacer */}
            
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-[40px] font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-sm tracking-tight leading-tight">
                {t('welcome')}
              </h2>
              <p className={`text-xs md:text-sm mt-1.5 font-medium tracking-widest uppercase ${colors.c_textSub}`}>
                Hệ sinh thái tối ưu hóa hiệu suất
              </p>
            </div>
            
            {/* NÚT CÀI ĐẶT TRÊN DASHBOARD */}
            <button
              onClick={() => setActiveTab('settings')}
              style={{ WebkitAppRegion: 'no-drag' } as any} // Đảm bảo nút click được
              className={`group flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] ${isDark ? 'bg-[#1a1a1a] border-zinc-800 hover:border-red-500/50' : 'bg-white border-zinc-200 hover:border-red-400'}`}
              title="Cài đặt hệ thống"
            >
              <span className="text-xl md:text-2xl group-hover:rotate-90 transition-transform duration-500 text-zinc-400 group-hover:text-red-500">⚙️</span>
            </button>
          </header>
        )}

        {/* ========================================== */}
        {/* GRID TÍNH NĂNG (GÓI GỌN TRONG THANH CUỘN ĐỂ RESPONSIVE) */}
        {/* ========================================== */}
        {activeTab === 'home' && (
          <>
            {/* Khu vực cuộn dành riêng cho danh sách thẻ tính năng */}
            <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 pb-2 flex flex-col">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-7 w-full p-2">
                {SIDEBAR_TABS.filter((tab: any) => tab.id !== 'home').map((tab: any, index: number) => (
                  <div 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative p-6 md:p-7 rounded-[28px] md:rounded-[32px] transition-all duration-500 ease-out flex flex-col gap-4 cursor-pointer overflow-hidden border opacity-0 animate-fade-in-up ${
                      isDark 
                        ? 'border-zinc-800/60 bg-[#121212] hover:bg-[#181818]' 
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    } hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.25)] hover:border-red-500/50`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Gradient Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isDark ? 'bg-zinc-800/50 group-hover:bg-red-500/20' : 'bg-zinc-100 group-hover:bg-red-50'}`}>
                        <span className="text-2xl md:text-3xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-out drop-shadow-md">{tab.icon}</span>
                      </div>

                      {tab.isWip && (
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">
                          Đang phát triển
                        </span>
                      )}
                    </div>
                    
                    <div className="relative z-10 mt-2">
                      <h3 className={`text-lg md:text-xl font-black transition-colors duration-300 ${tab.isWip ? (isDark ? 'text-zinc-500 group-hover:text-amber-500' : 'text-zinc-400 group-hover:text-amber-600') : 'text-red-500 group-hover:text-red-400'}`}>
                        {t(tab.nameKey)}
                      </h3>
                      <p className={`text-xs md:text-sm mt-2 leading-relaxed transition-colors duration-300 ${isDark ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-700'}`}>
                        {t(tab.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CHỮ KÝ CÁ NHÂN */}
            <div className="shrink-0 pt-6 pb-2 w-full flex justify-center items-center opacity-0 animate-fade-in-up select-none" style={{ animationDelay: '600ms' }}>
              <div className={`flex items-center gap-4 px-6 md:px-8 py-2 md:py-3 rounded-full border backdrop-blur-md shadow-sm ${isDark ? 'bg-zinc-900/40 border-zinc-800/50' : 'bg-white/50 border-zinc-200'}`}>
                <span className="w-4 md:w-8 h-[1px] bg-gradient-to-r from-transparent to-zinc-500"></span>
                <p className="text-[10px] md:text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                {t('engineeredBy')} <span className="text-red-500 font-black text-sm ml-1">TCD</span>
                </p>
                <span className="w-4 md:w-8 h-[1px] bg-gradient-to-l from-transparent to-zinc-500"></span>
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* CÁC TÍNH NĂNG VÀ SETTINGS (CÓ ANIMATION)   */}
        {/* ========================================== */}
        {activeTab !== 'home' && (
          <div 
            key={activeTab} 
            className="w-full h-full flex-1 flex flex-col opacity-0 animate-fade-in-up"
            style={{ animationDuration: '0.4s' }}
          >
            {activeTab === 'joiner' && <JoinerTab joiner={joiner} t={t} isDark={isDark} colors={colors} />}
            {activeTab === 'downloader' && <DownloaderTab dl={dl} t={t} colors={colors} />}
            {activeTab === 'converter' && <ConverterTab conv={conv} t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'tts' && <TtsTab tts={tts} t={t} colors={colors} />}
            {activeTab === 'renamer' && <RenamerTab ren={ren} t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'installer' && <InstallerTab ins={ins} t={t} colors={colors} isDark={isDark} platform={platform} />}
            {activeTab === 'uninstaller' && <UninstallerTab un={un} t={t} colors={colors} isDark={isDark} platform={platform} />}
            {activeTab === 'cleaner' && <CleanerTab clean={clean} t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'chatbot' && <ChatbotTab chat={chat} t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'publisher' && <PublisherTab publisher={pub} t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'guide' && <GuideTab t={t} colors={colors} isDark={isDark} />}
            {activeTab === 'settings' && <SettingsTab cfg={{ language, setLanguage, themeSetting, setThemeSetting, groqKey, setGroqKey, elevenKey, setElevenKey }} t={t} colors={colors} isDark={isDark} onCheckUpdate={() => handleCheckUpdate(true)} />}
          </div>
        )}
      </main>

      {/* POPUP WINDOW MODAL CHÍNH CHỦ */}
      {customModal?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] transition-all backdrop-blur-xs p-4">
          <div className={`w-[500px] p-7 rounded-3xl border ${colors.c_bgPanel} shadow-2xl relative flex flex-col gap-4 transform scale-100 transition-all duration-200`}>
            <button onClick={() => setCustomModal(null)} className={`absolute top-5 right-5 text-lg font-bold select-none cursor-pointer ${colors.c_textSub} hover:text-red-500 transition-colors`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-3 border-zinc-500/10 shrink-0">
              <span className="text-xl">🔔</span>
              <h4 className="text-lg font-bold text-red-500 tracking-wide uppercase">{customModal.title}</h4>
            </div>
            
            <div className={`text-sm font-medium py-2 leading-relaxed whitespace-pre-line overflow-y-auto max-h-[350px] pr-2 custom-scrollbar ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
              {customModal.message}
            </div>
            
            <button 
              onClick={async () => {
                const action = customModal.onConfirm;
                setCustomModal(null);
                if (action) { await action() }
              }} 
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md cursor-pointer transition-transform active:scale-[0.98] tracking-wider shrink-0 mt-1"
            >
              {t('modalConfirm') || 'XÁC NHẬN'}
            </button>
          </div>
        </div>
      )}

      {/* POPUP LOCK-SCREEN TIẾN TRÌNH TẢI */}
      {updateProgress?.show && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] backdrop-blur-md transition-all">
          <div className={`w-[500px] p-8 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-5 text-center`}>
            <span className="text-5xl animate-spin mb-2">⚙️</span>
            <h3 className="text-xl font-black text-red-500 tracking-wide uppercase">{t('updateProgressTitle') || 'Đang Nâng Cấp Hệ Thống Tự Động'}</h3>
            <p className={`text-xs font-semibold leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
              {t('updateProgressDesc') || 'Creator Hub đang tải tệp tin cài đặt chính thức từ đám mây Cloud GitHub.\nVui lòng giữ nguyên cửa sổ, hệ thống sẽ tự động tắt và khởi chạy bảng cập nhật ngay sau khi hoàn tất.'}
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

      {/* WELCOME ONBOARDING MODAL */}
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
