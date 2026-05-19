import { useState, useEffect } from 'react'

declare global { interface Window { electron: any; api: any } }

const translations: Record<'vi' | 'en', Record<string, string>> = {
  vi: {
    dashboard: "Dashboard",
    videoJoiner: "Video Joiner",
    videoDownloader: "Video Downloader",
    fileConverter: "File Converter",
    appInstaller: "Bộ cài phần mềm",
    settings: "Cài đặt",
    welcome: "Chào mừng trở lại!",
    createdBy: "Created by TCD",
    start: "BẮT ĐẦU",
    download: "BẮT ĐẦU TẢI VIDEO",
    convert: "BẮT ĐẦU CHUYỂN ĐỔI FILE",
    processing: "HỆ THỐNG ĐANG XỬ LÝ...",
    downloading: "ĐANG TIẾN HÀNH TẢI VIDEO...",
    converting: "HỆ THỐNG ĐANG BIẾN ĐỔI FILE...",
    btnChooseFolder: "Chọn nơi lưu",
    btnChooseLogo: "Chọn Logo",
    btnChooseFile: "Chọn File",
    btnChooseSub: "Chọn Sub",
    btnDelete: "Xoá",
    btnCancel: "🛑 HỦY BỎ",
    btnPause: "⏸ TẠM DỪNG",
    btnResume: "▶ TIẾP TỤC",
    joinTitle: "Kéo thả hoặc Click chọn thư mục video",
    joinReady: "Đã tải {count} video sẵn sàng",
    joinEmpty: "Chưa có file nào",
    joinDuration: "Thời lượng:",
    joinMinutes: "phút",
    joinPillar: "Chứa 1 video dài (Trụ cột)",
    joinOutput: "Nơi lưu kết quả:",
    joinDefault: "Mặc định (Lưu cùng thư mục đầu vào)",
    joinLogo: "Đóng dấu logo:",
    joinPosition: "Vị trí hiển thị Logo:",
    joinRatio: "Tỷ lệ khung hình (Dùng GPU):",
    posTopLeft: "Góc Trái Trên",
    posTopRight: "Góc Phải Trên",
    posBottomLeft: "Góc Trái Dưới",
    posBottomRight: "Góc Phải Dưới",
    ratioOriginal: "Bản gốc",
    dlTitle: "📥 Trình Tải Video Đa Nền Tảng",
    dlSub: "Hỗ trợ tải video 4K chất lượng cao nhất và cắt đoạn theo phút yêu cầu.",
    dlLabelUrl: "Dán link video tại đây:",
    dlLabelRes: "Độ phân giải tải xuống:",
    dlLabelCut: "Cắt khoảng muốn tải (phút:giây):",
    dlLabelSave: "Thư mục lưu video tải về:",
    dlDefaultDir: "Mặc định (Thư mục Downloads)",
    dlBest: "Tốt nhất hiện có (Khuyên dùng)",
    convTitle: "⚡ Trình Chuyển Đổi Định Dạng File",
    convSub: "Hỗ trợ Hình ảnh, Video, Âm thanh chất lượng gốc và chèn cứng phụ đề Sub (.srt, .ass).",
    convLabelFile: "Chọn File gốc cần đổi (Video/Ảnh/Audio):",
    convLabelSub: "Chèn phụ đề Hardsub (Tùy chọn .srt / .ass):",
    convNoSub: "Không chèn sub (Chuyển đổi nhanh)",
    convLabelTarget: "Chuyển sang định dạng mục tiêu:",
    convLabelSave: "Thư mục xuất file kết quả:",
    convDefaultDir: "Mặc định (Lưu cùng thư mục file gốc)",
    insTitle: "🛠️ Trình Tự Động Cài Đặt Ứng Dụng Windows",
    insSub: "Lựa chọn các phần mềm cần thiết, hệ thống sẽ tự động tải phiên bản mới nhất từ trang chủ và cài đặt ngầm hoàn toàn dưới nền.",
    insBtn: "KÍCH HOẠT CÀI ĐẶT TỰ ĐỘNG",
    insProcessing: "ĐANG TIẾN HÀNH CÀI ĐẶT NGẦM CÁC PHẦN MỀM...",
    setMainTitle: "⚙️ Cấu hình Hệ thống",
    setMainSub: "Thay đổi ngôn ngữ và tùy biến chủ đề hiển thị của phần mềm.",
    setLangLabel: "Ngôn ngữ ứng dụng (Language):",
    setThemeLabel: "Chủ đề hiển thị (Theme Interface):",
    themeDark: "🌙 Giao diện Tối (Dark Mode)",
    themeLight: "☀️ Giao diện Sáng (Light Mode)",
    themeSystem: "💻 Tự động theo Hệ thống (Windows/macOS)",
    alertChooseFolder: "Vui lòng chọn thư mục video trước!",
    alertChooseFile: "Vui lòng chọn file đầu vào cần chuyển đổi!",
    alertChooseUrl: "Vui lòng dán đường link video vào ô nhập!",
    alertConfirmCancel: "Hủy bỏ toàn bộ tiến trình gộp?"
  },
  en: {
    dashboard: "Dashboard",
    videoJoiner: "Video Joiner",
    videoDownloader: "Video Downloader",
    fileConverter: "File Converter",
    appInstaller: "App Installer",
    settings: "Settings",
    welcome: "Welcome Back!",
    createdBy: "Created by TCD",
    start: "START",
    download: "START DOWNLOAD",
    convert: "START CONVERT",
    processing: "PROCESSING...",
    downloading: "DOWNLOADING VIDEO...",
    converting: "CONVERTING FILE...",
    btnChooseFolder: "Browse Location",
    btnChooseLogo: "Select Logo",
    btnChooseFile: "Select File",
    btnChooseSub: "Select Sub",
    btnDelete: "Clear",
    btnCancel: "🛑 CANCEL",
    btnPause: "⏸ PAUSE",
    btnResume: "▶ RESUME",
    joinTitle: "Drag & Drop or Click to select video folder",
    joinReady: "{count} videos loaded and ready",
    joinEmpty: "No files loaded",
    joinDuration: "Duration target:",
    joinMinutes: "mins",
    joinPillar: "Contains 1 long video (Pillar)",
    joinOutput: "Output destination:",
    joinDefault: "Default (Save inside source folder)",
    joinLogo: "Watermark Logo:",
    joinPosition: "Logo Position:",
    joinRatio: "Aspect Ratio (GPU Render):",
    posTopLeft: "Top Left Corner",
    posTopRight: "Top Right Corner",
    posBottomLeft: "Bottom Left Corner",
    posBottomRight: "Bottom Right Corner",
    ratioOriginal: "Original",
    dlTitle: "📥 Multi-Platform Video Downloader",
    dlSub: "Supports downloading 4K video streams and custom trimming intervals.",
    dlLabelUrl: "Paste video link here:",
    dlLabelRes: "Download Resolution:",
    dlLabelCut: "Trim Section Interval (min:sec):",
    dlLabelSave: "Download Output Directory:",
    dlDefaultDir: "Default (Downloads Folder)",
    dlBest: "Best Available (Recommended)",
    convTitle: "⚡ Multimedia File Converter",
    convSub: "Convert Images, Videos, Audio with original quality and hardcode subtitle files (.srt, .ass).",
    convLabelFile: "Select Source File (Video/Image/Audio):",
    convLabelSub: "Hardsub Embedding (Optional .srt / .ass):",
    convNoSub: "No subtitle (Fast container copy)",
    convLabelTarget: "Target Format Extension:",
    convLabelSave: "Output Destination Directory:",
    convDefaultDir: "Default (Save inside source file directory)",
    insTitle: "🛠️ Automated Windows App Installer",
    insSub: "Tick the essential apps you want. The pipeline will automatically fetch the latest releases and handle silent background installation.",
    insBtn: "LAUNCH AUTOMATED INSTALLATION",
    insProcessing: "INSTALLING PACKAGES SILENTLY...",
    setMainTitle: "⚙️ System Configurations",
    setMainSub: "Switch application language and customize theme color variations.",
    setLangLabel: "Application Language:",
    setThemeLabel: "Display Style Theme:",
    themeDark: "🌙 Dark Mode Theme",
    themeLight: "☀️ Light Mode Theme",
    themeSystem: "💻 Match System Preferences (Windows/macOS)",
    alertChooseFolder: "Please select a valid video directory first!",
    alertChooseFile: "Please select a source file to convert!",
    alertChooseUrl: "Please paste a valid video URL link!",
    alertConfirmCancel: "Are you sure you want to terminate the merging sequence?"
  }
}

