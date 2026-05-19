import { useState, useEffect } from 'react'

declare global { interface Window { electron: any; api: any } }

// ====================================================================
// [BỘ TỪ ĐIỂN QUỐC TẾ 100%]
// ====================================================================
const translations: Record<'vi' | 'en', Record<string, string>> = {
  vi: {
    dashboard: "Dashboard", videoJoiner: "Video Joiner", videoDownloader: "Video Downloader", fileConverter: "File Converter", appTts: "Giọng đọc AI", fileRenamer: "Đổi tên hàng loạt", appInstaller: "Bộ cài phần mềm", uninstaller: "Gỡ ứng dụng sạch", cleaner: "Dọn rác hệ thống", settings: "Cài đặt", welcome: "Chào mừng trở lại!", createdBy: "Created by TCD", 
    start: "BẮT ĐẦU VẬN HÀNH", download: "BẮT ĐẦU TẢI VIDEO", convert: "BẮT ĐẦU CHUYỂN ĐỔI FILE", processing: "HỆ THỐNG ĐANG XỬ LÝ...", downloading: "ĐANG TIẾN HÀNH TẢI VIDEO...", converting: "HỆ THỐNG ĐANG BIẾN ĐỔI FILE...", btnChooseFolder: "Chọn nơi lưu", btnChooseLogo: "Chọn Logo", btnChooseFile: "Chọn File", btnChooseSub: "Chọn Sub", btnDelete: "Xoá", btnCancel: "🛑 HỦY BỎ", btnPause: "⏸ TẠM DỪNG", btnResume: "▶ TIẾP TỤC", modalConfirm: "XÁC NHẬN (OK)",
    
    descJoiner: "Gộp video gốc tự động theo mốc thời gian.", descDownloader: "Tải clip 4K siêu nét từ Youtube, TikTok, FB.", descConverter: "Đổi đuôi Media và ép phụ đề/trích xuất sub AI.", descTts: "Chuyển văn bản thành giọng đọc Adam ElevenLabs.", descRenamer: "Đổi tên tập tin hàng loạt chuẩn Total Commander.", descInstaller: "Tự động cài đặt phần mềm ngầm (Windows & Mac).", descUninstaller: "Thống kê toàn bộ phần mềm hiện có, gỡ và dọn rác ẩn.", descCleaner: "Quét sạch tệp tin đệm Cache phình to của TikTok, Chrome, Temp Files.",
    
    joinTitle: "Kéo thả hoặc Click chọn thư mục video", joinReady: "Đã tải {count} video sẵn sàng", joinEmpty: "Chưa có file nào", joinDuration: "Thời lượng:", joinMinutes: "phút", joinPillar: "Chứa 1 video dài (Trụ cột)", joinOutput: "Nơi lưu kết quả:", joinDefault: "Mặc định (Lưu cùng thư mục đầu vào)", joinLogo: "Đóng dấu logo:", joinPosition: "Vị trí hiển thị Logo:", joinRatio: "Tỷ lệ khung hình:", posTopLeft: "Góc Trái Trên", posTopRight: "Góc Phải Trên", posBottomLeft: "Góc Trái Dưới", posBottomRight: "Góc Phải Dưới", ratioOriginal: "Bản gốc", joinLoadedAZ: "✅ Đã nạp {count} tập tin video (Danh sách A-Z)", btnChangeFolder: "🔄 THAY ĐỔI THƯ MỤC", useGpu: "Dùng GPU Render", logoSize: "Kích cỡ Logo:",
    
    dlTitle: "📥 Trình Tải Video Đa Nền Tảng", dlSub: "Hỗ trợ tải video 4K chất lượng cao nhất và cắt đoạn theo phút yêu cầu.", dlLabelUrl: "Dán link video tại đây:", dlLabelRes: "Độ phân giải tải xuống:", dlLabelCut: "Cắt khoảng muốn tải (phút:giây):", dlLabelSave: "Thư mục lưu video tải về:", dlDefaultDir: "Mặc định (Thư mục Downloads)", dlBest: "Tốt nhất hiện có (Khuyên dùng)", convTitle: "⚡ Trình Chuyển Đổi Định Dạng File", convSub: "Hỗ trợ Hình ảnh, Video, Âm thanh chất lượng gốc và chèn cứng phụ đề Sub (.srt, .ass).", convLabelFile: "Chọn File gốc cần đổi (Video/Ảnh/Audio):", convLabelSub: "Chèn phụ đề Hardsub (Tùy chọn .srt / .ass):", convNoSub: "Không chèn sub (Chuyển đổi nhanh)", convLabelTarget: "Chuyển sang định dạng mục tiêu:", convLabelSave: "Thư mục xuất file kết quả:", convDefaultDir: "Mặc định (Lưu cùng thư mục file gốc)",
    
    ttsTitle: "🗣️ Trình tạo giọng đọc trí tuệ nhân tạo", ttsSub: "Sử dụng lõi xử lý ElevenLabs Multilingual V2 cao cấp để đọc văn bản mượt mà, hỗ trợ chuẩn giọng Adam.", ttsStep1: "1. Lựa chọn giọng đọc từ Cloud:", ttsNoVoice: "(Chưa có giọng đọc, hãy cấu hình Key ElevenLabs ở trang cài đặt)", ttsStep2: "2. Thư mục lưu file âm thanh:", ttsStep3: "3. Nhập đoạn văn bản muốn AI chuyển ngữ sinh giọng nói:", ttsPlaceholder: "Nhập văn bản tại đây (Hỗ trợ tiếng Việt tuyệt đối, ngắt câu bằng dấu chấm, phẩy để AI đọc biểu cảm)...", btnTts: "PHÁT HÀNH GIỌNG ĐỌC AI",
    
    renamerTitle: "🗂️ Trình đổi tên tập tin hàng loạt cao cấp", renamerSub: "Cấu hình linh hoạt quy tắc tìm kiếm, chèn chữ hoặc đánh số thứ tự hàng loạt cực nhanh.", renamerBtnLoaded: "📂 Đã nạp thành công {count} tập tin vào hàng chờ", renamerBtnAdd: "➕ Click vào đây để chọn nhiều file cùng lúc cần đổi tên", renamerMode: "Chế độ tên gốc:", renamerKeep: "Giữ tên gốc (Thay thế từ)", renamerRemove: "Xóa tên gốc (Đặt tên hoàn toàn mới)", renamerFind: "Tìm chuỗi chữ:", renamerReplace: "Thay thế bằng:", renamerPrefix: "Tên mới / Tiền tố:", renamerNotAvailable: "Không khả dụng", renamerPrefixPlaceholder: "VD: Clip_Moi_", renamerAddNumber: "Chèn số thứ tự", renamerCol1: "Tên tập tin hiện tại", renamerCol2: "Tên tập tin mới sau khi đổi (Xem trước)", renamerEmpty: "Danh sách trống. Vui lòng nạp file để xem bảng so sánh Preview.", renamerBtnApply: "ÁP DỤNG ĐỔI TÊN ĐỒNG LOẠT QUY MÔ LỚN",
    
    insTitle: "🛠️ Trình Tự Động Cài Đặt Ứng Dụng", insSub: "Lựa chọn phần mềm cần thiết, hệ thống sẽ tự động tải và cài đặt ngầm hoàn toàn dưới nền.", insCore: "(Lõi: {core})", insSearchMac: "Gõ tên app Mac muốn tìm...", insSearchWin: "Gõ tên ứng dụng muốn tìm...", insSearching: "ĐANG TÌM...", insSearchBtn: "TÌM PHẦN MỀM", insSearchResult: "🔍 Kết quả trực tuyến từ Cloud:", insRecommended: "📦 Phần mềm khuyên dùng phổ biến:", insProgressApp: "📦 Tiến trình [{index}/{total}]: {name}", insProgressGlobal: "Tổng tiến trình cài đặt toàn cục", insBtn: "KÍCH HOẠT CÀI ĐẶT TỰ ĐỘNG", insProcessing: "ĐANG TIẾN HÀNH CÀI ĐẶT NGẦM CÁC PHẦN MỀM...", insAlertZero: "Vui lòng chọn ít nhất 1 ứng dụng!",
    
    uninsTitle: "❌ Trình gỡ bỏ & Dọn dẹp ứng dụng tận gốc", uninsSub: "Thống kê dữ liệu phần mềm, tự động quét và xóa sạch file rác ẩn trong hệ thống.", uninsTotal: "Tổng phát hiện: {count} Phần mềm", uninsSearch: "🔍 Gõ từ khóa để lọc nhanh phần mềm...", uninsScanning: "ĐANG QUÉT...", uninsRescan: "🔄 QUÉT LẠI", uninsCol1: "Tên Ứng Dụng", uninsCol2: "Nhà Phát Triển / Đường Dẫn", uninsCol3: "Phiên Bản", uninsCol4: "Hành Động", uninsWait: "⚙️ HỆ THỐNG ĐANG TRUY VẤN CORE DỮ LIỆU THIẾT BỊ, VUI LÒNG CHỜ...", uninsEmpty: "Không tìm thấy phần mềm nào khớp.", uninsUnknown: "Không xác định", uninsBtnMac: "🗑️ XOÁ SẠCH RÁC", uninsBtnWin: "⚡ GỠ APP", uninsConfirm: "Bạn có chắc gỡ bỏ hoàn toàn ứng dụng: {name}?",
    
    cleanerTitle: "🧹 Trình quét và Dọn rác hệ thống tăng tốc", cleanerSub: "Quét sạch dung lượng đệm phình to của TikTok App, CapCut, Chrome và phân vùng Temp file.", cleanerTotal: "Tổng dung lượng rác chọn: {size}", cleanerScanWait: "🔍 ĐANG TÍNH TOÁN...", cleanerScanBtn: "🔎 QUÉT RÁC TOÀN DIỆN", cleanerCleanBtn: "🗑️ DỌN SẠCH TẬN GỐC", cleanerScanning: "⚙️ HỆ THỐNG ĐANG ĐO ĐẠC CACHE Ổ CỨNG, VUI LÒNG CHỜ TRONG GIÂY LÁT...", cleanerEmpty: "Chưa có dữ liệu quét. Nhấn \"Quét rác toàn diện\" để bắt đầu.", cleanerAlertZero: "Vui lòng chọn ít nhất 1 mục để dọn dẹp!",
    
    introIgnore: "Đã hiểu, bỏ qua và không hiển thị lại thông báo này.", introStart: "BẮT ĐẦU SỬ DỤNG",
    introJoinerTitle: "Video Joiner (Gộp Video Kịch Bản)", introJoinerDesc: "Chức năng này giúp bạn tự động trộn và gộp hàng loạt các đoạn video ngắn thành các tập phim dài theo số phút chỉ định. Thuật toán Shuffle sẽ xáo trộn ngẫu nhiên để tạo ra các kịch bản khác nhau, hỗ trợ đóng logo và ép GPU siêu tốc.",
    introDownloaderTitle: "Trình Tải Video Đa Nền Tảng", introDownloaderDesc: "Dán link video từ Youtube, Facebook, TikTok vào đây để tải xuống với chất lượng cao nhất (hỗ trợ 4K). Đặc biệt, bạn có thể nhập mốc thời gian để hệ thống tự động cắt và chỉ tải đúng đoạn clip bạn cần.",
    introConverterTitle: "Chuyển Đổi Định Dạng & Bóc Sub AI", introConverterDesc: "Biến đổi linh hoạt giữa MP4, MKV, MP3, PNG... Trị dứt điểm lỗi đen màn hình của CapCut. Đặc biệt tích hợp AI Groq Whisper để trích xuất giọng nói trong video thành phụ đề chuẩn quốc tế (.srt, .vtt) với độ chính xác cao.",
    introTtsTitle: "Giọng Đọc AI (ElevenLabs)", introTtsDesc: "Trợ lý lồng tiếng chuyên nghiệp. Nhập kịch bản văn bản của bạn và AI sẽ đọc lại với ngữ điệu, cảm xúc cực kỳ chân thực (Hỗ trợ chuẩn giọng Adam truyền thuyết). Yêu cầu cấu hình API Key trong mục Cài đặt.",
    introRenamerTitle: "Đổi Tên Tập Tin Hàng Loạt", introRenamerDesc: "Công cụ đắc lực giúp bạn dọn dẹp hàng trăm tên file lộn xộn chỉ trong 1 click. Bạn có thể chèn thêm tiền tố, xóa các chuỗi ký tự rác và đánh số thứ tự tự động chuẩn Total Commander.",
    introInstallerTitle: "Tự Động Cài Đặt Phần Mềm", introInstallerDesc: "Tích chọn các ứng dụng cần thiết, hệ thống sẽ tự động tải phiên bản mới nhất từ trang chủ và tiến hành cài đặt ngầm dưới nền. Không cần bấm Next, không hiện cửa sổ rác. Hỗ trợ cả Win (Winget) và Mac (Brew).",
    introUninstallerTitle: "Gỡ Ứng Dụng Sạch Tận Gốc", introUninstallerDesc: "Khác với trình gỡ cài đặt thông thường, tính năng này sẽ quét sâu vào phân vùng bộ nhớ để tìm và tiêu diệt sạch sẽ các file rác, file cấu hình ẩn, thư mục Cache bị bỏ lại sau khi gỡ app.",
    introCleanerTitle: "Trình Dọn Rác & Cache Hệ Thống", introCleanerDesc: "Ổ cứng bị đầy không rõ lý do? Hệ thống sẽ quét qua các thư mục Temp, Cache trình duyệt và đặc biệt là bộ nhớ đệm phình to khổng lồ của TikTok, CapCut để dọn sạch, trả lại hàng chục GB dung lượng cho máy bạn.",

    setMainTitle: "⚙️ Cấu hình Hệ thống", setMainSub: "Thay đổi ngôn ngữ và tùy biến chủ đề hiển thị của phần mềm.", setLangLabel: "Ngôn ngữ ứng dụng (Language):", setThemeLabel: "Chủ đề hiển thị (Theme Interface):", themeDark: "🌙 Giao diện Tối (Dark Mode)", themeLight: "☀️ Giao diện Sáng (Light Mode)", themeSystem: "💻 Tự động theo Hệ thống (Windows/macOS)", alertChooseFolder: "Vui lòng chọn thư mục video trước!", alertChooseFile: "Vui lòng chọn file đầu vào cần chuyển đổi!", alertChooseUrl: "Vui lòng dán đường link video vào ô nhập!", alertConfirmCancel: "Hủy bỏ toàn bộ tiến trình gộp?"
  },
  en: {
    dashboard: "Dashboard", videoJoiner: "Video Joiner", videoDownloader: "Video Downloader", fileConverter: "File Converter", appTts: "AI Text to Speech", fileRenamer: "Batch Renamer", appInstaller: "App Installer", uninstaller: "Clean Uninstaller", cleaner: "System Cleaner", settings: "Settings", welcome: "Welcome Back!", createdBy: "Created by TCD", 
    start: "START PROCESS", download: "START DOWNLOAD", convert: "START CONVERT", processing: "PROCESSING...", downloading: "DOWNLOADING VIDEO...", converting: "CONVERTING FILE...", btnChooseFolder: "Browse Location", btnChooseLogo: "Select Logo", btnChooseFile: "Select File", btnChooseSub: "Select Sub", btnDelete: "Clear", btnCancel: "🛑 CANCEL", btnPause: "⏸ PAUSE", btnResume: "▶ RESUME", modalConfirm: "CONFIRM (OK)",
    
    descJoiner: "Auto merge original videos by timeline.", descDownloader: "Download crisp 4K clips from Youtube, TikTok, FB.", descConverter: "Convert Media format & hardsub / AI sub extraction.", descTts: "Convert text to Adam ElevenLabs AI voice.", descRenamer: "Batch rename files Total Commander style.", descInstaller: "Silent auto software installation (Win & Mac).", descUninstaller: "List all installed software, uninstall & clean hidden junk.", descCleaner: "Sweep bloated Cache files from TikTok, Chrome, Temp.",
    
    joinTitle: "Drag & Drop or Click to select video folder", joinReady: "{count} videos loaded and ready", joinEmpty: "No files loaded", joinDuration: "Duration target:", joinMinutes: "mins", joinPillar: "Contains 1 long video (Pillar)", joinOutput: "Output destination:", joinDefault: "Default (Save inside source folder)", joinLogo: "Watermark Logo:", joinPosition: "Logo Position:", joinRatio: "Aspect Ratio:", posTopLeft: "Top Left Corner", posTopRight: "Top Right Corner", posBottomLeft: "Bottom Left Corner", posBottomRight: "Bottom Right Corner", ratioOriginal: "Original", joinLoadedAZ: "✅ Loaded {count} video files (A-Z List)", btnChangeFolder: "🔄 CHANGE FOLDER", useGpu: "Use GPU Render", logoSize: "Logo Size:",
    
    dlTitle: "📥 Multi-Platform Video Downloader", dlSub: "Supports downloading 4K video streams and custom trimming intervals.", dlLabelUrl: "Paste video link here:", dlLabelRes: "Download Resolution:", dlLabelCut: "Trim Section Interval (min:sec):", dlLabelSave: "Download Output Directory:", dlDefaultDir: "Default (Downloads Folder)", dlBest: "Best Available (Recommended)", convTitle: "⚡ Multimedia File Converter", convSub: "Convert Images, Videos, Audio with original quality and hardcode subtitle files (.srt, .ass).", convLabelFile: "Select Source File (Video/Image/Audio):", convLabelSub: "Hardsub Embedding (Optional .srt / .ass):", convNoSub: "No subtitle (Fast container copy)", convLabelTarget: "Target Format Extension:", convLabelSave: "Output Destination Directory:", convDefaultDir: "Default (Save inside source file directory)",
    
    ttsTitle: "🗣️ AI Voice Generator", ttsSub: "Uses premium ElevenLabs Multilingual V2 engine for smooth reading, supports the legendary Adam voice.", ttsStep1: "1. Select voice from Cloud:", ttsNoVoice: "(No voices, please configure ElevenLabs Key in Settings)", ttsStep2: "2. Audio output folder:", ttsStep3: "3. Enter the text for AI speech generation:", ttsPlaceholder: "Enter text here (Use punctuation for AI emotional reading)...", btnTts: "GENERATE AI VOICE",
    
    renamerTitle: "🗂️ Advanced Batch Renamer", renamerSub: "Flexible rules for fast batch find/replace, prefixing, or numbering.", renamerBtnLoaded: "📂 Successfully loaded {count} files to queue", renamerBtnAdd: "➕ Click here to select multiple files to rename", renamerMode: "Original Name Mode:", renamerKeep: "Keep Original (Replace word)", renamerRemove: "Remove Original (Completely new name)", renamerFind: "Find text:", renamerReplace: "Replace with:", renamerPrefix: "New Name / Prefix:", renamerNotAvailable: "N/A", renamerPrefixPlaceholder: "Ex: New_Clip_", renamerAddNumber: "Add sequential number", renamerCol1: "Current File Name", renamerCol2: "New File Name (Preview)", renamerEmpty: "Empty list. Please load files to view Preview comparison.", renamerBtnApply: "APPLY MASS BATCH RENAME",
    
    insTitle: "🛠️ Automated App Installer", insSub: "Tick essential apps, the pipeline will automatically fetch latest releases and handle silent background installation.", insCore: "(Engine: {core})", insSearchMac: "Type Mac app name to search...", insSearchWin: "Type app name to search...", insSearching: "SEARCHING...", insSearchBtn: "SEARCH SOFTWARE", insSearchResult: "🔍 Online Cloud Results:", insRecommended: "📦 Popular Recommended Software:", insProgressApp: "📦 Progress [{index}/{total}]: {name}", insProgressGlobal: "Overall Global Installation Progress", insBtn: "LAUNCH AUTOMATED INSTALLATION", insProcessing: "INSTALLING PACKAGES SILENTLY...", insAlertZero: "Please select at least 1 app!",
    
    uninsTitle: "❌ Clean Uninstaller & Deep App Cleanup", uninsSub: "Software data stats, auto-scan and clean hidden junk files.", uninsTotal: "Total Detected: {count} Apps", uninsSearch: "🔍 Type keyword to quick filter apps...", uninsScanning: "SCANNING...", uninsRescan: "🔄 RESCAN", uninsCol1: "App Name", uninsCol2: "Publisher / Path", uninsCol3: "Version", uninsCol4: "Action", uninsWait: "⚙️ QUERYING CORE DEVICE DATABASE, PLEASE WAIT...", uninsEmpty: "No matching software found.", uninsUnknown: "Unknown Vendor", uninsBtnMac: "🗑️ CLEAN JUNK", uninsBtnWin: "⚡ UNINSTALL", uninsConfirm: "Are you sure you want to completely uninstall: {name}?",
    
    cleanerTitle: "🧹 System Junk Scanner & Speed Optimizer", cleanerSub: "Wipe bloated cache from TikTok, CapCut, Chrome and Temp partitions.", cleanerTotal: "Total junk selected: {size}", cleanerScanWait: "🔍 CALCULATING...", cleanerScanBtn: "🔎 SCAN FULL SYSTEM JUNK", cleanerCleanBtn: "🗑️ DEEP CLEAN", cleanerScanning: "⚙️ MEASURING HARD DRIVE CACHE, PLEASE WAIT A MOMENT...", cleanerEmpty: "No scan data. Click 'Scan Full System Junk' to start.", cleanerAlertZero: "Please select at least 1 item to clean!",
    
    introIgnore: "Got it, skip and don't show this message again.", introStart: "START USING",
    introJoinerTitle: "Video Joiner (Scripted Merging)", introJoinerDesc: "Automatically merges multiple short videos into full episodes based on duration. The Shuffle algorithm randomly mixes them to create unique scenarios, supports watermark logo and high-speed GPU rendering.",
    introDownloaderTitle: "Multi-Platform Video Downloader", introDownloaderDesc: "Paste video links from Youtube, Facebook, TikTok to download at max quality (4K supported). You can also specify timestamps to auto-trim and download only the exact segment you need.",
    introConverterTitle: "Format Converter & AI Subtitle", introConverterDesc: "Seamlessly convert between MP4, MKV, MP3, PNG... Fixes CapCut black screen issues instantly. Features Groq Whisper AI to extract highly accurate, international standard subtitles (.srt, .vtt) from video audio.",
    introTtsTitle: "AI Voice Generator (ElevenLabs)", introTtsDesc: "Professional voiceover assistant. Enter your script and AI will read it with ultra-realistic intonation and emotion (Supports the legendary Adam voice). API Key configuration required in Settings.",
    introRenamerTitle: "Batch File Renamer", introRenamerDesc: "A powerful tool to clean up hundreds of messy filenames in 1 click. You can add prefixes, erase junk strings, and apply auto-sequential numbering exactly like Total Commander.",
    introInstallerTitle: "Automated App Installer", introInstallerDesc: "Tick necessary applications and the system will auto-download the latest versions and install them silently in the background. No clicking 'Next', no spam windows. Supports both Win (Winget) and Mac (Brew).",
    introUninstallerTitle: "Clean Uninstaller", introUninstallerDesc: "Unlike standard uninstallers, this feature deep-scans memory partitions to locate and eradicate all leftover junk files, hidden configs, and Cache directories abandoned after removing an app.",
    introCleanerTitle: "System Junk & Cache Cleaner", introCleanerDesc: "Hard drive full for no reason? The system scans Temp folders, browser caches, and especially the massively bloated cache of TikTok and CapCut to sweep them clean, recovering gigabytes of storage.",

    setMainTitle: "⚙️ System Configurations", setMainSub: "Switch application language and customize theme color variations.", setLangLabel: "Application Language:", setThemeLabel: "Display Style Theme:", themeDark: "🌙 Dark Mode Theme", themeLight: "☀️ Light Mode Theme", themeSystem: "💻 Match System Preferences (Windows/macOS)", alertChooseFolder: "Please select a valid video directory first!", alertChooseFile: "Please select a source file to convert!", alertChooseUrl: "Please paste a valid video URL link!", alertConfirmCancel: "Are you sure you want to terminate the merging sequence?"
  }
}

