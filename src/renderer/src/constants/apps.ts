/* eslint-disable */
export interface SystemApp { name: string; path: string; version: string; publisher: string }
export interface JunkItem { id: string; name: string; desc: string; size: number; path: string }

export const AVAILABLE_APPS = [
  { id: 'Google.Chrome', macId: 'google-chrome', name: 'Google Chrome', icon: '🌐' },
  { id: 'Bytedance.CapCut', macId: 'capcut', name: 'CapCut Editor', icon: '🎬' },
  { id: 'OBSProject.OBSStudio', macId: 'obs', name: 'OBS Studio', icon: '🎥' },
  { id: 'Microsoft.VisualStudioCode', macId: 'visual-studio-code', name: 'VS Code', icon: '💻' },
  { id: 'VideoLAN.VLC', macId: 'vlc', name: 'VLC Player', icon: '🎵' },
  { id: 'WinRAR.WinRAR', macId: 'the-unarchiver', name: 'The Unarchiver (Mac)', icon: '📦' },
  { id: 'Discord.Discord', macId: 'discord', name: 'Discord', icon: '💬' },
  { id: 'EpicGames.EpicGamesLauncher', macId: 'epic-games', name: 'Epic Games', icon: '🎮' }
]