const AVAILABLE_APPS = [
  { id: 'Google.Chrome', name: 'Google Chrome', icon: '🌐' },
  { id: 'Bytedance.CapCut', name: 'CapCut Editor', icon: '🎬' },
  { id: 'OBSProject.OBSStudio', name: 'OBS Studio', icon: '🎥' },
  { id: 'Microsoft.VisualStudioCode', name: 'VS Code', icon: '💻' },
  { id: 'VideoLAN.VLC', name: 'VLC Player', icon: '🎵' },
  { id: 'WinRAR.WinRAR', name: 'WinRAR', icon: '📦' },
  { id: 'Discord.Discord', name: 'Discord', icon: '💬' },
  { id: 'EpicGames.EpicGamesLauncher', name: 'Epic Games', icon: '🎮' }
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [videoList, setVideoList] = useState<string[]>([]) 
  
  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi'
  })
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system') || 'dark'
  })
  const [isDark, setIsDark] = useState<boolean>(true)

  const t = (key: string, replaceData?: { [key: string]: any }) => {
    let str = translations[language][key] || key
    if (replaceData) {
      Object.keys(replaceData).forEach(k => {
        str = str.replace(`{${k}}`, replaceData[k])
      })
    }
    return str
  }

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

  const c_bgMain   = isDark ? 'bg-[#0f0f0f] text-white' : 'bg-[#f4f4f6] text-zinc-900'
  const c_bgPanel  = isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'
  const c_bgTab    = isDark ? 'bg-[#121212] border-[#222]' : 'bg-[#eaeaea] border-zinc-300'
  const c_bgInput  = isDark ? 'bg-[#0a0a0a] border-[#333]' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
  const c_textSub  = isDark ? 'text-gray-400' : 'text-zinc-500'
  const c_borderT  = isDark ? 'border-[#262626]' : 'border-zinc-200'
  const c_btnSec   = isDark ? 'bg-[#262626] border-[#444] hover:bg-[#333]' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 shadow-sm'

  // State Tab Joiner
  const [minTime, setMinTime] = useState<number>(60)
  const [maxTime, setMaxTime] = useState<number>(70)
  const [requirePillar, setRequirePillar] = useState<boolean>(true)
  const [outputFolder, setOutputFolder] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const [logoPosition, setLogoPosition] = useState<string>('top-right')
  const [joinRatio, setJoinRatio] = useState<string>('original')

  // State Tab Downloader
  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [downloadFolder, setDownloadFolder] = useState<string>('')
  const [dlResolution, setDlResolution] = useState<string>('best')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [dlMsg, setDlMsg] = useState<string>('')
  const [dlPercent, setDlPercent] = useState<number>(0)
  const [dlStart, setDlStart] = useState<string>('')
  const [dlEnd, setDlEnd] = useState<string>('')

  // State Tab File Converter
  const [convertFile, setConvertFile] = useState<string>('')
  const [convertSub, setConvertSub] = useState<string>('')
  const [targetExtension, setTargetExtension] = useState<string>('mp4')
  const [convertFolder, setConvertFolder] = useState<string>('')
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [convMsg, setConvMsg] = useState<string>('')
  const [convPercent, setConvertPercent] = useState<number>(0)

  // State Tab App Installer
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [isInstalling, setIsInstalling] = useState<boolean>(false)
  const [installProgress, setInstallProgress] = useState<{
    appIndex: number; totalApps: number; appName: string; stage: string; stagePercent: number; globalPercent: number;
  }>({ appIndex: 0, totalApps: 0, appName: '', stage: '', stagePercent: 0, globalPercent: 0 })

  // --- [BIẾN SIÊU NÂNG CẤP MỚI] ĐIỀU PHỐI TÌM APP ONLINE THỜI GIAN THỰC ---
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; icon: string }[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)

  // State Khung thông báo thương hiệu Modal
  const [customModal, setCustomModal] = useState<{ show: boolean; title: string; message: string } | null>(null)

  // State Trạng thái Joiner
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const scanDirectory = async (folderPath: string) => {
    if (!folderPath) return;
    try {
      const result = await window.electron.ipcRenderer.invoke('scan-folder', folderPath);
      setVideoList(result);
    } catch (error) { console.error(error) }
  };

  const handleStartProcess = async () => {
    if (videoList.length === 0) { alert(t('alertChooseFolder')); return; }
    setIsProcessing(true); setIsPaused(false); setProgressPercent(0); setProgressMsg('Processing...');
    window.electron.ipcRenderer.on('join-progress', (_event, data) => {
      setProgressMsg(data.message); setProgressPercent(data.percent);
      if (data.message.includes('[TAM DUNG]')) setIsPaused(true);
    });
    try {
      const response = await window.electron.ipcRenderer.invoke('start-joining', {
        videoPaths: videoList, minMins: Number(minTime), maxMins: Number(maxTime), requirePillar: requirePillar, outputDir: outputFolder, logoPath: logoPath, logoPosition: logoPosition, ratio: joinRatio
      });
      setCustomModal({ show: true, title: "CREATOR HUB", message: response.message });
    } catch (error: any) { setCustomModal({ show: true, title: "LỖI HỆ THỐNG", message: error.message }); } finally {
      setIsProcessing(false); setIsPaused(false); window.electron.ipcRenderer.removeAllListeners('join-progress');
    }
  };

  const handlePauseToggle = async () => {
    if (isPaused) { await window.electron.ipcRenderer.invoke('resume-joining'); setIsPaused(false); } 
    else { await window.electron.ipcRenderer.invoke('pause-joining'); setIsPaused(true); setProgressMsg('[PAUSED]... '); }
  };

  const handleCancel = async () => {
    if (confirm(t('alertConfirmCancel'))) { await window.electron.ipcRenderer.invoke('cancel-joining'); setIsProcessing(false); setIsPaused(false); }
  };

  const handleDownloadVideo = async () => {
    if (!downloadUrl.trim()) { alert(t('alertChooseUrl')); return; }
    setIsDownloading(true); setDlPercent(0); setDlMsg('Connecting...');
    window.electron.ipcRenderer.on('download-progress', (_event, data) => { setDlMsg(data.message); setDlPercent(data.percent); });
    try {
      const response = await window.electron.ipcRenderer.invoke('download-video', { 
        url: downloadUrl, saveDir: downloadFolder, resolution: dlResolution, startTime: dlStart, endTime: dlEnd
      });
      setCustomModal({ show: true, title: "CREATOR HUB", message: response.message });
      if (response.success) { setDownloadUrl(''); setDlStart(''); setDlEnd(''); } 
    } catch (error: any) { setCustomModal({ show: true, title: "LỖI HỆ THỐNG", message: error.message }); } finally { setIsDownloading(false); window.electron.ipcRenderer.removeAllListeners('download-progress'); }
  };

  const handleConvertFile = async () => {
    if (!convertFile) { alert(t('alertChooseFile')); return; }
    setIsConverting(true); setConvertPercent(0); setConvMsg('Loading file...');
    window.electron.ipcRenderer.on('convert-progress', (_event, data) => { setConvMsg(data.message); setConvertPercent(data.percent); });
    try {
      const response = await window.electron.ipcRenderer.invoke('convert-file', { inputPath: convertFile, outputDir: convertFolder, targetExt: targetExtension, subPath: convertSub });
      setCustomModal({ show: true, title: "CREATOR HUB", message: response.message });
      if (response.success) { setConvertFile(''); setConvertSub(''); }
    } catch (error: any) { setCustomModal({ show: true, title: "LỖI HỆ THỐNG", message: error.message }); } finally { setIsConverting(false); window.electron.ipcRenderer.removeAllListeners('convert-progress'); }
  };

  // --- HÀM TRA CỨU APP TRÊN MICROSOFT REPOSITORY ---
  const handleSearchAppOnline = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await window.electron.ipcRenderer.invoke('search-apps', { query: searchQuery })
      setSearchResults(results)
      if (results.length === 0) {
        setCustomModal({ show: true, title: "KẾT QUẢ TÌM KIẾM", message: "Không tìm thấy phần mềm nào khớp với từ khóa trên thư viện Cloud." })
      }
    } catch (err: any) {
      setCustomModal({ show: true, title: "LỖI KẾT NỐI MẠNG", message: err.message })
    } finally {
      setIsSearching(false)
    }
  }

  const handleLaunchInstallation = async () => {
    if (selectedApps.length === 0) { alert("Vui lòng chọn ít nhất 1 ứng dụng!"); return; }
    setIsInstalling(true);
    setInstallProgress({ appIndex: 1, totalApps: selectedApps.length, appName: '', stage: 'Khởi động', stagePercent: 0, globalPercent: 0 });
    
    window.electron.ipcRenderer.on('install-apps-progress', (_event, data) => {
      if (data.message === 'Hoàn thành!') {
        setInstallProgress(prev => ({ ...prev, globalPercent: 100, stagePercent: 100, stage: 'Hoàn thành' }));
      } else { setInstallProgress(data); }
    });

    try {
      const response = await window.electron.ipcRenderer.invoke('install-selected-apps', { appIds: selectedApps });
      setCustomModal({ show: true, title: "CREATOR HUB - THÔNG BÁO", message: response.message });
      if (response.success) { setSelectedApps([]); setSearchResults([]); setSearchQuery(''); }
    } catch (error: any) { setCustomModal({ show: true, title: "LỖI THIẾT LẬP WINGET", message: error.message }); } finally {
      setIsInstalling(false); window.electron.ipcRenderer.removeAllListeners('install-apps-progress');
    }
  };

  const toggleAppSelection = (appId: string) => {
    if (selectedApps.includes(appId)) {
      setSelectedApps(selectedApps.filter(id => id !== appId));
    } else {
      setSelectedApps([...selectedApps, appId]);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const files = (e.nativeEvent as DragEvent).dataTransfer?.files;
    if (files && files.length > 0) {
      let folderPath = (files[0] as any).path || window.api?.getPath?.(files[0]);
      if (folderPath) scanDirectory(folderPath);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${c_bgMain}`}>
      {/* SIDEBAR */}
      <aside className={`w-64 bg-[#171717] border-r border-[#262626] flex flex-col p-6 shrink-0 transition-colors ${c_bgPanel}`}>
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-red-500 tracking-wider">CREATOR HUB</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">v1.0.0 | {t('createdBy')}</p>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'home' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🏠 <span>{t('dashboard')}</span></button>
          <button onClick={() => setActiveTab('joiner')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'joiner' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🎬 <span>{t('videoJoiner')}</span></button>
          <button onClick={() => setActiveTab('downloader')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'downloader' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>📥 <span>{t('videoDownloader')}</span></button>
          <button onClick={() => setActiveTab('converter')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'converter' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>⚡ <span>{t('fileConverter')}</span></button>
          <button onClick={() => setActiveTab('installer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'installer' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🛠️ <span>{t('appInstaller')}</span></button>
        </nav>
        <div className="mt-auto">
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'settings' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>⚙️ <span>{t('settings')}</span></button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 flex flex-col h-screen overflow-hidden">
        <header className="mb-8 shrink-0"><h2 className="text-3xl font-bold">{t('welcome')}</h2></header>

        {/* HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-4 gap-6 w-full">
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 transition-all flex flex-col gap-2 ${c_bgPanel}`} onClick={() => setActiveTab('joiner')}><span className="text-3xl">🎞️</span><h3 className="text-lg font-bold">{t('videoJoiner')}</h3><p className={`text-xs ${c_textSub}`}>Gộp video chất lượng gốc theo mốc thời gian.</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 transition-all flex flex-col gap-2 ${c_bgPanel}`} onClick={() => setActiveTab('downloader')}><span className="text-3xl">📥</span><h3 className="text-lg font-bold">{t('videoDownloader')}</h3><p className={`text-xs ${c_textSub}`}>Tải clip 4K siêu nét từ Youtube, TikTok, FB.</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 transition-all flex flex-col gap-2 ${c_bgPanel}`} onClick={() => setActiveTab('converter')}><span className="text-3xl">⚡</span><h3 className="text-lg font-bold">{t('fileConverter')}</h3><p className={`text-xs ${c_textSub}`}>Đổi đuôi Media, Hình ảnh, Audio và ép cứng phụ đề.</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 transition-all flex flex-col gap-2 ${c_bgPanel}`} onClick={() => setActiveTab('installer')}><span className="text-3xl">🛠️</span><h3 className="text-lg font-bold">{t('appInstaller')}</h3><p className={`text-xs ${c_textSub}`}>Tự động tải và cài đặt hàng loạt phần mềm ngầm.</p></div>
          </div>
        )}

        {/* TAB 1: VIDEO JOINER */}
        {activeTab === 'joiner' && (
          <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden w-full">
            <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) scanDirectory(path); }} className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl hover:border-red-500/50 cursor-pointer relative overflow-hidden group ${c_bgTab}`}>
              <span className="text-6xl mb-4 group-hover:-translate-y-2 transition-transform duration-300">📥</span>
              <h3 className="text-2xl font-bold mb-2">{t('joinTitle')}</h3>
              <div className={`absolute bottom-4 border px-4 py-2 rounded-full text-sm font-semibold ${videoList.length > 0 ? 'bg-red-500/20 border-red-500/50 text-red-500' : isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 'bg-zinc-200 border-zinc-300 text-zinc-600'}`}>{videoList.length > 0 ? t('joinReady', {count: videoList.length}) : t('joinEmpty')}</div>
            </div>
            {isProcessing && ( <div className={`shrink-0 border rounded-2xl p-5 ${c_bgPanel}`}><div className="flex justify-between items-center mb-2"><span className={`text-sm font-medium ${isPaused ? 'text-yellow-500' : 'animate-pulse'}`}>{progressMsg}</span><span className="text-sm font-bold text-red-500">{progressPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden border ${c_bgInput}`}><div className={`h-full transition-all duration-300 ${isPaused ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${progressPercent}%` }}></div></div></div> )}
            
            <div className={`shrink-0 border rounded-3xl p-6 flex items-center gap-8 w-full ${c_bgPanel}`}>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3"><label className={`${c_textSub} text-sm font-medium`}>{t('joinDuration')}</label><div className="flex items-center gap-2"><input type="number" value={minTime} onChange={(e) => setMinTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${c_bgInput}`} /><span className="text-gray-500">-</span><input type="number" value={maxTime} onChange={(e) => setMaxTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${c_bgInput}`} /><span className={`${c_textSub} text-sm`}>{t('joinMinutes')}</span></div></div>
                  <label className="flex items-center gap-3 cursor-pointer select-none"><input type="checkbox" checked={requirePillar} onChange={(e) => setRequirePillar(e.target.checked)} className="hidden" /><div className={`w-5 h-5 rounded border flex items-center justify-center ${c_bgInput}`}>{requirePillar && <span className="text-red-500 font-bold text-xs">✓</span>}</div><span className="text-sm font-medium">{t('joinPillar')}</span></label>
                </div>
                <div className={`flex flex-col gap-1.5 border-t pt-3 ${c_borderT}`}><label className={`${c_textSub} text-xs font-medium`}>{t('joinOutput')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={outputFolder || t('joinDefault')} className={`flex-1 border rounded-lg px-3 py-1.5 text-sm truncate focus:outline-none ${c_bgInput}`} /><button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setOutputFolder(path); }} className={`text-xs font-bold px-4 py-1.5 rounded-lg shrink-0 border transition-colors ${c_btnSec}`}>{t('btnChooseFolder')}</button></div></div>
                <div className={`grid grid-cols-4 gap-6 border-t pt-3.5 w-full ${c_borderT}`}>
                  <div className="flex flex-col gap-1.5 min-w-0 col-span-2">
                    <label className={`${c_textSub} text-xs font-medium`}>{t('joinLogo')}</label>
                    <div className="flex items-center gap-2 w-full">
                      <input type="text" readOnly value={logoPath || "No Logo Mode"} className={`flex-1 border rounded-lg px-3 py-1.5 text-xs truncate focus:outline-none min-w-0 ${c_bgInput}`} />
                      <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-logo-dialog'); if (path) setLogoPath(path); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 border transition-colors ${c_btnSec}`}>{t('btnChooseLogo')}</button>
                      {logoPath && <button onClick={() => setLogoPath('')} className="text-xs text-red-500 font-medium px-1 shrink-0 hover:text-red-400 transition-colors">{t('btnDelete')}</button>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className={`${c_textSub} text-xs font-medium`}>{t('joinPosition')}</label>
                    <select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none cursor-pointer h-[32px] ${c_bgInput}`}>
                      <option value="top-left">{t('posTopLeft')}</option><option value="top-right">{t('posTopRight')}</option><option value="bottom-left">{t('posBottomLeft')}</option><option value="bottom-right">{t('posBottomRight')}</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className={`${c_textSub} text-xs font-medium`}>{t('joinRatio')}</label>
                    <select value={joinRatio} onChange={(e) => setJoinRatio(e.target.value)} className={`w-full border text-sm text-red-500 font-semibold rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none cursor-pointer h-[32px] ${c_bgInput}`}>
                      <option value="original">{t('ratioOriginal')}</option><option value="16:9">Ngang (16:9)</option><option value="9:16">Dọc (9:16)</option><option value="1:1">Vuông (1:1)</option>
                    </select>
                  </div>
                </div>
              </div>
              {!isProcessing ? ( <button onClick={handleStartProcess} className="bg-red-600 hover:bg-red-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shrink-0 transition-transform active:scale-95">{t('start')}</button> ) : ( <div className="flex gap-2 h-full shrink-0"><button onClick={handlePauseToggle} className="py-4 px-4 rounded-2xl font-bold text-sm bg-zinc-600 text-white">{isPaused ? t('btnResume') : t('btnPause')}</button><button onClick={handleCancel} className="bg-red-600 text-white font-bold py-4 px-4 rounded-2xl text-sm">{t('btnCancel')}</button></div> )}
            </div>
          </div>
        )}

        {/* TAB 2: MULTI VIDEO DOWNLOADER */}
        {activeTab === 'downloader' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('dlTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('dlSub')}</p></div>
            <div className="flex flex-col gap-2 w-full"><label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelUrl')}</label><input type="text" disabled={isDownloading} value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={`w-full border focus:border-red-500 rounded-xl px-4 py-3.5 focus:outline-none transition-colors ${c_bgInput}`} /></div>
            <div className="grid grid-cols-3 gap-6 w-full">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelRes')}</label>
                <select disabled={isDownloading} value={dlResolution} onChange={(e) => setDlResolution(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none cursor-pointer w-full ${c_bgInput}`}><option value="best">{t('dlBest')}</option><option value="2160">4K 2160p</option><option value="1440">2K 1440p</option><option value="1080">FullHD 1080p</option><option value="720">HD 720p</option></select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelCut')}</label>
                <div className="flex items-center gap-2 w-full"><input type="text" placeholder="0:10" disabled={isDownloading} value={dlStart} onChange={(e) => setDlStart(e.target.value)} className={`w-full border focus:border-red-500 rounded-xl px-3 py-3 text-sm text-center focus:outline-none ${c_bgInput}`} /><span className="text-gray-600">-</span><input type="text" placeholder="2:30" disabled={isDownloading} value={dlEnd} onChange={(e) => setDlEnd(e.target.value)} className={`w-full border focus:border-red-500 rounded-xl px-3 py-3 text-sm text-center focus:outline-none ${c_bgInput}`} /></div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelSave')}</label>
                <div className="flex items-center gap-2 w-full"><input type="text" readOnly value={downloadFolder || t('dlDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-sm truncate focus:outline-none ${c_bgInput}`} /><button disabled={isDownloading} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setDownloadFolder(path); }} className={`border text-sm font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${c_btnSec}`}>{t('btnChooseFolder')}</button></div>
              </div>
            </div>
            {isDownloading && ( <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 w-full"><div className="flex justify-between items-center mb-2"><span className="text-xs font-medium animate-pulse">{dlMsg}</span><span className="text-xs font-bold text-red-500">{dlPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-red-500 h-full" style={{ width: `${dlPercent}%` }}></div></div></div> )}
            <button onClick={handleDownloadVideo} disabled={isDownloading} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isDownloading ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{isDownloading ? t('downloading') : t('download')}</button>
          </div>
        )}

        {/* TAB 3: FILE CONVERTER */}
        {activeTab === 'converter' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('convTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('convSub')}</p></div>
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelFile')}</label>
                <div className="flex items-center gap-2"><input type="text" readOnly value={convertFile || "Select File Source..."} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-file-dialog', null); if (path) setConvertFile(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl shrink-0 border ${c_btnSec}`}>{t('btnChooseFile')}</button></div>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelSub')}</label>
                <div className="flex items-center gap-2"><input type="text" readOnly value={convertSub || t('convNoSub')} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-file-dialog', { name: 'Subtitles', extensions: ['srt', 'ass'] }); if (path) setConvertSub(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl shrink-0 border ${c_btnSec}`}>{t('btnChooseSub')}</button>{convertSub && <button onClick={() => setConvertSub('')} className="text-xs text-red-500 font-bold px-2 hover:text-red-400">{t('btnDelete')}</button>}</div>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-6 w-full border-t pt-4 ${c_borderT}`}>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelTarget')}</label>
                <select value={targetExtension} onChange={(e) => setTargetExtension(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none cursor-pointer w-full ${c_bgInput}`}><optgroup label="Video Container"><option value="mp4">Video MP4</option><option value="mkv">Video MKV</option><option value="mov">Video MOV</option></optgroup><optgroup label="Image Extension"><option value="png">Ảnh PNG</option><option value="jpg">Ảnh JPG / JPEG</option><option value="webp">Ảnh WebP</option></optgroup><optgroup label="Audio Extension"><option value="mp3">Âm thanh MP3</option><option value="m4a">Âm thanh M4A</option><option value="wav">Âm thanh WAV</option></optgroup></select>
              </div>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelSave')}</label>
                <div className="flex items-center gap-2"><input type="text" readOnly value={convertFolder || t('convDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setConvertFolder(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${c_btnSec}`}>{t('btnChooseFolder')}</button></div>
              </div>
            </div>
            {isConverting && ( <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 w-full"><div className="flex justify-between items-center mb-2"><span className="text-xs font-medium animate-pulse">{convMsg}</span><span className="text-xs font-bold text-red-500">{convPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-gradient-to-r from-red-600 to-red-500 h-full" style={{ width: `${convPercent}%` }}></div></div></div> )}
            <button onClick={handleConvertFile} disabled={isConverting} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isConverting ? 'bg-zinc-600 text-zinc-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{isConverting ? t('converting') : t('convert')}</button>
          </div>
        )}

        {/* TAB 4: APP INSTALLER - TÍCH HỢP TÌM KIẾM ONLINE KHÔNG GIỚI HẠN */}
        {activeTab === 'installer' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('insTitle')}</h3>
              <p className={`text-sm ${c_textSub}`}>{t('insSub')}</p>
            </div>

            {/* THANH TÌM KIẾM APP ONLINE MỚI CHÈN VÀO ĐẦU TAB */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${c_bgTab}`}>
              <input 
                type="text" 
                value={searchQuery}
                disabled={isInstalling || isSearching}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAppOnline()}
                placeholder="Gõ tên ứng dụng muốn tìm (VD: CrystalDiskInfo, Unikey, Telegram, Chrome...)" 
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-red-500 focus:outline-none transition-colors placeholder-zinc-400 ${c_bgInput}`} 
              />
              <button 
                onClick={handleSearchAppOnline}
                disabled={isInstalling || isSearching}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all cursor-pointer disabled:bg-zinc-600"
              >
                {isSearching ? 'ĐANG TÌM...' : 'TÌM PHẦN MỀM'}
              </button>
            </div>

            {/* KHU VỰC 1: HIỂN THỊ KẾT QUẢ TÌM KIẾM TỪ MICROSOFT CLOUD (NẾU CÓ) */}
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-red-500">🔍 Kết quả tra cứu từ Thư viện Windows Cloud:</span>
                <div className="grid grid-cols-4 gap-4 w-full">
                  {searchResults.map((item) => {
                    const isChecked = selectedApps.includes(item.id)
                    return (
                      <div 
                        key={item.id}
                        onClick={() => !isInstalling && toggleAppSelection(item.id)}
                        className={`border p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all select-none ${isChecked ? 'border-red-500 bg-red-500/5' : isDark ? 'border-[#262626] hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}
                      >
                        <div className={`w-5 h-5 border rounded flex items-center justify-center text-xs ${c_bgInput}`}>
                          {isChecked && <span className="text-red-500 font-bold">✓</span>}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-bold text-zinc-500 truncate">{item.id}</span>
                          <span className="text-sm font-bold truncate text-red-500">{item.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* KHU VỰC 2: CÁC ỨNG DỤNG ĐƯỢC ĐỀ XUẤT CỐ ĐỊNH */}
            <div className="flex flex-col gap-2 border-t pt-4 border-zinc-500/10">
              <span className={`text-sm font-bold ${c_textSub}`}>📦 Phần mềm khuyên dùng phổ biến:</span>
              <div className="grid grid-cols-4 gap-4 w-full">
                {AVAILABLE_APPS.map((item) => {
                  const isChecked = selectedApps.includes(item.id)
                  return (
                    <div 
                      key={item.id}
                      onClick={() => !isInstalling && toggleAppSelection(item.id)}
                      className={`border p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all select-none ${isChecked ? 'border-red-500 bg-red-500/5' : isDark ? 'border-[#262626] hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}
                    >
                      <div className={`w-5 h-5 border rounded flex items-center justify-center text-xs ${c_bgInput}`}>
                        {isChecked && <span className="text-red-500 font-bold">✓</span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xl mb-0.5">{item.icon}</span>
                        <span className="text-sm font-semibold truncate">{item.name}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* THANH ĐỒ THỊ TIẾN ĐỘ HAI TẦNG CHUYÊN NGHIỆP */}
            {isInstalling && (
              <div className={`bg-gradient-to-br ${isDark ? 'from-[#1a1a1a] to-[#121212] border-zinc-800' : 'from-zinc-50 to-zinc-100 border-zinc-200'} border rounded-2xl p-6 w-full mt-auto flex flex-col gap-4 shadow-inner`}>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-red-500 animate-pulse">📦 App [{installProgress.appIndex}/{installProgress.totalApps}]: {installProgress.appName}</span>
                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>Giai đoạn: <span className="text-red-500 font-bold">{installProgress.stage} ({installProgress.stagePercent}%)</span></span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${c_bgInput}`}>
                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${installProgress.stagePercent}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 border-t pt-3 border-zinc-500/10">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={`${c_textSub}`}>Tổng tiến trình cài đặt hệ thống</span>
                    <span className="text-red-500 font-bold">{installProgress.globalPercent}%</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}>
                    <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-200" style={{ width: `${installProgress.globalPercent}%` }}></div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleLaunchInstallation} disabled={isInstalling}
              className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isInstalling ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}
            >
              {isInstalling ? t('insProcessing') : t('insBtn')}
            </button>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div>
              <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('setMainTitle')}</h3>
              <p className={`text-sm ${c_textSub}`}>{t('setMainSub')}</p>
            </div>
            <div className="grid grid-cols-2 gap-8 w-full border-t pt-6 border-zinc-500/10">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold flex items-center gap-2">🌐 {t('setLangLabel')}</label>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button onClick={() => setLanguage('vi')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${language === 'vi' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>🇻🇳 Tiếng Việt</button>
                  <button onClick={() => setLanguage('en')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${language === 'en' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>🇺🇸 English</button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold flex items-center gap-2">🎨 {t('setThemeLabel')}</label>
                <div className="flex flex-col gap-2.5 w-full">
                  <button onClick={() => setThemeSetting('dark')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'dark' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeDark')}</span>{themeSetting === 'dark' && <span className="text-white">✓</span>}</button>
                  <button onClick={() => setThemeSetting('light')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'light' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeLight')}</span>{themeSetting === 'light' && <span className="text-white">✓</span>}</button>
                  <button onClick={() => setThemeSetting('system')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'system' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeSystem')}</span>{themeSetting === 'system' && <span className="text-white">✓</span>}</button>
                </div>
              </div>
            </div>
            <div className={`mt-auto border-t p-4 flex justify-between text-xs font-bold ${c_borderT} ${c_textSub}`}><span>Product License: OpenSource Commercial</span><span>Platform Engine: Node.js Electron v26 & Tailwind v3</span></div>
          </div>
        )}
      </main>

      {/* POPUP WINDOW MODAL CHÍNH CHỦ CREATOR HUB */}
      {customModal?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-all backdrop-blur-xs">
          <div className={`w-[480px] p-7 rounded-3xl border ${c_bgPanel} shadow-2xl relative flex flex-col gap-4`}>
            <button onClick={() => setCustomModal(null)} className={`absolute top-5 right-5 text-lg font-bold select-none cursor-pointer ${c_textSub} hover:text-red-500`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-3 border-zinc-500/10">
              <span className="text-xl">🔔</span>
              <h4 className="text-lg font-bold text-red-500 tracking-wide">{customModal.title}</h4>
            </div>
            <p className={`text-base font-semibold py-2 leading-relaxed ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{customModal.message}</p>
            <button onClick={() => setCustomModal(null)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer">XÁC NHẬN (OK)</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App