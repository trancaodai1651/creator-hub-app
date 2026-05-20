/* eslint-disable */
import { useState, useEffect } from 'react'
import { translations } from './constants/translations'
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

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [platform, setPlatform] = useState('win32')
  const [language, setLanguage] = useState<'vi' | 'en'>(() => (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi')
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(() => (localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system') || 'dark')
  const [isDark, setIsDark] = useState(true)
  const [customModal, setCustomModal] = useState<any>(null)
  const [updateProgress, setUpdateProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)

  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => {
    return localStorage.getItem('hub_first_run') !== 'false'
  })

  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('hub_groq_key') || '')
  const [elevenKey, setElevenKey] = useState(() => localStorage.getItem('hub_eleven_key') || '')

  const t = (key: string, replaceData?: any) => {
    let str = translations[language][key] || key
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

      const result = await (window as any).electron.ipcRenderer.invoke('check-for-updates')
      
      if (result && result.error) {
        setCustomModal({ show: true, title: "⚠️ LỖI ĐỊNH TUYẾN CẬP NHẬT", message: result.message })
        return
      }
      
      if (result && result.hasUpdate) {
        setCustomModal({
          show: true,
          title: `🚀 PHÁT HIỆN BẢN CẬP NHẬT MỚI (v${result.latestVersion})`,
          message: `Hệ thống phát hiện phiên bản bạn đang dùng (v${result.currentVersion}) đã cũ.\n\nNội dung cập nhật:\n${result.releaseNotes}\n\nVui lòng bấm OK để hệ thống tiến hành tự động tải về phiên bản mới.`,
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
            show: true, title: "🎉 THÔNG BÁO Hệ Thống", message: `Tuyệt vời! Creator Hub của bạn hiện đang ở phiên bản mới nhất (v${result.currentVersion}). Không cần nâng cấp gì thêm!`
          })
        }
      }
    } catch (err: any) {
      if (isManual) {
        setCustomModal({ show: true, title: "❌ LỖI HỆ THỐNG", message: `Không thể hoàn tất luồng kiểm tra: ${err.message}` })
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
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-80 flex flex-col p-6 shrink-0 border-r ${colors.c_bgPanel}`}>
        <div className="mb-10"><h1 className="text-2xl font-bold text-red-500 tracking-wider">CREATOR HUB</h1><p className="text-xs text-gray-500 mt-1 font-medium">v1.0.0 | {t('createdBy')}</p></div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
          {SIDEBAR_TABS.map((tab: any) => {
            const isActive = activeTab === tab.id
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
                  isActive 
                    ? 'bg-red-500 text-white shadow-md' 
                    : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <span className="text-base">{tab.icon}</span> 
                {/* Lớp truncate vẫn giữ nguyên để phòng hờ ngôn ngữ khác quá dài, nhưng chữ sẽ không bị cắt nữa vì Sidebar đã rộng ra */}
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

        <div className="mt-auto"><button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-red-500 text-white' : 'text-zinc-500'}`}>⚙️ <span>{t('settings')}</span></button></div>
      </aside>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 p-10 flex flex-col h-screen overflow-hidden">
        <header className="mb-8 shrink-0"><h2 className="text-3xl font-bold">{t('welcome')}</h2></header>

        {activeTab === 'home' && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 w-full overflow-y-auto p-3 -m-3 custom-scrollbar">
            {SIDEBAR_TABS.filter((tab: any) => tab.id !== 'home').map((tab: any) => (
              <div 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`border p-6 rounded-3xl transition-all flex flex-col gap-3 relative overflow-hidden cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] ${colors.c_bgPanel}`} 
              >
                <div className="flex justify-between items-start">
                  <span className="text-3xl">{tab.icon}</span>
                  {tab.isWip && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      Đang phát triển
                    </span>
                  )}
                </div>
                <h3 className={`text-lg font-bold ${tab.isWip ? 'text-zinc-500' : 'text-red-500'}`}>{t(tab.nameKey)}</h3>
                <p className={`text-xs ${colors.c_textSub}`}>{t(tab.descKey)}</p>
              </div>
            ))}
          </div>
        )}

        {/* TRẢ LẠI 2 TÍNH NĂNG JOINER VÀ DOWNLOADER VÀO MENU */}
        {activeTab === 'joiner' && <JoinerTab joiner={joiner} t={t} isDark={isDark} colors={colors} />}
        {activeTab === 'downloader' && <DownloaderTab dl={dl} t={t} colors={colors} />}
        
        {activeTab === 'converter' && <ConverterTab conv={conv} t={t} colors={colors} isDark={isDark} />}
        {activeTab === 'tts' && <TtsTab tts={tts} t={t} colors={colors} />}
        {activeTab === 'renamer' && <RenamerTab ren={ren} t={t} colors={colors} isDark={isDark} />}
        {activeTab === 'installer' && <InstallerTab ins={ins} t={t} colors={colors} isDark={isDark} platform={platform} />}
        {activeTab === 'uninstaller' && <UninstallerTab un={un} t={t} colors={colors} isDark={isDark} platform={platform} />}
        {activeTab === 'cleaner' && <CleanerTab clean={clean} t={t} colors={colors} isDark={isDark} />}
        
        {activeTab === 'settings' && <SettingsTab cfg={{ language, setLanguage, themeSetting, setThemeSetting, groqKey, setGroqKey, elevenKey, setElevenKey }} t={t} colors={colors} isDark={isDark} onCheckUpdate={() => handleCheckUpdate(true)} />}
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