const AVAILABLE_APPS = [
  { id: 'Google.Chrome', macId: 'google-chrome', name: 'Google Chrome', icon: '🌐' },
  { id: 'Bytedance.CapCut', macId: 'capcut', name: 'CapCut Editor', icon: '🎬' },
  { id: 'OBSProject.OBSStudio', macId: 'obs', name: 'OBS Studio', icon: '🎥' },
  { id: 'Microsoft.VisualStudioCode', macId: 'visual-studio-code', name: 'VS Code', icon: '💻' },
  { id: 'VideoLAN.VLC', macId: 'vlc', name: 'VLC Player', icon: '🎵' },
  { id: 'WinRAR.WinRAR', macId: 'the-unarchiver', name: 'The Unarchiver (Mac)', icon: '📦' },
  { id: 'Discord.Discord', macId: 'discord', name: 'Discord', icon: '💬' },
  { id: 'EpicGames.EpicGamesLauncher', macId: 'epic-games', name: 'Epic Games', icon: '🎮' }
]

interface SystemApp { name: string; path: string; version: string; publisher: string }
interface JunkItem { id: string; name: string; desc: string; size: number; path: string }

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [videoList, setVideoList] = useState<string[]>([]) 
  const [platform, setPlatform] = useState<string>('win32')
  
  const [language, setLanguage] = useState<'vi' | 'en'>(() => { return (localStorage.getItem('hub_lang') as 'vi' | 'en') || 'vi' })
  const [themeSetting, setThemeSetting] = useState<'dark' | 'light' | 'system'>(() => { return (localStorage.getItem('hub_theme') as 'dark' | 'light' | 'system') || 'dark' })
  const [isDark, setIsDark] = useState<boolean>(true)

  const [groqKey, setGroqKey] = useState<string>(() => { return localStorage.getItem('hub_groq_key') || '' })
  const [elevenKey, setElevenKey] = useState<string>(() => { return localStorage.getItem('hub_eleven_key') || '' })

  const [introModal, setIntroModal] = useState<string | null>(null)
  const [dontShowIntroAgain, setDontShowIntroAgain] = useState<boolean>(false)

  const [systemApps, setSystemApps] = useState<SystemApp[]>([])
  const [uninstallerSearch, setUninstallerSearch] = useState<string>('')
  const [isScanningApps, setIsScanningApps] = useState<boolean>(false)
  const [junkList, setJunkList] = useState<JunkItem[]>([])
  const [selectedJunkIds, setSelectedJunkIds] = useState<string[]>([])
  const [isScanningJunk, setIsScanningJunk] = useState<boolean>(false)

  const [minTime, setMinTime] = useState<number>(60)
  const [maxTime, setMaxTime] = useState<number>(70)
  const [requirePillar, setRequirePillar] = useState<boolean>(true)
  const [useGpu, setUseGpu] = useState<boolean>(true) 
  const [outputFolder, setOutputFolder] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const [logoPosition, setLogoPosition] = useState<string>('top-right')
  const [logoSize, setLogoSize] = useState<number>(200) 
  const [joinRatio, setJoinRatio] = useState<string>('original')

  const [downloadUrl, setDownloadUrl] = useState<string>('')
  const [downloadFolder, setDownloadFolder] = useState<string>('')
  const [dlResolution, setDlResolution] = useState<string>('best')
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [dlMsg, setDlMsg] = useState<string>('')
  const [dlPercent, setDlPercent] = useState<number>(0)
  const [dlStart, setDlStart] = useState<string>('')
  const [dlEnd, setDlEnd] = useState<string>('')

  const [convertFile, setConvertFile] = useState<string>('')
  const [convertSub, setConvertSub] = useState<string>('')
  const [targetExtension, setTargetExtension] = useState<string>('mp4')
  const [convertFolder, setConvertFolder] = useState<string>('')
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [convMsg, setConvMsg] = useState<string>('')
  const [convPercent, setConvertPercent] = useState<number>(0)

  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [isInstalling, setIsInstalling] = useState<boolean>(false)
  const [installProgress, setInstallProgress] = useState<{ appIndex: number; totalApps: number; appName: string; stage: string; stagePercent: number; globalPercent: number; }>({ appIndex: 0, totalApps: 0, appName: '', stage: '', stagePercent: 0, globalPercent: 0 })
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; icon: string }[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const [ttsText, setTtsText] = useState<string>('')
  const [voices, setVoices] = useState<{ id: string; name: string; category: string }[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [ttsFolder, setTtsFolder] = useState<string>('')

  const [selectedFiles, setSelectedFiles] = useState<{ path: string; name: string; ext: string }[]>([])
  const [keepOriginal, setKeepOriginal] = useState<boolean>(true) 
  const [findText, setFindText] = useState<string>('')
  const [replaceText, setReplaceText] = useState<string>('')
  const [renamePrefix, setRenamePrefix] = useState<string>('')
  const [useCounter, setUseCounter] = useState<boolean>(true) 
  const [counterStart, setCounterStart] = useState<number>(1)
  const [counterDigits, setCounterDigits] = useState<number>(2) 

  const [customModal, setCustomModal] = useState<{ show: boolean; title: string; message: string } | null>(null)
  const [ffmpegInstallMsg, setFfmpegInstallMsg] = useState<{show: boolean, msg: string, percent: number} | null>(null)

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const t = (key: string, replaceData?: { [key: string]: any }) => {
    let str = translations[language][key] || key
    if (replaceData) { Object.keys(replaceData).forEach(k => { str = str.replace(`{${k}}`, replaceData[k]) }) }
    return str
  }

  const FEATURE_INTROS: Record<string, { icon: string, title: string, desc: string }> = {
    joiner: { icon: "🎞️", title: t('introJoinerTitle'), desc: t('introJoinerDesc') },
    downloader: { icon: "📥", title: t('introDownloaderTitle'), desc: t('introDownloaderDesc') },
    converter: { icon: "⚡", title: t('introConverterTitle'), desc: t('introConverterDesc') },
    tts: { icon: "🗣️", title: t('introTtsTitle'), desc: t('introTtsDesc') },
    renamer: { icon: "🗂️", title: t('introRenamerTitle'), desc: t('introRenamerDesc') },
    installer: { icon: "🛠️", title: t('introInstallerTitle'), desc: t('introInstallerDesc') },
    uninstaller: { icon: "❌", title: t('introUninstallerTitle'), desc: t('introUninstallerDesc') },
    cleaner: { icon: "🧹", title: t('introCleanerTitle'), desc: t('introCleanerDesc') }
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (tabId === 'home' || tabId === 'settings') return
    const isHidden = localStorage.getItem(`hub_intro_hidden_${tabId}`)
    if (isHidden !== 'true') { setIntroModal(tabId); setDontShowIntroAgain(false) }
  }

  const closeIntroModal = () => {
    if (introModal && dontShowIntroAgain) { localStorage.setItem(`hub_intro_hidden_${introModal}`, 'true') }
    setIntroModal(null)
  }

  const loadSystemApps = async () => {
    setIsScanningApps(true)
    try { const apps = await window.electron.ipcRenderer.invoke('get-system-installed-apps'); setSystemApps(apps) } 
    catch (e) { console.error(e) } finally { setIsScanningApps(false) }
  }

  const handleScanJunkFiles = async () => {
    setIsScanningJunk(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('scan-system-junk')
      if (data && Array.isArray(data)) { setJunkList(data); setSelectedJunkIds(data.map((item: JunkItem) => item.id)) }
    } catch (err) { console.error(err) } finally { setIsScanningJunk(false) }
  }

  useEffect(() => { localStorage.setItem('hub_lang', language) }, [language])
  useEffect(() => { localStorage.setItem('hub_groq_key', groqKey) }, [groqKey])
  useEffect(() => { localStorage.setItem('hub_eleven_key', elevenKey) }, [elevenKey])

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-platform').then((res: string) => {
      setPlatform(res)
      if (res === 'darwin') {
        window.electron.ipcRenderer.on('ffmpeg-install-progress', (_e: any, data: any) => {
          setFfmpegInstallMsg({ show: true, msg: data.message, percent: data.percent })
        })
        window.electron.ipcRenderer.invoke('ensure-mac-ffmpeg').then((result: any) => {
          if (!result.success) {
            setFfmpegInstallMsg(null)
            setCustomModal({ show: true, title: "MAC SYSTEM ERROR", message: result.message })
          } else {
            setFfmpegInstallMsg(null)
          }
        })
      }
    })
  }, [])

  useEffect(() => {
    if (activeTab === 'uninstaller') loadSystemApps()
    if (activeTab === 'cleaner') handleScanJunkFiles()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'tts' && (elevenKey.length > 5)) {
      window.electron.ipcRenderer.invoke('get-elevenlabs-voices', { apiKey: elevenKey }).then((res: any) => {
        if (res && Array.isArray(res)) {
          setVoices(res.map((v: any) => ({ id: v.voice_id, name: v.name, category: v.category })))
          if (res.length > 0) setSelectedVoice(res[0].voice_id)
        } else { setVoices([]) }
      }).catch(() => setVoices([]))
    }
  }, [activeTab, elevenKey])

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

  const handleCleanUninstall = async (appInfo: SystemApp) => {
    if (confirm(t('uninsConfirm', { name: appInfo.name }))) {
      setIsScanningApps(true)
      try {
        const response = await window.electron.ipcRenderer.invoke('execute-clean-uninstall', { appPath: appInfo.path, appName: appInfo.name })
        setCustomModal({ show: true, title: t('uninsTitle'), message: response.message }); loadSystemApps()
      } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: err.message }) } finally { setIsScanningApps(false) }
    }
  }

  const handleExecuteCleanJunk = async () => {
    if (selectedJunkIds.length === 0) { alert(t('cleanerAlertZero')); return }
    const targets = (junkList || []).filter(j => selectedJunkIds.includes(j.id)).map(j => j.path)
    setIsScanningJunk(true)
    try {
      const response = await window.electron.ipcRenderer.invoke('execute-system-clean', { targets })
      setCustomModal({ show: true, title: t('cleanerTitle'), message: response.message }); handleScanJunkFiles()
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: err.message }) } finally { setIsScanningJunk(false) }
  }

  const scanDirectory = async (folderPath: string) => {
    if (!folderPath) return;
    try { 
      const result = await window.electron.ipcRenderer.invoke('scan-folder', folderPath); 
      result.sort((a: string, b: string) => {
        const getFileName = (p: string) => p.split(/[/\\]/).pop()?.toLowerCase() || '';
        return getFileName(a).localeCompare(getFileName(b));
      });
      setVideoList(result);
    } catch (error) { console.error(error) }
  };

  const handleStartProcess = async () => {
    if (videoList.length === 0) { alert(t('alertChooseFolder')); return; }
    setIsProcessing(true); setIsPaused(false); setProgressPercent(0); setProgressMsg(t('processing'));
    window.electron.ipcRenderer.on('join-progress', (_event, data) => {
      setProgressMsg(data.message); setProgressPercent(data.percent);
      if (data.message.includes('[TAM DUNG]')) setIsPaused(true);
    });
    try {
      const response = await window.electron.ipcRenderer.invoke('start-joining', { videoPaths: videoList, minMins: Number(minTime), maxMins: Number(maxTime), requirePillar: requirePillar, outputDir: outputFolder, logoPath: logoPath, logoPosition: logoPosition, logoSize: logoSize, ratio: joinRatio, useGpu: useGpu });
      setCustomModal({ show: true, title: t('joinTitle'), message: response.message });
    } catch (error: any) { setCustomModal({ show: true, title: "ERROR", message: error.message }); } finally {
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
    setIsDownloading(true); setDlPercent(0); setDlMsg(t('downloading'));
    window.electron.ipcRenderer.on('download-progress', (_event, data) => { setDlMsg(data.message); setDlPercent(data.percent); });
    try {
      const response = await window.electron.ipcRenderer.invoke('download-video', { url: downloadUrl, saveDir: downloadFolder, resolution: dlResolution, startTime: dlStart, endTime: dlEnd });
      setCustomModal({ show: true, title: t('dlTitle'), message: response.message });
      if (response.success) { setDownloadUrl(''); setDlStart(''); setDlEnd(''); } 
    } catch (error: any) { setCustomModal({ show: true, title: "ERROR", message: error.message }); } finally { setIsDownloading(false); window.electron.ipcRenderer.removeAllListeners('download-progress'); }
  };

  const handleConvertFile = async () => {
    if (!convertFile) { alert(t('alertChooseFile')); return; }
    setIsConverting(true); setConvertPercent(0); setConvMsg(t('converting'));
    window.electron.ipcRenderer.on('convert-progress', (_event, data) => { setConvMsg(data.message); setConvertPercent(data.percent); });
    try {
      const response = await window.electron.ipcRenderer.invoke('convert-file', { inputPath: convertFile, outputDir: convertFolder, targetExt: targetExtension, subPath: convertSub, apiKey: groqKey });
      setCustomModal({ show: true, title: t('convTitle'), message: response.message });
      if (response.success) { setConvertFile(''); setConvertSub(''); }
    } catch (error: any) { setCustomModal({ show: true, title: "ERROR", message: error.message }); } finally { setIsConverting(false); window.electron.ipcRenderer.removeAllListeners('convert-progress'); }
  };

  const handleSearchAppOnline = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await window.electron.ipcRenderer.invoke('search-apps', { query: searchQuery })
      setSearchResults(results)
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: err.message }) } finally { setIsSearching(false) }
  }

  const handleLaunchInstallation = async () => {
    if (selectedApps.length === 0) { alert(t('insAlertZero')); return; }
    setIsInstalling(true); setInstallProgress({ appIndex: 1, totalApps: selectedApps.length, appName: '', stage: 'Khởi động', stagePercent: 0, globalPercent: 0 });
    window.electron.ipcRenderer.on('install-apps-progress', (_event, data) => {
      if (data.message === 'Hoàn thành!' || data.message === 'Completed!') { setInstallProgress(prev => ({ ...prev, globalPercent: 100, stagePercent: 100, stage: 'Hoàn thành' })); } 
      else { setInstallProgress(data); }
    });
    try {
      const response = await window.electron.ipcRenderer.invoke('install-selected-apps', { appIds: selectedApps });
      setCustomModal({ show: true, title: t('insTitle'), message: response.message });
      if (response.success) { setSelectedApps([]); setSearchResults([]); setSearchQuery(''); }
    } catch (error: any) { setCustomModal({ show: true, title: "ERROR", message: error.message }); } finally { setIsInstalling(false); window.electron.ipcRenderer.removeAllListeners('install-apps-progress'); }
  };

  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) { alert(t('ttsPlaceholder')); return; }
    setIsConverting(true); setConvertPercent(0); setConvMsg(t('processing'));
    window.electron.ipcRenderer.on('convert-progress', (_event, data) => { setConvMsg(data.message); setConvertPercent(data.percent); })
    try {
      const response = await window.electron.ipcRenderer.invoke('generate-tts-elevenlabs', { text: ttsText, voiceId: selectedVoice, apiKey: elevenKey, outputDir: ttsFolder })
      setCustomModal({ show: true, title: t('ttsTitle'), message: response.message })
      if (response.success) setTtsText('')
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: err.message }) } finally { setIsConverting(false); window.electron.ipcRenderer.removeAllListeners('convert-progress'); }
  }

  const buildNewFileName = (originName: string, idx: number) => {
    let baseText = keepOriginal ? originName : ''
    if (keepOriginal && findText) { baseText = baseText.replaceAll(findText, replaceText) }
    const numberPart = useCounter ? String(counterStart + idx).padStart(counterDigits, '0') : ''
    let parts: string[] = []
    if (renamePrefix) parts.push(renamePrefix)
    if (numberPart) parts.push(numberPart)
    if (baseText) parts.push(baseText)
    return parts.join('_') || originName 
  }

  const toggleAppSelection = (appId: string) => {
    if (selectedApps.includes(appId)) { setSelectedApps(selectedApps.filter(id => id !== appId)); } 
    else { setSelectedApps([...selectedApps, appId]); }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredApps = (systemApps || []).filter(app => app.name?.toLowerCase().includes(uninstallerSearch.toLowerCase()))
  const totalJunkBytes = (junkList || []).filter(j => selectedJunkIds.includes(j.id)).reduce((acc, curr) => acc + (curr.size || 0), 0)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    const files = (e.nativeEvent as DragEvent).dataTransfer?.files;
    if (files && files.length > 0) {
      let folderPath = (files[0] as any).path || window.api?.getPath?.(files[0]);
      if (folderPath) scanDirectory(folderPath);
    }
  };

  const c_bgMain   = isDark ? 'bg-[#0f0f0f] text-white' : 'bg-[#f4f4f6] text-zinc-900'
  const c_bgPanel  = isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'
  const c_bgTab    = isDark ? 'bg-[#121212] border-[#222]' : 'bg-[#eaeaea] border-zinc-300'
  const c_bgInput  = isDark ? 'bg-[#0a0a0a] border-[#333]' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
  const c_textSub  = isDark ? 'text-gray-400' : 'text-zinc-500'
  const c_borderT  = isDark ? 'border-[#262626]' : 'border-zinc-200'
  const c_btnSec   = isDark ? 'bg-[#262626] border-[#444] hover:bg-[#333]' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200'

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-200 ${c_bgMain}`}>
      {/* SIDEBAR NAVIGATION */}
      <aside className={`w-64 flex flex-col p-6 shrink-0 border-r ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="mb-10"><h1 className="text-2xl font-bold text-red-500 tracking-wider">CREATOR HUB</h1><p className="text-xs text-gray-500 mt-1 font-medium">v1.0.0 | {t('createdBy')}</p></div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          <button onClick={() => handleTabChange('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'home' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🏠 <span>{t('dashboard')}</span></button>
          <button onClick={() => handleTabChange('joiner')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'joiner' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🎬 <span>{t('videoJoiner')}</span></button>
          <button onClick={() => handleTabChange('downloader')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'downloader' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>📥 <span>{t('videoDownloader')}</span></button>
          <button onClick={() => handleTabChange('converter')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'converter' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>⚡ <span>{t('fileConverter')}</span></button>
          <button onClick={() => handleTabChange('tts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'tts' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🗣️ <span>{t('appTts')}</span></button>
          <button onClick={() => handleTabChange('renamer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'renamer' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🗂️ <span>{t('fileRenamer')}</span></button>
          <button onClick={() => handleTabChange('installer')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'installer' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🛠️ <span>{t('appInstaller')}</span></button>
          <button onClick={() => handleTabChange('uninstaller')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'uninstaller' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>❌ <span>{t('uninstaller')}</span></button>
          <button onClick={() => handleTabChange('cleaner')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'cleaner' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>🧹 <span>{t('cleaner')}</span></button>
        </nav>
        <div className="mt-auto"><button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === 'settings' ? 'bg-red-500 text-white' : isDark ? 'text-gray-400 hover:bg-[#262626]' : 'text-zinc-600 hover:bg-zinc-100'}`}>⚙️ <span>{t('settings')}</span></button></div>
      </aside>

      {/* MAIN VIEW LAYOUT */}
      <main className="flex-1 p-10 flex flex-col h-screen overflow-hidden">
        <header className="mb-8 shrink-0"><h2 className="text-3xl font-bold">{t('welcome')}</h2></header>

        {/* 0. HOME DASHBOARD */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 w-full overflow-y-auto p-3 -m-3">
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('joiner')}><span className="text-3xl">🎞️</span><h3 className="text-lg font-bold">{t('videoJoiner')}</h3><p className={`text-xs ${c_textSub}`}>{t('descJoiner')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('downloader')}><span className="text-3xl">📥</span><h3 className="text-lg font-bold">{t('videoDownloader')}</h3><p className={`text-xs ${c_textSub}`}>{t('descDownloader')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('converter')}><span className="text-3xl">⚡</span><h3 className="text-lg font-bold">{t('fileConverter')}</h3><p className={`text-xs ${c_textSub}`}>{t('descConverter')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('tts')}><span className="text-3xl">🗣️</span><h3 className="text-lg font-bold">{t('appTts')}</h3><p className={`text-xs ${c_textSub}`}>{t('descTts')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('renamer')}><span className="text-3xl">🗂️</span><h3 className="text-lg font-bold">{t('fileRenamer')}</h3><p className={`text-xs ${c_textSub}`}>{t('descRenamer')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('installer')}><span className="text-3xl">🛠️</span><h3 className="text-lg font-bold">{t('appInstaller')}</h3><p className={`text-xs ${c_textSub}`}>{t('descInstaller')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('uninstaller')}><span className="text-3xl">❌</span><h3 className="text-lg font-bold">{t('uninstaller')}</h3><p className={`text-xs ${c_textSub}`}>{t('descUninstaller')}</p></div>
            <div className={`border p-6 rounded-3xl cursor-pointer hover:border-red-500 hover:scale-[1.02] active:scale-[0.99] transition-all flex flex-col gap-3 ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200 shadow-sm'}`} onClick={() => handleTabChange('cleaner')}><span className="text-3xl">🧹</span><h3 className="text-lg font-bold text-red-500">{t('cleaner')}</h3><p className={`text-xs ${c_textSub}`}>{t('descCleaner')}</p></div>
          </div>
        )}

        {/* 1. TAB: VIDEO JOINER */}
        {activeTab === 'joiner' && (
          <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden w-full">
            <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} className={`flex-1 flex flex-col border-2 border-dashed rounded-3xl relative overflow-hidden group hover:border-red-500/50 transition-colors ${c_bgTab}`}>
              {videoList.length === 0 ? (
                <div onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) scanDirectory(path); }} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                  <span className="text-6xl mb-4 group-hover:-translate-y-2 transition-transform duration-300">📥</span>
                  <h3 className="text-2xl font-bold mb-2">{t('joinTitle')}</h3>
                  <div className={`border px-4 py-2 rounded-full text-sm font-semibold ${isDark ? 'bg-[#1a1a1a] border-[#333] text-gray-400' : 'bg-zinc-200 border-zinc-300 text-zinc-600'}`}>{t('joinEmpty')}</div>
                </div>
              ) : (
                <div className="flex flex-col w-full h-full p-6">
                  <div className="flex justify-between items-center mb-4 px-2">
                    <span className="font-bold text-base text-red-500">{t('joinLoadedAZ', { count: videoList.length })}</span>
                    <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) scanDirectory(path); }} className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${c_btnSec}`}>{t('btnChangeFolder')}</button>
                  </div>
                  <div className={`flex-1 overflow-y-auto border rounded-2xl p-3 shadow-inner ${isDark ? 'border-zinc-800 bg-[#0f0f0f]' : 'border-zinc-200 bg-zinc-50'}`}>
                    {videoList.map((p, i) => (
                      <div key={i} className={`text-sm p-3 border-b last:border-0 truncate font-medium flex items-center gap-3 ${isDark ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900/50' : 'border-zinc-200 text-zinc-700 hover:bg-white'} transition-colors rounded-lg`}>
                        <span className="text-red-500 font-bold min-w-[24px]">{i + 1}.</span> {p.split(/[/\\]/).pop()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isProcessing && ( <div className={`shrink-0 border rounded-2xl p-5 ${c_bgPanel}`}><div className="flex justify-between items-center mb-2"><span className={`text-sm font-medium ${isPaused ? 'text-yellow-500' : 'animate-pulse'}`}>{progressMsg}</span><span className="text-sm font-bold text-red-500">{progressPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden border ${c_bgInput}`}><div className={`h-full transition-all duration-300 ${isPaused ? 'bg-yellow-500' : 'bg-red-600'}`} style={{ width: `${progressPercent}%` }}></div></div></div> )}
            <div className={`shrink-0 border rounded-3xl p-6 flex items-center gap-8 w-full ${c_bgPanel}`}>
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3"><label className={`${c_textSub} text-sm font-medium`}>{t('joinDuration')}</label><div className="flex items-center gap-2"><input type="number" value={minTime} onChange={(e) => setMinTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${c_bgInput}`} /><span className="text-gray-500">-</span><input type="number" value={maxTime} onChange={(e) => setMaxTime(Number(e.target.value))} className={`w-20 border rounded-lg px-3 py-1.5 text-center text-sm focus:border-red-500 focus:outline-none ${c_bgInput}`} /><span className={`${c_textSub} text-sm`}>{t('joinMinutes')}</span></div></div>
                  <label className="flex items-center gap-3 cursor-pointer select-none"><input type="checkbox" checked={requirePillar} onChange={(e) => setRequirePillar(e.target.checked)} className="hidden" /><div className={`w-5 h-5 rounded border flex items-center justify-center ${c_bgInput}`}>{requirePillar && <span className="text-red-500 font-bold text-xs">✓</span>}</div><span className="text-sm font-medium">{t('joinPillar')}</span></label>
                  <label className="flex items-center gap-3 cursor-pointer select-none ml-2">
                    <input type="checkbox" checked={useGpu} onChange={(e) => setUseGpu(e.target.checked)} className="hidden" />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${c_bgInput}`}>{useGpu && <span className="text-red-500 font-bold text-xs">✓</span>}</div>
                    <span className="text-sm font-medium text-orange-500">{t('useGpu')}</span>
                  </label>
                </div>

                <div className={`flex flex-col gap-1.5 border-t pt-3 ${c_borderT}`}><label className={`${c_textSub} text-xs font-medium`}>{t('joinOutput')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={outputFolder || t('joinDefault')} className={`flex-1 border rounded-lg px-3 py-1.5 text-sm truncate focus:outline-none ${c_bgInput}`} /><button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setOutputFolder(path); }} className={`text-xs font-bold px-4 py-1.5 rounded-lg shrink-0 border transition-colors ${c_btnSec}`}>{t('btnChooseFolder')}</button></div></div>
                <div className={`grid grid-cols-5 gap-6 border-t pt-3.5 w-full ${c_borderT}`}>
                  <div className="flex flex-col gap-1.5 min-w-0 col-span-2">
                    <label className={`${c_textSub} text-xs font-medium`}>{t('joinLogo')}</label>
                    <div className="flex items-center gap-2 w-full">
                      <input type="text" readOnly value={logoPath || "No Logo Mode"} className={`flex-1 border rounded-lg px-3 py-1.5 text-xs truncate focus:outline-none min-w-0 ${c_bgInput}`} />
                      <button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-logo-dialog'); if (path) setLogoPath(path); }} className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 border transition-colors ${c_btnSec}`}>{t('btnChooseLogo')}</button>
                      {logoPath && <button onClick={() => setLogoPath('')} className="text-xs text-red-500 font-medium px-1 shrink-0 hover:text-red-400 transition-colors">{t('btnDelete')}</button>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className={`${c_textSub} text-xs font-medium`}>{t('logoSize')}</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min="50" max="800" step="10" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer" />
                      <span className="text-xs font-bold text-red-500 w-8 text-right">{logoSize}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1"><label className={`${c_textSub} text-xs font-medium`}>{t('joinPosition')}</label><select value={logoPosition} onChange={(e) => setLogoPosition(e.target.value)} className={`w-full border text-xs rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none h-[32px] ${c_bgInput}`}><option value="top-left">{t('posTopLeft')}</option><option value="top-right">{t('posTopRight')}</option><option value="bottom-left">{t('posBottomLeft')}</option><option value="bottom-right">{t('posBottomRight')}</option></select></div>
                  <div className="flex flex-col gap-1.5 col-span-1"><label className={`${c_textSub} text-xs font-medium`}>{t('joinRatio')}</label><select value={joinRatio} onChange={(e) => setJoinRatio(e.target.value)} className={`w-full border text-sm text-red-500 font-semibold rounded-lg px-3 py-1.5 focus:border-red-500 focus:outline-none h-[32px] ${c_bgInput}`}><option value="original">{t('ratioOriginal')}</option><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="1:1">1:1</option></select></div>
                </div>
              </div>
              {!isProcessing ? ( <button onClick={handleStartProcess} className="bg-red-600 hover:bg-red-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shrink-0 transition-transform active:scale-95 shadow-lg">{t('start')}</button> ) : ( <div className="flex gap-2 h-full shrink-0"><button onClick={handlePauseToggle} className="py-4 px-4 rounded-2xl font-bold text-sm bg-zinc-600 text-white shadow-md">{isPaused ? t('btnResume') : t('btnPause')}</button><button onClick={handleCancel} className="bg-red-600 text-white font-bold py-4 px-4 rounded-2xl text-sm shadow-md">{t('btnCancel')}</button></div> )}
            </div>
          </div>
        )}

        {/* 2. TAB: VIDEO DOWNLOADER */}
        {activeTab === 'downloader' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('dlTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('dlSub')}</p></div>
            <div className="flex flex-col gap-2 w-full"><label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelUrl')}</label><input type="text" disabled={isDownloading} value={downloadUrl} onChange={(e) => setDownloadUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={`w-full border focus:border-red-500 rounded-xl px-4 py-3.5 focus:outline-none ${c_bgInput}`} /></div>
            <div className="grid grid-cols-3 gap-6 w-full">
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelRes')}</label><select disabled={isDownloading} value={dlResolution} onChange={(e) => setDlResolution(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none w-full ${c_bgInput}`}><option value="best">{t('dlBest')}</option><option value="2160">4K 2160p</option><option value="1440">2K 1440p</option><option value="1080">FullHD 1080p</option><option value="720">HD 720p</option></select></div>
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelCut')}</label><div className="flex items-center gap-2 w-full"><input type="text" placeholder="0:10" disabled={isDownloading} value={dlStart} onChange={(e) => setDlStart(e.target.value)} className={`w-full border focus:border-red-500 rounded-xl px-3 py-3 text-sm text-center focus:outline-none ${c_bgInput}`} /><span className="text-gray-600">-</span><input type="text" placeholder="2:30" disabled={isDownloading} value={dlEnd} onChange={(e) => setDlEnd(e.target.value)} className={`w-full border focus:border-red-500 rounded-xl px-3 py-3 text-sm text-center focus:outline-none ${c_bgInput}`} /></div></div>
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('dlLabelSave')}</label><div className="flex items-center gap-2 w-full"><input type="text" readOnly value={downloadFolder || t('dlDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-sm truncate focus:outline-none ${c_bgInput}`} /><button disabled={isDownloading} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setDownloadFolder(path); }} className={`border text-sm font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${c_btnSec}`}>{t('btnChooseFolder')}</button></div></div>
            </div>
            {isDownloading && ( <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 w-full"><div className="flex justify-between items-center mb-2"><span className="text-xs font-medium animate-pulse">{dlMsg}</span><span className="text-xs font-bold text-red-500">{dlPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-red-500 h-full" style={{ width: `${dlPercent}%` }}></div></div></div> )}
            <button onClick={handleDownloadVideo} disabled={isDownloading} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isDownloading ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{isDownloading ? t('downloading') : t('download')}</button>
          </div>
        )}

        {/* 3. TAB: FILE CONVERTER */}
        {activeTab === 'converter' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('convTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('convSub')}</p></div>
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelFile')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={convertFile || "Select File Source..."} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-file-dialog', null); if (path) setConvertFile(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl shrink-0 border ${c_btnSec}`}>{t('btnChooseFile')}</button></div></div>
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelSub')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={convertSub || t('convNoSub')} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-file-dialog', { name: 'Subtitles', extensions: ['srt', 'ass'] }); if (path) setConvertSub(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl shrink-0 border ${c_btnSec}`}>{t('btnChooseSub')}</button>{convertSub && <button onClick={() => setConvertSub('')} className="text-xs text-red-500 font-bold px-2 hover:text-red-400">{t('btnDelete')}</button>}</div></div>
            </div>
            <div className={`grid grid-cols-2 gap-6 w-full border-t pt-4 ${c_borderT}`}>
              <div className="flex flex-col gap-2">
                <label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelTarget')}</label>
                <select value={targetExtension} onChange={(e) => setTargetExtension(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none w-full ${c_bgInput}`}><optgroup label="Video Container"><option value="mp4">Video MP4</option><option value="mkv">Video MKV</option><option value="mov">Video MOV</option></optgroup><optgroup label="Image Extension"><option value="png">Ảnh PNG</option><option value="jpg">Ảnh JPG</option><option value="webp">Ảnh WebP</option><option value="mp3">Âm thanh MP3</option><option value="m4a">Âm thanh M4A</option></optgroup><optgroup label="Trích xuất phụ đề AI (Groq Whisper)"><option value="srt">SubRip Subtitle (.srt)</option><option value="vtt">WebVTT Subtitle (.vtt)</option><option value="ass">Advanced SubStation (.ass)</option></optgroup></select>
              </div>
              <div className="flex flex-col gap-2"><label className={`text-sm font-medium ${c_textSub}`}>{t('convLabelSave')}</label><div className="flex items-center gap-2"><input type="text" readOnly value={convertFolder || t('convDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-xs truncate focus:outline-none ${c_bgInput}`} /><button disabled={isConverting} onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setConvertFolder(path); }} className={`text-xs font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${c_btnSec}`}>{t('btnChooseFolder')}</button></div></div>
            </div>
            {isConverting && ( <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 w-full"><div className="flex justify-between items-center mb-2"><span className="text-xs font-medium animate-pulse">{convMsg}</span><span className="text-xs font-bold text-red-500">{convPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-gradient-to-r from-red-600 to-red-500 h-full" style={{ width: `${convPercent}%` }}></div></div></div> )}
            <button onClick={handleConvertFile} disabled={isConverting} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isConverting ? 'bg-zinc-600 text-zinc-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{isConverting ? t('converting') : t('convert')}</button>
          </div>
        )}

        {/* 4. TAB: GIỌNG ĐỌC AI ELEVENLABS */}
        {activeTab === 'tts' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('ttsTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('ttsSub')}</p></div>
            <div className="grid grid-cols-2 gap-6 w-full border-t pt-4 border-zinc-500/10">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">{t('ttsStep1')}</label>
                <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className={`border text-sm rounded-xl px-4 py-3 focus:border-red-500 focus:outline-none w-full cursor-pointer ${c_bgInput}`}>
                  {voices.length === 0 ? <option value="">{t('ttsNoVoice')}</option> : voices.map(v => <option key={v.id} value={v.id}>{v.name} [{v.category}]</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">{t('ttsStep2')}</label>
                <div className="flex items-center gap-2 w-full"><input type="text" readOnly value={ttsFolder || t('dlDefaultDir')} className={`flex-1 border rounded-xl px-4 py-3 text-sm truncate focus:outline-none ${c_bgInput}`} /><button onClick={async () => { const path = await window.electron.ipcRenderer.invoke('open-folder-dialog'); if (path) setTtsFolder(path); }} className={`border text-sm font-bold px-4 py-3 rounded-xl transition-colors shrink-0 ${c_btnSec}`}>{t('btnChooseFolder')}</button></div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full flex-1 min-h-[150px]">
              <label className="text-sm font-semibold">{t('ttsStep3')}</label>
              <textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder={t('ttsPlaceholder')} className={`w-full flex-1 border focus:border-red-500 rounded-2xl p-4 text-sm font-medium focus:outline-none resize-none ${c_bgInput}`} />
            </div>
            {isConverting && ( <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 w-full"><div className="flex justify-between items-center mb-1"><span className="text-xs font-medium animate-pulse text-red-500">{convMsg}</span><span className="text-xs font-bold text-red-500">{convPercent}%</span></div><div className={`w-full h-1.5 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-red-500 h-full" style={{ width: `${convPercent}%` }}></div></div></div> )}
            <button onClick={handleGenerateTTS} disabled={isConverting || voices.length === 0} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isConverting ? 'bg-zinc-600 text-zinc-400' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{t('btnTts')}</button>
          </div>
        )}

        {/* 5. TAB: ĐỔI TÊN HÀNG LOẠT */}
        {activeTab === 'renamer' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-hidden ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('renamerTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('renamerSub')}</p></div>
            <button onClick={async () => { const files = await window.electron.ipcRenderer.invoke('open-multi-files-dialog'); if (files && files.length > 0) { setSelectedFiles(files) } }} className={`w-full py-5 border-2 border-dashed border-red-500/30 rounded-2xl font-bold text-sm hover:border-red-500 text-center transition-all cursor-pointer ${c_bgTab}`}>{selectedFiles.length > 0 ? t('renamerBtnLoaded', { count: selectedFiles.length }) : t('renamerBtnAdd')}</button>
            <div className="grid grid-cols-5 gap-4 w-full border-t pt-4 border-zinc-500/10 items-end">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerMode')}</label><select value={keepOriginal ? 'true' : 'false'} onChange={(e) => setKeepOriginal(e.target.value === 'true')} className={`w-full border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer ${c_bgInput}`}><option value="true">{t('renamerKeep')}</option><option value="false">{t('renamerRemove')}</option></select></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerFind')}</label><input type="text" disabled={!keepOriginal} value={findText} onChange={(e) => setFindText(e.target.value)} placeholder={keepOriginal ? "..." : t('renamerNotAvailable')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${c_bgInput} disabled:opacity-40`} /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerReplace')}</label><input type="text" disabled={!keepOriginal} value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder={keepOriginal ? "..." : t('renamerNotAvailable')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${c_bgInput} disabled:opacity-40`} /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold">{t('renamerPrefix')}</label><input type="text" value={renamePrefix} onChange={(e) => setRenamePrefix(e.target.value)} placeholder={t('renamerPrefixPlaceholder')} className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${c_bgInput}`} /></div>
              <div className={`p-2.5 border rounded-xl flex flex-col gap-1.5 ${c_bgTab}`}>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none"><input type="checkbox" checked={useCounter} onChange={(e) => setUseCounter(e.target.checked)} className="accent-red-500" /><span>{t('renamerAddNumber')}</span></label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input type="number" disabled={!useCounter} value={counterStart} onChange={(e) => setCounterStart(Number(e.target.value))} className="w-full border rounded px-1.5 py-0.5 text-[11px] text-center focus:outline-none disabled:opacity-40 bg-black/20" /><select value={counterDigits} disabled={!useCounter} onChange={(e) => setCounterDigits(Number(e.target.value))} className="w-full border rounded px-1 text-[11px] focus:outline-none disabled:opacity-40 bg-black/20 cursor-pointer"><option value={1}>1</option><option value={2}>01</option><option value={3}>001</option></select>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium">
              <table className="w-full text-left border-collapse">
                <thead><tr className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b font-bold`}><th className="p-3 w-1/2">{t('renamerCol1')}</th><th className="p-3 w-1/2 text-red-500">{t('renamerCol2')}</th></tr></thead>
                <tbody>{selectedFiles.length === 0 ? (<tr><td colSpan={2} className="p-10 text-center text-zinc-400 font-semibold">{t('renamerEmpty')}</td></tr>) : selectedFiles.map((item, idx) => { const finalNewName = buildNewFileName(item.name, idx); return (<tr key={idx} className={`border-b ${isDark ? 'border-zinc-900/50 hover:bg-zinc-900/30' : 'border-zinc-200/50 hover:bg-zinc-50'}`}><td className="p-3 truncate max-w-xs text-zinc-400 font-medium">{item.name}{item.ext}</td><td className="p-3 truncate max-w-xs text-red-500 font-bold">{finalNewName}{item.ext}</td></tr>) })}</tbody>
              </table>
            </div>
            <button onClick={async () => { if (selectedFiles.length === 0) return; const fileRules = selectedFiles.map((f, idx) => { const finalNewName = buildNewFileName(f.name, idx); const directory = f.path.substring(0, f.path.lastIndexOf(f.path.includes('\\') ? '\\' : '/')); const separator = f.path.includes('\\') ? '\\' : '/'; return { oldPath: f.path, newPath: `${directory}${separator}${finalNewName}${f.ext}` } }); const response = await window.electron.ipcRenderer.invoke('execute-batch-rename', { fileRules }); setCustomModal({ show: true, title: t('renamerTitle'), message: response.message }); if (response.success) setSelectedFiles([]) }} disabled={selectedFiles.length === 0} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${selectedFiles.length === 0 ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{t('renamerBtnApply')}</button>
          </div>
        )}

        {/* 6. TAB: BỘ CÀI PHẦN MỀM */}
        {activeTab === 'installer' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('insTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('insSub')} <span className="text-red-500 font-bold uppercase">{t('insCore', { core: platform === 'darwin' ? 'macOS Homebrew' : 'Windows Winget' })}</span></p></div>
            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${c_bgTab}`}><input type="text" value={searchQuery} disabled={isInstalling || isSearching} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchAppOnline()} placeholder={platform === 'darwin' ? t('insSearchMac') : t('insSearchWin')} className={`flex-1 border rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-red-500 focus:outline-none transition-colors placeholder-zinc-400 ${c_bgInput}`} /><button onClick={handleSearchAppOnline} disabled={isInstalling || isSearching} className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all disabled:bg-zinc-600">{isSearching ? t('insSearching') : t('insSearchBtn')}</button></div>
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-2"><span className="text-sm font-bold text-red-500">{t('insSearchResult')}</span>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 w-full">{searchResults.map((item) => { const isChecked = selectedApps.includes(item.id); return ( <div key={item.id} onClick={() => !isInstalling && toggleAppSelection(item.id)} className={`border p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all select-none ${isChecked ? 'border-red-500 bg-red-500/5' : isDark ? 'border-[#262626] hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}><div className={`w-5 h-5 border rounded flex items-center justify-center text-xs ${c_bgInput}`}>{isChecked && <span className="text-red-500 font-bold">✓</span>}</div><div className="flex flex-col min-w-0 flex-1"><span className="text-xs font-bold text-zinc-500 truncate">{item.id}</span><span className="text-sm font-bold truncate text-red-500">{item.name}</span></div></div> ) })}</div>
              </div>
            )}
            <div className="flex flex-col gap-2 border-t pt-4 border-zinc-500/10"><span className={`text-sm font-bold ${c_textSub}`}>{t('insRecommended')}</span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 w-full">{AVAILABLE_APPS.map((item) => { const targetId = platform === 'darwin' ? item.macId : item.id; const isChecked = selectedApps.includes(targetId); return ( <div key={targetId} onClick={() => !isInstalling && toggleAppSelection(targetId)} className={`border p-4 rounded-2xl cursor-pointer flex items-center gap-3 transition-all select-none ${isChecked ? 'border-red-500 bg-red-500/5' : isDark ? 'border-[#262626] hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}><div className={`w-5 h-5 border rounded flex items-center justify-center text-xs ${c_bgInput}`}>{isChecked && <span className="text-red-500 font-bold">✓</span>}</div><div className="flex flex-col min-w-0"><span className="text-xl mb-0.5">{item.icon}</span><span className="text-sm font-semibold truncate">{item.name}</span><span className="text-[10px] text-zinc-500 truncate">{targetId}</span></div></div> ) })}</div>
            </div>
            {isInstalling && ( <div className={`bg-gradient-to-br ${isDark ? 'from-[#1a1a1a] to-[#121212] border-zinc-800' : 'from-zinc-50 to-zinc-100 border-zinc-200'} border rounded-2xl p-6 w-full mt-auto flex flex-col gap-4 shadow-inner`}><div className="flex flex-col gap-1"><div className="flex justify-between items-center text-xs font-semibold"><span className="text-red-500 animate-pulse">{t('insProgressApp', { index: installProgress.appIndex, total: installProgress.totalApps, name: installProgress.appName })}</span><span className={`${isDark ? 'text-gray-400' : 'text-zinc-600'}`}><span className="text-red-500 font-bold">{installProgress.stage} ({installProgress.stagePercent}%)</span></span></div><div className={`w-full h-1.5 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${installProgress.stagePercent}%` }}></div></div></div><div className="flex flex-col gap-1 border-t pt-3 border-zinc-500/10"><div className="flex justify-between items-center text-xs font-semibold"><span className={`${c_textSub}`}>{t('insProgressGlobal')}</span><span className="text-red-500 font-bold">{installProgress.globalPercent}%</span></div><div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}><div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-200" style={{ width: `${installProgress.globalPercent}%` }}></div></div></div></div> )}
            <button onClick={handleLaunchInstallation} disabled={isInstalling} className={`w-full font-bold py-4 rounded-xl text-lg transition-all mt-auto ${isInstalling ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(220,38,38,0.15)]'}`}>{isInstalling ? t('insProcessing') : t('insBtn')}</button>
          </div>
        )}

        {/* 7. TAB: GỠ ỨNG DỤNG SẠCH TẬN GỐC */}
        {activeTab === 'uninstaller' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-5 overflow-hidden ${c_bgPanel}`}>
            <div className="flex justify-between items-start">
              <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('uninsTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('uninsSub')}</p></div>
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 font-bold px-4 py-2 rounded-xl text-xs">{t('uninsTotal', { count: filteredApps.length })}</div>
            </div>
            <div className="flex items-center gap-3 w-full border-t pt-4 border-zinc-500/10">
              <input type="text" value={uninstallerSearch} onChange={(e) => setUninstallerSearch(e.target.value)} placeholder={t('uninsSearch')} className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold focus:border-red-500 focus:outline-none ${c_bgInput}`} />
              <button onClick={loadSystemApps} disabled={isScanningApps} className={`text-xs font-bold px-5 py-3.5 rounded-xl border shrink-0 ${c_btnSec}`}>{isScanningApps ? t('uninsScanning') : t('uninsRescan')}</button>
            </div>
            <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium">
              <table className="w-full text-left border-collapse table-fixed">
                <thead><tr className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} border-b font-bold text-zinc-400`}><th className="p-3 w-1/3">{t('uninsCol1')}</th><th className="p-3 w-1/4">{t('uninsCol2')}</th><th className="p-3 w-1/6 text-center">{t('uninsCol3')}</th><th className="p-3 w-1/6 text-center">{t('uninsCol4')}</th></tr></thead>
                <tbody>
                  {isScanningApps ? (<tr><td colSpan={4} className="p-20 text-center text-red-500 text-sm font-bold animate-pulse">{t('uninsWait')}</td></tr>) : filteredApps.length === 0 ? (<tr><td colSpan={4} className="p-10 text-center text-zinc-400 font-semibold">{t('uninsEmpty')}</td></tr>) : filteredApps.map((appInfo, idx) => (
                    <tr key={idx} className={`border-b ${isDark ? 'border-zinc-900/50 hover:bg-zinc-900/40' : 'border-zinc-200/50 hover:bg-zinc-50'}`}>
                      <td className="p-3 font-bold truncate text-red-500 flex items-center gap-2"><span>📱</span> <span className="truncate">{appInfo.name}</span></td>
                      <td className="p-3 truncate text-zinc-400" title={appInfo.path}>{appInfo.publisher || t('uninsUnknown')}</td>
                      <td className="p-3 text-center text-zinc-500 font-semibold">{appInfo.version || "---"}</td>
                      <td className="p-3 text-center"><button onClick={() => handleCleanUninstall(appInfo)} className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer active:scale-95">{platform === 'darwin' ? t('uninsBtnMac') : t('uninsBtnWin')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. TAB: DỌN RÁC HỆ THỐNG CACHE TRÍ TUỆ NHÂN TẠO */}
        {activeTab === 'cleaner' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-hidden ${c_bgPanel}`}>
            <div className="flex justify-between items-start">
              <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('cleanerTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('cleanerSub')}</p></div>
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 font-bold px-5 py-2.5 rounded-xl text-sm">{t('cleanerTotal', { size: formatBytes(totalJunkBytes) })}</div>
            </div>
            <div className="flex gap-4 border-t pt-4 border-zinc-500/10 shrink-0">
              <button onClick={handleScanJunkFiles} disabled={isScanningJunk} className={`flex-1 py-4 rounded-xl font-bold text-base border cursor-pointer transition-all ${c_btnSec} disabled:opacity-40`}>{isScanningJunk ? t('cleanerScanWait') : t('cleanerScanBtn')}</button>
              <button onClick={handleExecuteCleanJunk} disabled={isScanningJunk || selectedJunkIds.length === 0 || totalJunkBytes === 0} className="bg-red-600 hover:bg-red-500 text-white font-bold text-base px-12 py-4 rounded-xl transition-all disabled:bg-zinc-600 shrink-0 cursor-pointer">{t('cleanerCleanBtn')}</button>
            </div>
            <div className="flex-1 overflow-y-auto border border-zinc-500/10 rounded-2xl w-full text-xs font-medium">
              <div className="grid grid-cols-1 divide-y divide-zinc-500/10">
                {isScanningJunk && (junkList || []).length === 0 ? (<div className="p-20 text-center text-red-500 text-base font-bold animate-pulse">{t('cleanerScanning')}</div>) : (junkList || []).length === 0 ? (<div className="p-16 text-center text-zinc-400 font-semibold">{t('cleanerEmpty')}</div>) : (junkList || []).map((junk) => {
                  const isChecked = selectedJunkIds.includes(junk.id); return (
                    <div key={junk.id} onClick={() => !isScanningJunk && setSelectedJunkIds(isChecked ? selectedJunkIds.filter(id => id !== junk.id) : [...selectedJunkIds, junk.id])} className={`p-5 flex items-center justify-between transition-colors select-none cursor-pointer ${isChecked ? 'bg-red-500/5' : 'hover:bg-zinc-500/5'}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`w-5 h-5 border rounded flex items-center justify-center shrink-0 ${c_bgInput}`}>{isChecked && <span className="text-red-500 font-bold text-xs">✓</span>}</div>
                        <div className="flex flex-col min-w-0"><span className="font-bold text-sm text-red-500 truncate">{junk.name}</span><span className={`text-xs mt-0.5 ${c_textSub}`}>{junk.desc}</span><span className="text-[10px] text-zinc-500 truncate font-mono mt-1">{junk.path}</span></div>
                      </div>
                      <div className="text-right pl-6 shrink-0"><span className={`text-base font-bold ${junk.size > 0 ? 'text-orange-500' : 'text-zinc-500'}`}>{formatBytes(junk.size)}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 9. TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto ${c_bgPanel}`}>
            <div><h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('setMainTitle')}</h3><p className={`text-sm ${c_textSub}`}>{t('setMainSub')}</p></div>
            <div className="grid grid-cols-2 gap-8 w-full border-t pt-6 border-zinc-500/10">
              <div className="flex flex-col gap-3"><label className="text-sm font-semibold flex items-center gap-2">🌐 {t('setLangLabel')}</label><div className="grid grid-cols-2 gap-3 w-full"><button onClick={() => setLanguage('vi')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${language === 'vi' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>🇻🇳 Tiếng Việt</button><button onClick={() => setLanguage('en')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${language === 'en' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>🇺🇸 English</button></div></div>
              <div className="flex flex-col gap-3"><label className="text-sm font-semibold flex items-center gap-2">🎨 {t('setThemeLabel')}</label><div className="flex flex-col gap-2.5 w-full"><button onClick={() => setThemeSetting('dark')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'dark' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeDark')}</span>{themeSetting === 'dark' && <span className="text-white">✓</span>}</button><button onClick={() => setThemeSetting('light')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'light' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeLight')}</span>{themeSetting === 'light' && <span className="text-white">✓</span>}</button><button onClick={() => setThemeSetting('system')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${themeSetting === 'system' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}><span>{t('themeSystem')}</span>{themeSetting === 'system' && <span className="text-white">✓</span>}</button></div></div>
              <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1"><label className="text-sm font-bold flex items-center gap-2">🔑 Groq API Key (Whisper Sub AI):</label><input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="gsk_..." className={`w-full border rounded-xl px-4 py-2 text-xs font-semibold focus:border-red-500 focus:outline-none ${c_bgInput}`} /></div>
              <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1"><label className="text-sm font-bold flex items-center gap-2">🔑 ElevenLabs API Key (Giọng đọc AI):</label><input type="password" value={elevenKey} onChange={(e) => setElevenKey(e.target.value)} placeholder="..." className={`w-full border rounded-xl px-4 py-2 text-xs font-semibold focus:border-red-500 focus:outline-none ${c_bgInput}`} /></div>
            </div>
            <div className={`mt-auto border-t p-4 flex justify-between text-xs font-bold ${c_borderT} ${c_textSub}`}><span>Product License: OpenSource Commercial</span><span>Platform Engine: Node.js Electron & Tailwind v3</span></div>
          </div>
        )}
      </main>

      {/* ====================================================================
      [POPUP MỚI] GIAO DIỆN GIỚI THIỆU CHỨC NĂNG (ONBOARDING)
      ==================================================================== */}
      {introModal && FEATURE_INTROS[introModal] && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm transition-all">
          <div className={`w-[500px] p-8 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-5`}>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-6xl mb-2">{FEATURE_INTROS[introModal].icon}</span>
              <h3 className="text-2xl font-bold text-red-500">{FEATURE_INTROS[introModal].title}</h3>
              <p className={`text-sm font-medium leading-relaxed px-2 ${isDark ? 'text-gray-300' : 'text-zinc-600'}`}>
                {FEATURE_INTROS[introModal].desc}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-500/10 flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer select-none group">
                <input type="checkbox" checked={dontShowIntroAgain} onChange={(e) => setDontShowIntroAgain(e.target.checked)} className="hidden" />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all group-hover:border-red-500 ${isDark ? 'bg-[#0a0a0a] border-[#333]' : 'bg-zinc-50 border-zinc-300'}`}>
                  {dontShowIntroAgain && <span className="text-red-500 font-bold text-xs">✓</span>}
                </div>
                <span className={`text-sm font-semibold ${c_textSub} group-hover:text-red-500 transition-colors`}>{t('introIgnore')}</span>
              </label>

              <button onClick={closeIntroModal} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl text-sm shadow-md cursor-pointer transition-transform active:scale-95">{t('introStart')}</button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP HÀNG ĐỢI CÀI FFMPEG NGẦM TRÊN MAC */}
      {ffmpegInstallMsg?.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm transition-all">
          <div className={`w-[500px] p-8 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-5 text-center`}>
            <span className="text-5xl animate-spin mb-2">⚙️</span>
            <h3 className="text-xl font-bold text-red-500">Đang Tự Động Nâng Cấp Lõi Hệ Thống</h3>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-zinc-600'}`}>
              Hệ thống phát hiện máy Mac của bạn chưa có lõi xử lý FFmpeg bản quyền. <br/>Vui lòng giữ nguyên cửa sổ để phần mềm tự động cài đặt ngầm.
            </p>
            <div className="mt-4 w-full">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-red-500 animate-pulse">{ffmpegInstallMsg.msg}</span>
                <span className="text-red-500 font-bold">{ffmpegInstallMsg.percent}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${c_bgInput}`}>
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${ffmpegInstallMsg.percent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP WINDOW MODAL CHÍNH CHỦ */}
      {customModal?.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-all backdrop-blur-xs">
          <div className={`w-[480px] p-7 rounded-3xl border ${isDark ? 'bg-[#171717] border-[#262626]' : 'bg-white border-zinc-200'} shadow-2xl relative flex flex-col gap-4`}>
            <button onClick={() => setCustomModal(null)} className={`absolute top-5 right-5 text-lg font-bold select-none cursor-pointer ${c_textSub} hover:text-red-500`}>✕</button>
            <div className="flex items-center gap-2 border-b pb-3 border-zinc-500/10"><span className="text-xl">🔔</span><h4 className="text-lg font-bold text-red-500 tracking-wide">{customModal.title}</h4></div>
            <p className={`text-base font-semibold py-2 leading-relaxed ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{customModal.message}</p>
            <button onClick={() => setCustomModal(null)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl text-sm shadow-md cursor-pointer">{t('modalConfirm')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App