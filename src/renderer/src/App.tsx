/* eslint-disable */
import React, { useEffect, useState } from 'react'
import { translations } from './constants/locales'
import { DARK_THEME, LIGHT_THEME } from './constants/theme'
import { SIDEBAR_TABS } from './constants/navigation'
import { SplashScreen } from './modules/SplashScreen'
import { JoinerTab } from './modules/JoinerTab'
import { HighlightTab } from './modules/HighlightTab'
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
import { AuthScreen } from './modules/AuthScreen'
import { AdminTab } from './modules/AdminTab'
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
import { tauriApi } from './utils/tauriAdapter'
import { accountService, hasPermission } from './utils/accountService'
import type { HubPermission, HubSession } from './types/auth'

const virtualLogoDataUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>'
const themePreferenceVersion = 'light-liquid-glass-v3'

const getInitialThemeSetting = (): 'dark' | 'light' | 'system' => {
  const saved = localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system' | null
  const migrated = localStorage.getItem('hub_theme_preference_version') === themePreferenceVersion
  return migrated && saved ? saved : 'light'
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [session, setSession] = useState<HubSession | null>(() => accountService.getSession())
  const [platform, setPlatform] = useState('win32')
  const [language, setLanguage] = useState<'vi' | 'en'>(() => (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi')
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(getInitialThemeSetting)
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(() => (localStorage.getItem('hub_font_size') as any) || 'medium')
  const [isDark, setIsDark] = useState(() => {
    const saved = getInitialThemeSetting()
    return saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })
  const [youtubeClientId, setYoutubeClientId] = useState(localStorage.getItem('yt_client_id') || '')
  const [youtubeClientSecret, setYoutubeClientSecret] = useState(localStorage.getItem('yt_client_secret') || '')
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('hub_groq_key') || '')
  const [elevenKey, setElevenKey] = useState(() => localStorage.getItem('hub_eleven_key') || '')
  const [isFirstRun, setIsFirstRun] = useState(() => localStorage.getItem('hub_first_run') !== 'false')
  const [customModal, setCustomModal] = useState<any>(null)
  const [updateProgress, setUpdateProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)
  const [bootState, setBootState] = useState<'booting' | 'fading' | 'done'>('booting')
  const [bootProgress, setBootProgress] = useState(0)

  const t = (key: string, replaceData?: any) => {
    let value = (translations as any)[language]?.[key] || key
    if (replaceData) Object.keys(replaceData).forEach(k => { value = value.replace(`{${k}}`, replaceData[k]) })
    return value
  }

  const joiner = useJoiner(t, setCustomModal, session)
  const dl = useDownloader(t, setCustomModal, session)
  const conv = useConverter(t, setCustomModal, groqKey)
  const tts = useTts(t, setCustomModal, elevenKey, activeTab)
  const ren = useRenamer(t, setCustomModal)
  const ins = useInstaller(t, setCustomModal)
  const un = useUninstaller(t, setCustomModal, activeTab)
  const clean = useCleaner(t, setCustomModal, activeTab)
  const chat = useChatbot(t, setCustomModal, groqKey)
  const pub = usePublisher(setCustomModal)

  useEffect(() => {
    tauriApi.invoke('get-platform').then((result: any) => result && setPlatform(result)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!session || activeTab === 'home') return
    void accountService.track(session, { feature: activeTab, action: 'open' })
  }, [activeTab, session?.token])

  useEffect(() => {
    localStorage.setItem('hub_lang', language)
    localStorage.setItem('hub_groq_key', groqKey)
    localStorage.setItem('hub_eleven_key', elevenKey)
    localStorage.setItem('yt_client_id', youtubeClientId)
    localStorage.setItem('yt_client_secret', youtubeClientSecret)
  }, [language, groqKey, elevenKey, youtubeClientId, youtubeClientSecret])

  useEffect(() => {
    localStorage.setItem('hub_font_size', fontSize)
    const sizeMap = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' }
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px'
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('hub_theme', themeSetting)
    localStorage.setItem('hub_theme_preference_version', themePreferenceVersion)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      const dark = themeSetting === 'dark' || (themeSetting === 'system' && mediaQuery.matches)
      setIsDark(dark)
      document.documentElement.classList.toggle('dark', dark)
    }
    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [themeSetting])

  useEffect(() => {
    const app = document.querySelector<HTMLElement>('.creator-app')
    if (!app) return

    const handlePointerMove = (event: PointerEvent) => {
      const source = event.target instanceof Element ? event.target : null
      const target = source?.closest<HTMLElement>('[data-glass-hover]')
      if (!target || !app.contains(target)) return

      const rect = target.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
      target.style.setProperty('--glass-pointer-x', `${x}%`)
      target.style.setProperty('--glass-pointer-y', `${y}%`)
    }

    app.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => app.removeEventListener('pointermove', handlePointerMove)
  }, [activeTab])

  useEffect(() => {
    const progressTimer = setTimeout(() => setBootProgress(100), 100)
    const fadeTimer = setTimeout(() => setBootState('fading'), 1100)
    const doneTimer = setTimeout(() => setBootState('done'), 1600)
    return () => { clearTimeout(progressTimer); clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | undefined
    void tauriApi.on('update-progress', payload => {
      setUpdateProgress({
        show: true,
        msg: payload?.message || t('updateConnecting'),
        percent: Number(payload?.percent || 0)
      })
    }).then(cleanup => { unlisten = cleanup })

    return () => { unlisten?.() }
  }, [language])

  const handleTabChange = (tabId: string) => {
    const tab = [...SIDEBAR_TABS, { id: 'admin', nameKey: 'adminConsole', descKey: 'adminConsoleDesc', icon: '🛡️', isWip: false }].find(item => item.id === tabId)
    if (tab?.isWip) return
    const requiredPermission: Partial<Record<string, HubPermission>> = { downloader: 'download', joiner: 'joiner', highlight: 'joiner' }
    if (tabId === 'admin' && session?.role !== 'admin') return
    if (requiredPermission[tabId] && !hasPermission(session, requiredPermission[tabId]!)) {
      setCustomModal({ show: true, title: 'ACCESS DENIED', message: 'Access code hiện tại chưa được cấp quyền cho chức năng này.' })
      return
    }
    setActiveTab(tabId)
  }

  const handleCheckUpdate = async (isManual = false) => {
    try {
      const result: any = await tauriApi.invoke('check_for_updates')
      if (result?.hasUpdate) {
        setCustomModal({
          show: true,
          title: `UPDATE AVAILABLE (v${result.latestVersion})`,
          message: `${result.releaseNotes || ''}\n\nConfirm to download the update.`,
          onConfirm: async () => {
            setUpdateProgress({ show: true, msg: t('updateConnecting'), percent: 0 })
            try {
              await tauriApi.invoke('trigger_auto_update', { downloadUrl: result.downloadUrl, fileName: result.fileName, language })
            } catch (error: any) {
              setUpdateProgress(null)
              setCustomModal({ show: true, title: t('updateError') || 'UPDATE DOWNLOAD ERROR', message: String(error) })
            }
          }
        })
      } else if (isManual) {
        setCustomModal({ show: true, title: 'UP TO DATE', message: 'Creator Hub is already running the latest version.' })
      }
    } catch (error: any) {
      if (isManual) setCustomModal({ show: true, title: 'UPDATE CHECK FAILED', message: String(error) })
    }
  }

  useEffect(() => {
    if (isFirstRun) return
    const timer = window.setTimeout(() => { void handleCheckUpdate(false) }, 2200)
    return () => window.clearTimeout(timer)
  }, [isFirstRun])

  const colors = isDark ? DARK_THEME : LIGHT_THEME
  const visibleTabs = SIDEBAR_TABS.filter(tab => tab.id !== 'home')
  const navigationTabs = session?.role === 'admin' ? [...visibleTabs, { id: 'admin', nameKey: 'adminConsole', descKey: 'adminConsoleDesc', icon: '🛡️', isWip: false }] : visibleTabs
  const requiredPermission: Partial<Record<string, HubPermission>> = { downloader: 'download', joiner: 'joiner', highlight: 'joiner' }
  const canAccessTab = (tabId: string) => !requiredPermission[tabId] || hasPermission(session, requiredPermission[tabId]!)

  const renderTab = () => {
    if (activeTab === 'joiner') return <JoinerTab joiner={joiner} isDark={isDark} canUseShortVersion={hasPermission(session, 'short_export')} />
    if (activeTab === 'highlight') return <HighlightTab joiner={joiner} isDark={isDark} />
    if (activeTab === 'downloader') return <DownloaderTab dl={dl} t={t} colors={colors} />
    if (activeTab === 'converter') return <ConverterTab conv={conv} t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'tts') return <TtsTab tts={tts} t={t} colors={colors} />
    if (activeTab === 'renamer') return <RenamerTab ren={ren} t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'installer') return <InstallerTab ins={ins} t={t} colors={colors} isDark={isDark} platform={platform} />
    if (activeTab === 'uninstaller') return <UninstallerTab un={un} t={t} colors={colors} isDark={isDark} platform={platform} />
    if (activeTab === 'cleaner') return <CleanerTab clean={clean} t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'chatbot') return <ChatbotTab chat={chat} t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'publisher') return <PublisherTab publisher={pub} t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'admin' && session?.role === 'admin') return <AdminTab session={session} isDark={isDark} />
    if (activeTab === 'guide') return <GuideTab t={t} colors={colors} isDark={isDark} />
    if (activeTab === 'settings') return <SettingsTab cfg={{ language, setLanguage, themeSetting, setThemeSetting, fontSize, setFontSize, groqKey, setGroqKey, elevenKey, setElevenKey, youtubeClientId, setYoutubeClientId, youtubeClientSecret, setYoutubeClientSecret }} t={t} colors={colors} isDark={isDark} onCheckUpdate={() => handleCheckUpdate(true)} />
    return null
  }

  if (!session) return <AuthScreen isDark={isDark} onThemeToggle={() => setThemeSetting(value => value === 'dark' ? 'light' : 'dark')} onAuthenticated={setSession} />

  return (
    <div className={`creator-app flex h-screen min-h-0 flex-col overflow-hidden transition-colors duration-500 ${colors.c_bgMain}`}>
      <SplashScreen bootState={bootState} bootProgress={bootProgress} isDark={isDark} t={t} logo={virtualLogoDataUri} />

      <header className={`glass-header app-titlebar relative z-50 flex h-14 shrink-0 items-center justify-between border-b pl-0 pr-3 select-none sm:pr-5 ${isDark ? 'text-white' : 'text-zinc-900'}`} style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex h-full min-w-0 items-center gap-3 sm:gap-4">
          <div className="window-controls" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button aria-label="Close" onClick={() => tauriApi.invoke('close_window').catch(() => {})} className="glass-control glass-hover flex h-full w-10 items-center justify-center text-zinc-400 hover:bg-red-500 hover:text-white sm:w-12" title="Close"><span className="text-lg">×</span></button>
            <button aria-label="Maximize" onClick={() => tauriApi.invoke('maximize_window').catch(() => {})} className="glass-control glass-hover hidden h-full w-10 items-center justify-center text-zinc-400 hover:text-white sm:flex" title="Maximize"><span className="text-xs">□</span></button>
            <button aria-label="Minimize" onClick={() => tauriApi.invoke('minimize_window').catch(() => {})} className="glass-control glass-hover flex h-full w-10 items-center justify-center text-zinc-400 hover:text-white sm:w-12" title="Minimize"><span className="text-lg leading-none">−</span></button>
          </div>
          <div className="titlebar-divider" />
          <button onClick={() => handleTabChange('home')} className="app-brand min-w-0 text-left" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-sm font-black text-white shadow-md">▶</span>
            <span className="truncate text-sm font-black tracking-wider uppercase">CREATOR HUB</span>
            <span className="app-version hidden sm:inline">v2.0 Beta</span>
          </button>
        </div>

        <div className="titlebar-actions" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span className={`hidden max-w-[180px] truncate text-[10px] font-bold uppercase tracking-widest md:inline ${colors.c_textSub}`}>{session.displayName} · {session.role === 'admin' ? 'ADMIN' : 'USER'}</span>
          <button onClick={() => { accountService.clearSession(); setSession(null); setActiveTab('home') }} className="glass-button glass-hover rounded-xl border px-3 py-2 text-xs font-bold">Thoát</button>
          <button onClick={() => handleTabChange('settings')} className="glass-button glass-hover flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold sm:px-4 sm:text-sm"><span>⚙</span><span className="hidden sm:inline">{t('settings')}</span></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden bg-transparent p-3 sm:gap-4 sm:p-4">
        <aside className={`glass-panel hidden w-[250px] shrink-0 flex-col rounded-2xl border p-3 md:flex xl:w-[270px] ${colors.c_borderT}`}>
          <button onClick={() => handleTabChange('home')} data-glass-hover data-glass-active={activeTab === 'home'} className={`glass-nav-item glass-hover mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${activeTab === 'home' ? 'text-white' : isDark ? 'text-zinc-300' : 'text-zinc-600'}`}><span className="text-lg">⌂</span><span>{t('dashboard')}</span></button>
          <nav className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto">
            {navigationTabs.map(tab => {
              const isActive = activeTab === tab.id
              const isPermissionLocked = !canAccessTab(tab.id)
              const isLocked = Boolean(tab.isWip) || isPermissionLocked
              return <button key={tab.id} disabled={isLocked} onClick={() => handleTabChange(tab.id)} data-glass-hover data-glass-active={isActive} className={`glass-nav-item glass-hover flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${isLocked ? 'cursor-not-allowed opacity-45' : isActive ? 'text-white' : isDark ? 'text-zinc-300' : 'text-zinc-600'}`}><span className="w-6 shrink-0 text-center text-lg">{tab.icon}</span><span className="min-w-0 flex-1 truncate">{t(tab.nameKey)}</span>{isLocked && <span className="text-[8px] font-black uppercase text-amber-500">{isPermissionLocked ? 'LOCK' : 'DEV'}</span>}</button>
            })}
          </nav>
        </aside>

        <main className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <select aria-label="Choose workspace tool" value={activeTab} onChange={event => handleTabChange(event.target.value)} data-glass-hover className={`glass-input glass-hover min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold outline-none ${colors.c_borderT}`}>
              <option value="home">{t('dashboard')}</option>
              {navigationTabs.map(tab => <option key={tab.id} value={tab.id} disabled={Boolean(tab.isWip) || !canAccessTab(tab.id)}>{t(tab.nameKey)}{tab.isWip ? ' - DEV' : !canAccessTab(tab.id) ? ' - LOCK' : ''}</option>)}
            </select>
          </div>

          {activeTab === 'home' ? (
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">
              <section className="mb-5 px-1 pt-2 sm:mb-6 sm:px-2 sm:pt-4">
                <p className={`mb-2 text-[10px] font-black uppercase tracking-[0.22em] ${colors.c_textSub}`}>Creator workspace</p>
                <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-red-500 sm:text-4xl">{t('welcome')}</h1>
                <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${colors.c_textSub}`}>Choose a tool to start working with your media files.</p>
              </section>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3 sm:gap-4">
                {navigationTabs.map((tab: any, index: number) => {
                  const isPermissionLocked = !canAccessTab(tab.id)
                  const isLocked = Boolean(tab.isWip) || isPermissionLocked
                  return <button key={tab.id} disabled={isLocked} onClick={() => handleTabChange(tab.id)} data-glass-hover className={`glass-card glass-hover group relative flex min-h-[155px] flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left opacity-0 animate-fade-in-up duration-300 ${isLocked ? 'cursor-not-allowed opacity-45' : `cursor-pointer ${isDark ? 'text-white' : 'text-zinc-800'}`}`} style={{ animationDelay: `${index * 35}ms` }}>
                    <div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${isDark ? 'bg-zinc-800/70' : 'bg-zinc-100'}`}>{tab.icon}</span>{isLocked && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-500">{isPermissionLocked ? 'LOCK' : 'DEV'}</span>}</div>
                    <div><h2 className="text-base font-black text-red-500">{t(tab.nameKey)}</h2><p className={`mt-1 text-xs leading-relaxed ${colors.c_textSub}`}>{t(tab.descKey)}</p></div>
                  </button>
                })}
              </div>
            </div>
          ) : (
            <section key={activeTab} className={`glass-panel min-h-0 flex-1 overflow-hidden rounded-2xl border shadow-lg ${colors.c_borderT} animate-fade-in-up`}>
              {renderTab()}
            </section>
          )}
        </main>
      </div>

      {customModal?.show && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className={`relative flex max-h-[90vh] w-full max-w-[480px] flex-col gap-4 overflow-hidden rounded-2xl border p-6 shadow-2xl ${colors.c_bgPanel} ${colors.c_borderT}`}><button aria-label="Close dialog" onClick={() => setCustomModal(null)} className={`absolute right-4 top-4 text-lg font-bold ${colors.c_textSub} hover:text-red-500`}>×</button><h2 className="border-b border-zinc-500/10 pb-3 pr-8 text-base font-black uppercase tracking-wide text-red-500">{customModal.title}</h2><p className={`max-h-[300px] overflow-y-auto whitespace-pre-line text-sm font-semibold leading-relaxed ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>{customModal.message}</p><button onClick={async () => { const action = customModal.onConfirm; setCustomModal(null); if (action) await action() }} className="w-full rounded-xl bg-red-600 py-3 text-xs font-extrabold tracking-widest text-white transition-colors hover:bg-red-500">{t('modalConfirm') || 'CONFIRM'}</button></div></div>}

      {updateProgress?.show && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"><div className={`w-full max-w-[500px] rounded-2xl border p-6 text-center shadow-2xl sm:p-8 ${isDark ? 'border-[#262626] bg-[#171717]' : 'border-zinc-200 bg-white'}`}><span className="mb-3 block text-4xl animate-spin">◌</span><h2 className="text-lg font-black uppercase tracking-wide text-red-500">{t('updateProgressTitle') || 'Updating system'}</h2><p className={`mt-3 text-xs font-semibold leading-relaxed ${colors.c_textSub}`}>{t('updateProgressDesc') || 'Downloading the latest installer.'}</p><div className="mt-5"><div className="mb-2 flex justify-between gap-3 text-xs font-bold"><span className="truncate text-red-500">{updateProgress.msg}</span><span className="shrink-0 text-red-500">{updateProgress.percent}%</span></div><div className={`h-2 overflow-hidden rounded-full border ${colors.c_bgInput}`}><div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all" style={{ width: `${updateProgress.percent}%` }} /></div></div></div></div>}

      {isFirstRun && <WelcomeModal language={language} setLanguage={setLanguage} themeSetting={themeSetting} setThemeSetting={setThemeSetting} isDark={isDark} onComplete={() => { localStorage.setItem('hub_first_run', 'false'); setIsFirstRun(false) }} />}
    </div>
  )
}
