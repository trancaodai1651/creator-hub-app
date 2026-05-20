/* eslint-disable */
export interface TabItem {
  id: string
  nameKey: string
  descKey: string
  icon: string
  isWip?: boolean // Bổ sung cờ hiệu (Dấu ? để không bắt buộc phải ghi ở thẻ Home)
}

export const SIDEBAR_TABS: TabItem[] = [
  { id: 'home', nameKey: 'dashboard', descKey: '', icon: '🏠' },
  
  // ==========================================
  // 🟢 CÁC TÍNH NĂNG ĐÃ HOÀN THIỆN (Sẵn sàng dùng)
  // ==========================================
  { id: 'joiner', nameKey: 'videoJoiner', descKey: 'descJoiner', icon: '🎬', isWip: false },
  { id: 'downloader', nameKey: 'videoDownloader', descKey: 'descDownloader', icon: '📥', isWip: false },

  // ==========================================
  // 🟠 CÁC TÍNH NĂNG ĐANG PHÁT TRIỂN (Hiện huy hiệu DEV)
  // ==========================================
  { id: 'converter', nameKey: 'fileConverter', descKey: 'descConverter', icon: '⚡', isWip: true },
  { id: 'tts', nameKey: 'appTts', descKey: 'descTts', icon: '🗣️', isWip: true },
  { id: 'renamer', nameKey: 'fileRenamer', descKey: 'descRenamer', icon: '🗂️', isWip: true },
  { id: 'installer', nameKey: 'appInstaller', descKey: 'descInstaller', icon: '🛠️', isWip: true },
  { id: 'uninstaller', nameKey: 'uninstaller', descKey: 'descUninstaller', icon: '❌', isWip: true },
  { id: 'cleaner', nameKey: 'cleaner', descKey: 'descCleaner', icon: '🧹', isWip: true }
]