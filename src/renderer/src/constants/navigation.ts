/* eslint-disable */
export interface TabItem {
  id: string
  nameKey: string
  descKey: string
  icon: string
  isWip?: boolean
}

export const SIDEBAR_TABS: TabItem[] = [
  { id: 'home', nameKey: 'dashboard', descKey: '', icon: '\u{1F3E0}' },
  { id: 'joiner', nameKey: 'videoJoiner', descKey: 'descJoiner', icon: '\u{1F3AC}', isWip: false },
  { id: 'highlight', nameKey: 'highlightCutter', descKey: 'descHighlight', icon: '\u{2702}\u{FE0F}', isWip: false },
  { id: 'downloader', nameKey: 'videoDownloader', descKey: 'descDownloader', icon: '\u{1F4E5}', isWip: false },
  { id: 'publisher', nameKey: 'pubTitle', descKey: 'pubSub', icon: '\u{1F680}', isWip: true },
  { id: 'converter', nameKey: 'fileConverter', descKey: 'descConverter', icon: '\u{26A1}', isWip: true },
  { id: 'tts', nameKey: 'appTts', descKey: 'descTts', icon: '\u{1F5E3}\u{FE0F}', isWip: true },
  { id: 'renamer', nameKey: 'fileRenamer', descKey: 'descRenamer', icon: '\u{1F5C2}\u{FE0F}', isWip: true },
  { id: 'installer', nameKey: 'appInstaller', descKey: 'descInstaller', icon: '\u{1F6E0}\u{FE0F}', isWip: true },
  { id: 'uninstaller', nameKey: 'uninstaller', descKey: 'descUninstaller', icon: '\u{274C}', isWip: true },
  { id: 'cleaner', nameKey: 'cleaner', descKey: 'descCleaner', icon: '\u{1F9F9}', isWip: true },
  { id: 'chatbot', icon: '\u{1F916}', nameKey: 'tabChatbot', descKey: 'descChatbot', isWip: true },
  { id: 'guide', icon: '\u{1F4DA}', nameKey: 'tabGuide', descKey: 'descGuide', isWip: false }
]
