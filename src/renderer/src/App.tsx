/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { translations } from './constants/locales'
import { DARK_THEME, LIGHT_THEME } from './constants/theme'
import { SIDEBAR_TABS } from './constants/navigation'

// 🚀 FIREBASE IMPORTS
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth'
import { auth, db } from './utils/firebase'
import { AuthScreen } from './modules/AuthScreen'
import { doc, setDoc, addDoc, collection, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore'

// Import các Tabs chức năng
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
import { AdminTab } from './modules/AdminTab' 

// Import bộ não Hooks điều phối
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

// Biến Logo toàn cục cố định
const virtualLogoDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>`;

export default function App() {
  // ==========================================================
  // 1. TẤT CẢ CÁC KHAI BÁO STATE ĐƯỢC ĐƯA LÊN ĐẦU FILE (FIX TRIỆT ĐỂ LỖI)
  // ==========================================================
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('user') 
  const [userPermissions, setUserPermissions] = useState<any>({}) 

  // State đổi mật khẩu bảo mật
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPwdInput, setNewPwdInput] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // State cấu hình cốt lõi
  const [activeTab, setActiveTab] = useState('home')
  const [platform, setPlatform] = useState('win32')
  const [language, setLanguage] = useState<'vi' | 'en'>(() => (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi')
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(() => (localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system') || 'dark')
  const [youtubeClientId, setYoutubeClientId] = useState(localStorage.getItem('yt_client_id') || '');
  const [youtubeClientSecret, setYoutubeClientSecret] = useState(localStorage.getItem('yt_client_secret') || '');
  
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

  // State màn hình boot
  const [bootState, setBootState] = useState<'booting' | 'fading' | 'done'>('booting')
  const [bootProgress, setBootProgress] = useState(0)

  // State API và Onboarding
  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => localStorage.getItem('hub_first_run') !== 'false')
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('hub_groq_key') || '')
  const [elevenKey, setElevenKey] = useState(() => localStorage.getItem('hub_eleven_key') || '')

  // ==========================================================
  // 2. BỘ DỊCH THUẬT ĐA NGÔN NGỮ CHẠY ĐẰNG SAU STATE
  // ==========================================================
  const t = (key: string, replaceData?: any) => {
    let str = (translations as any)[language]?.[key] || key
    if (replaceData) { Object.keys(replaceData).forEach((k: string) => { str = str.replace(`{${k}}`, replaceData[k]) }) }
    return str
  }

  // ==========================================================
  // 3. GỌI CÁC HOOKS ĐIỀU PHỐI (KHI ĐÃ CÓ ĐẦY ĐỦ BIẾN TRÊN ĐẦU)
  // ==========================================================
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

  // ==========================================================
  // 4. MẠNG LƯỚI AN NINH TRUY CẬP REALTIME PHÂN QUYỀN TRÊN CLOUD
  // ==========================================================
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            if (userData.status === 'pending') {
              alert(language === 'vi' ? '⚠️ Tài khoản của bạn đang chờ Admin phê duyệt kích hoạt!' : '⚠️ Your account is pending admin approval!');
              localStorage.clear();
              sessionStorage.clear();
              await signOut(auth);
              setAuthLoading(false);
              return;
            }

            if (userData.status === 'banned') {
              alert('🔴 Quyền truy cập phần mềm của bạn đã bị Admin vô hiệu hóa vĩnh viễn!');
              if (unsubscribeSnapshot) unsubscribeSnapshot();
              localStorage.clear();
              sessionStorage.clear();
              await signOut(auth);
              setAuthLoading(false);
              return;
            }
            
            setUserRole(userData.role || 'user');
            setUserPermissions(userData.permissions || {});
          } else {
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid, email: user.email || '', role: "user", status: "active",
              permissions: {}, 
              createdAt: serverTimestamp(), lastActive: serverTimestamp()
            });
            setUserRole('user');
            setUserPermissions({});
          }

          setCurrentUser(user);
          setAuthLoading(false); 

          unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), async (snapshot) => {
            if (snapshot.exists()) {
              const userData = snapshot.data();
              if (userData.status === 'banned' || userData.status === 'pending') {
                if (unsubscribeSnapshot) unsubscribeSnapshot();
                localStorage.clear();
                sessionStorage.clear();
                setCurrentUser(null);
                signOut(auth).catch(() => {});
                return;
              }
              setUserRole(userData.role || 'user');
              setUserPermissions(userData.permissions || {});
            } else {
              if (unsubscribeSnapshot) unsubscribeSnapshot();
              localStorage.clear();
              sessionStorage.clear();
              setCurrentUser(null);
              setUserRole('user');
              setUserPermissions({});
              signOut(auth).catch(() => {});
            }
          }, (err) => {
            console.log("Hủy bỏ phiên kẹt mạng.");
          });

        } catch (e) {
          setCurrentUser(user);
          setAuthLoading(false);
        }

      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setCurrentUser(null);
        setUserRole('user');
        setUserPermissions({});
        setAuthLoading(false); 
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // ==========================================================
  // 5. CÁC HIỆU ỨNG ĐỒNG BỘ HOÁ DỮ LIỆU CỤC BỘ
  // ==========================================================
  useEffect(() => { tauriApi.invoke('get-platform').then((res: any) => setPlatform(res)) }, [])
  useEffect(() => { localStorage.setItem('hub_lang', language) }, [language])
  
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
      if (darkActive) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    handleThemeCalculation()
    mediaQuery.addEventListener('change', handleThemeCalculation)
    return () => mediaQuery.removeEventListener('change', handleThemeCalculation)
  }, [themeSetting])

  useEffect(() => {
    const progressTimer = setTimeout(() => setBootProgress(100), 100)
    const fadeTimer = setTimeout(() => setBootState('fading'), 2200)
    const doneTimer = setTimeout(() => setBootState('done'), 2700)
    return () => { clearTimeout(progressTimer); clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [])

  // ==========================================================
  // 6. CÁC HÀM XỬ LÝ SỰ KIỆN TRONG APP (HANDLERS)
  // ==========================================================
  const handleTabChange = (tabId: string) => {
    if (tabId === 'home' || tabId === 'settings' || tabId === 'guide' || userRole === 'admin') {
      setActiveTab(tabId);
      return;
    }
    if (userPermissions[tabId] === false) {
      alert(`🛑 Bạn không được Admin cấp quyền sử dụng tính năng này!`);
      return;
    }
    setActiveTab(tabId);
  };

  const handleOnboardingComplete = () => { localStorage.setItem('hub_first_run', 'false'); setIsFirstRun(false) }

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwdInput.length < 6) {
      alert(language === 'vi' ? "Mật khẩu mới phải từ 6 ký tự trở lên!" : "New password must be at least 6 characters!");
      return;
    }
    setPwdLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPwdInput);
        alert(language === 'vi' ? "🎉 Đã cập nhật mật khẩu thành công!" : "🎉 Password updated successfully!");
        setNewPwdInput('');
        setShowPwdModal(false);
      }
    } catch (err: any) {
      alert("❌ Lỗi: " + err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  const handleCheckUpdate = async (isManual = false) => {
    try {
      if (isManual) { setCustomModal({ show: true, title: "🔍 ĐANG KIỂM TRA", message: "Hệ thống đang kết nối máy chủ dữ liệu..." }) }
      const result: any = await tauriApi.invoke('check_for_updates');
      if (result && result.hasUpdate) {
        setCustomModal({
          show: true, title: `🚀 PHÁT HIỆN BẢN CẬP NHẬT MỚI (v${result.latestVersion})`,
          message: `Nội dung cập nhật:\n${result.releaseNotes}\n\nVui lòng bấm OK để tải về tự động.`,
          onConfirm: async () => {
            setUpdateProgress({ show: true, msg: t('updateConnecting'), percent: 0 });
            await tauriApi.invoke('trigger_auto_update', { downloadUrl: result.downloadUrl, fileName: result.fileName, language: language })
          }
        })
      } else {
        if (isManual) setCustomModal({ show: true, title: "✅ ĐÃ CẬP NHẬT", message: "Hệ thống của bạn đang chạy phiên bản mới nhất!" })
      }
    } catch (err) {}
  }

  // ==========================================================
  // 7. KHU VỰC ĐIỀU KIỆN RENDER GIAO DIỆN CHÍNH
  // ==========================================================
  const colors = isDark ? DARK_THEME : LIGHT_THEME

  if (authLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-zinc-100'}`}>
        <span className="text-4xl animate-spin mb-4 text-red-500">⚙️</span>
        <div className="text-red-500 font-black animate-pulse tracking-widest text-sm">ĐANG XÁC THỰC QUYỀN TRUY CẬP PC...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <SplashScreen bootState={bootState} bootProgress={bootProgress} isDark={isDark} t={t} logo={virtualLogoDataUri} />
        <AuthScreen isDark={isDark} />
      </>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-200 ${colors.c_bgMain} ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
      
      <SplashScreen bootState={bootState} bootProgress={bootProgress} isDark={isDark} t={t} logo={virtualLogoDataUri} />

      {/* TOP HEADER TOOLBAR */}
      <header className={`relative z-[9999999] h-14 flex items-center justify-between pl-0 pr-5 border-b select-none shrink-0 transition-all ${isDark ? 'bg-[#18181b]/95 border-zinc-800 text-white' : 'bg-white/95 border-zinc-200 text-zinc-900'} backdrop-blur-md`} style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center h-full gap-4">
          <div className="flex items-center h-full shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button onClick={() => tauriApi.invoke('close_window')} className="w-12 h-full flex items-center justify-center transition-colors hover:bg-red-500 hover:text-white text-zinc-400 dark:text-zinc-400" title="Đóng">
              <svg width="11" height="11" viewBox="0 0 12 12"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <button onClick={() => tauriApi.invoke('maximize_window')} className={`w-12 h-full flex items-center justify-center transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900'}`} title="Phóng to">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"><rect x="1.5" y="1.5" width="9" height="9" strokeWidth="1.4" rx="1"/></svg>
            </button>
            <button onClick={() => tauriApi.invoke('minimize_window')} className={`w-12 h-full flex items-center justify-center transition-colors ${isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900'}`} title="Thu nhỏ">
              <svg width="11" height="11" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1.2" fill="currentColor" rx="0.4"/></svg>
            </button>
          </div>
          <div className="h-5 w-px bg-zinc-500/20"></div>
          <div className="flex items-center gap-3 pl-1">
            <div className="w-6 h-6 shrink-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white ml-0.5"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black tracking-wider uppercase opacity-90">CREATOR HUB</span>
              <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 shadow-inner">v1.2.0</span>
            </div>
          </div>
        </div>

        <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-3 relative z-[99999999]">
          <div style={{ WebkitAppRegion: 'no-drag' } as any} className="flex items-center gap-4 border-r border-zinc-500/20 pr-5 mr-1 relative z-[99999999]">
            <span className={`text-sm font-semibold truncate max-w-[250px] ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
              {currentUser.email}
            </span>
            
            <button 
              onClick={() => setShowPwdModal(true)}
              className="text-xs text-blue-500 hover:text-blue-400 font-black tracking-wider uppercase transition-all cursor-pointer border-0 bg-transparent px-1"
            >
              {language === 'vi' ? 'Đổi Mật Khẩu' : 'Password'}
            </button>

            <button 
              style={{ WebkitAppRegion: 'no-drag' } as any}
              onClick={async (e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                if(window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi phần mềm?')) {
                  setCurrentUser(null);
                  setUserRole('user');
                  setUserPermissions({});
                  localStorage.clear();
                  sessionStorage.clear();
                  try {
                    const dbs = await indexedDB.databases();
                    dbs.forEach(db => { if(db.name) indexedDB.deleteDatabase(db.name); });
                  } catch(e){}
                  signOut(auth).catch(() => {});
                  window.location.reload();
                }
              }} 
              className="text-sm text-red-600 hover:text-red-400 font-black tracking-widest uppercase transition-all cursor-pointer border-0 bg-transparent relative z-[99999999] px-1 py-1"
            >
              {language === 'vi' ? 'Đăng xuất' : 'Logout'}
            </button>
          </div>
          <button onClick={() => handleTabChange('settings')} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all shadow-sm ${isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:border-red-500/50 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-700 hover:border-red-400 hover:bg-zinc-50'}`}>
            <span>⚙️</span>
            <span>{t('settings')}</span>
          </button>
        </div>
      </header>
      
      {/* KHU VỰC LAYOUT PANEL CHÍNH */}
      <div className={`flex-1 flex overflow-hidden p-4 gap-4 transition-all ${isDark ? 'bg-[#0f0f12]' : 'bg-zinc-50'}`}>
        {activeTab !== 'home' && (
          <aside className={`w-[260px] xl:w-[285px] flex flex-col p-3 shrink-0 rounded-[20px] border shadow-sm ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <nav className="flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col justify-between">
              <div className="space-y-1">
                {SIDEBAR_TABS.map((tab: any) => {
                  const isActive = activeTab === tab.id
                  const isLocked = tab.isWip;
                  const isFeatureBanned = userRole !== 'admin' && userPermissions[tab.id] === false;

                  return (
                    <button 
                      key={tab.id} 
                      disabled={isLocked} 
                      onClick={() => handleTabChange(tab.id)} 
                      className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl font-bold text-sm transition-all ${
                        isLocked ? `opacity-40 cursor-not-allowed ${isDark ? 'text-zinc-500' : 'text-zinc-400'}` : 
                        isFeatureBanned ? `opacity-30 cursor-not-allowed grayscale-[40%] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}` :
                        isActive ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 scale-[1.02]' : 
                        isDark ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      <span className={`text-lg shrink-0 ${isLocked || isFeatureBanned ? 'grayscale opacity-50' : ''}`}>{isFeatureBanned ? '🔒' : tab.icon}</span> 
                      <span className="truncate text-left font-bold flex-1">{t(tab.nameKey)}</span>
                      {isLocked && <span className="ml-auto text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">WIP</span>}
                    </button>
                  )
                })}
              </div>

              {userRole === 'admin' && (
                <div className="pt-2 border-t border-zinc-500/10 mt-2">
                  <button onClick={() => handleTabChange('admin_panel')} className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'admin_panel' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/20 scale-[1.01]' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                    <span className="text-lg shrink-0">🛡️</span>
                    <span className="truncate text-left flex-1 tracking-wider uppercase font-black">TRẠM ADMIN</span>
                  </button>
                </div>
              )}
            </nav>
          </aside>
        )}

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); scale: 0.98; } to { opacity: 1; transform: translateY(0); scale: 1; } }
            .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          `}</style>

          {activeTab === 'home' && (
             <header className="w-full text-center mb-8 mt-4 shrink-0 px-4 opacity-0 animate-fade-in-up select-none">
               <h2 className="text-3xl md:text-[40px] font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-sm tracking-tight leading-tight">{t('welcome')}</h2>
               <p className={`text-xs md:text-sm mt-2 font-medium tracking-widest uppercase ${colors.c_textSub}`}>HỆ SINH THÁI TỐI ƯU HÓA HIỆU SUẤT</p>
               
               {userRole === 'admin' && (
                 <button onClick={() => handleTabChange('admin_panel')} className="mt-4 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xs tracking-widest uppercase rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer border-0">
                   🛡️ VÀO TRẠM KIỂM SOÁT ADMIN
                 </button>
               )}
             </header>
          )}

          {activeTab === 'home' && (
             <div className="flex-1 w-full overflow-y-auto custom-scrollbar pr-2 pb-2 flex flex-col">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 md:gap-7 w-full p-2">
                {SIDEBAR_TABS.filter((tab: any) => tab.id !== 'home').map((tab: any, index: number) => {
                  const isLocked = tab.isWip;
                  const isFeatureBanned = userRole !== 'admin' && userPermissions[tab.id] === false;

                  return (
                    <div 
                      key={tab.id} 
                      onClick={() => !isLocked && handleTabChange(tab.id)} 
                      className={`group relative p-6 md:p-7 rounded-[32px] md:rounded-[40px] transition-all duration-500 ease-out flex flex-col gap-4 overflow-hidden border opacity-0 animate-fade-in-up ${
                        isLocked ? `opacity-40 cursor-not-allowed ${isDark ? 'border-zinc-800/30 bg-[#16161a]/30' : 'border-zinc-200/50 bg-zinc-50/50'}` : 
                        isFeatureBanned ? `opacity-40 saturate-[30%] cursor-not-allowed ${isDark ? 'border-zinc-800 bg-[#16161a]/50' : 'border-zinc-200 bg-zinc-100/50'}` :
                        `cursor-pointer ${isDark ? 'border-zinc-800/80 bg-[#16161a] text-white hover:bg-[#1f1f24]' : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'} hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.25)] hover:border-red-500/50`
                      }`} 
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {!isLocked && !isFeatureBanned && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>}
                      <div className="flex justify-between items-start relative z-10">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isLocked || isFeatureBanned ? isDark ? 'bg-zinc-800/30 grayscale' : 'bg-zinc-200/50 grayscale' : isDark ? 'bg-zinc-800/60 group-hover:bg-red-500/20' : 'bg-zinc-100 group-hover:bg-red-50'}`}>
                          <span className={`text-2xl md:text-3xl transition-transform duration-300 ease-out drop-shadow-md ${!isLocked && !isFeatureBanned && 'group-hover:scale-110 group-hover:rotate-6'}`}>{isFeatureBanned ? '🔒' : tab.icon}</span>
                        </div>
                        {isLocked && <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">WIP</span>}
                        {isFeatureBanned && <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full shadow-sm backdrop-blur-sm">LOCKED</span>}
                      </div>
                      <div className="relative z-10 mt-2">
                        <h3 className={`text-lg md:text-xl font-black transition-colors duration-300 ${isLocked || isFeatureBanned ? (isDark ? 'text-zinc-600' : 'text-zinc-400') : 'text-red-500 group-hover:text-red-400'}`}>{t(tab.nameKey)}</h3>
                        <p className={`text-xs md:text-sm mt-2 leading-relaxed transition-colors duration-300 ${isLocked || isFeatureBanned ? (isDark ? 'text-zinc-700' : 'text-zinc-500') : (isDark ? 'text-zinc-400 group-hover:text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-700')}`}>{t(tab.descKey)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab !== 'home' && (
            <div key={activeTab} className={`w-full h-full flex-1 flex flex-col overflow-hidden opacity-0 animate-fade-in-up rounded-[1.25rem] border shadow-lg ${colors.c_bgPanel} ${colors.c_borderT}`} style={{ animationDuration: '0.3s' }}>
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
              
              {/* TRUYỀN ĐA NGÔN NGỮ XUỐNG CHO TRẠM ADMIN CHẠY LIVE */}
              {activeTab === 'admin_panel' && userRole === 'admin' && <AdminTab isDark={isDark} language={language} />}
              
              {activeTab === 'settings' && <SettingsTab cfg={{ language, setLanguage, themeSetting, setThemeSetting, fontSize, setFontSize, groqKey, setGroqKey, elevenKey, setElevenKey, youtubeClientId, setYoutubeClientId, youtubeClientSecret, setYoutubeClientSecret }} t={t} colors={colors} isDark={isDark} onCheckUpdate={() => handleCheckUpdate(true)} />}
            </div>
          )}
        </main>
      </div>

      {/* POPUP MODAL ĐỔI MẬT KHẨU */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999999999] backdrop-blur-xs p-4 animate-fade-in">
          <form onSubmit={handleChangePasswordSubmit} className={`w-[400px] p-6 rounded-3xl border shadow-2xl relative flex flex-col gap-4 ${colors.c_bgPanel} ${colors.c_borderT}`}>
            <button type="button" onClick={() => { setShowPwdModal(false); setNewPwdInput(''); }} className={`absolute top-4 right-4 text-sm font-bold ${colors.c_textSub} hover:text-red-500 cursor-pointer border-0 bg-transparent`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-2 border-zinc-500/10 shrink-0">
              <span className="text-xl">🔐</span>
              <h4 className="text-sm font-black text-red-500 tracking-wide uppercase">
                {language === 'vi' ? 'CẬP NHẬT MẬT KHẨU MỚI' : 'UPDATE PASSWORD'}
              </h4>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase px-1">
                {language === 'vi' ? 'MẬT KHẨU TRUY CẬP MỚI' : 'NEW ACCESS PASSWORD'}
              </label>
              <input 
                type="password"
                placeholder={language === 'vi' ? "Nhập mật khẩu mới từ 6 ký tự..." : "Enter new password..."}
                value={newPwdInput}
                onChange={e => setNewPwdInput(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-xs font-bold outline-none focus:border-red-500 ${isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                required
              />
            </div>
            <button 
              type="submit"
              disabled={pwdLoading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-md disabled:opacity-40 cursor-pointer border-0"
            >
              {pwdLoading ? (language === 'vi' ? '⏳ ĐANG ĐỒNG BỘ...' : '⏳ SAVING...') : (language === 'vi' ? 'XÁC NHẬN ĐỔI MẬT KHẨU' : 'CONFIRM CHANGE')}
            </button>
          </form>
        </div>
      )}

      {/* POPUP SYSTEM WINDOW MODAL */}
      {customModal?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] transition-all backdrop-blur-xs p-4">
          <div className={`w-[480px] p-6 rounded-2xl border ${colors.c_bgPanel} ${colors.c_borderT} shadow-2xl relative flex flex-col gap-4 transform scale-100 transition-all duration-200`}>
            <button onClick={() => setCustomModal(null)} className={`absolute top-4 right-4 text-base font-bold select-none cursor-pointer ${colors.c_textSub} hover:text-red-500 transition-colors`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-2.5 border-zinc-500/10 shrink-0">
              <span className="text-xl">🔔</span>
              <h4 className="text-md font-black text-red-500 tracking-wide uppercase">{customModal.title}</h4>
            </div>
            <div className={`text-sm font-semibold py-1 leading-relaxed whitespace-pre-line overflow-y-auto max-h-[300px] pr-2 custom-scrollbar ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>{customModal.message}</div>
            <button onClick={async () => { const action = customModal.onConfirm; setCustomModal(null); if (action) { await action() } }} className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3 rounded-xl text-xs tracking-widest shadow-md transition-transform active:scale-[0.98]">
              {t('modalConfirm') || 'XÁC NHẬN'}
            </button>
          </div>
        </div>
      )}

      {/* POPUP LOCK-SCREEN PROGRESS */}
      {updateProgress?.show && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] backdrop-blur-md transition-all">
          <div className={`w-[500px] p-8 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-5 text-center`}>
            <span className="text-5xl animate-spin mb-2">⚙️</span>
            <h3 className="text-xl font-black text-red-500 tracking-wide uppercase">{t('updateProgressTitle') || 'Đang Nâng Cấp Hệ Thống'}</h3>
            <p className={`text-xs font-semibold leading-relaxed whitespace-pre-line ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
              {t('updateProgressDesc') || 'Creator Hub đang tải tệp tin cài đặt chính thức...\nVui lòng giữ nguyên cửa sổ.'}
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

      {isFirstRun && <WelcomeModal language={language} setLanguage={setLanguage} themeSetting={themeSetting} setThemeSetting={setThemeSetting} isDark={isDark} onComplete={handleOnboardingComplete} />}
    </div>
  )
}