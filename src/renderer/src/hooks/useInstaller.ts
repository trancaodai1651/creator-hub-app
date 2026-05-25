/* eslint-disable */
import { useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

export function useInstaller(t: any, setCustomModal: any) {
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const [isInstalling, setIsInstalling] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [installProgress, setInstallProgress] = useState({ appIndex: 0, totalApps: 0, appName: '', stage: '', stagePercent: 0, globalPercent: 0 })

  const handleSearchAppOnline = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results: any = await tauriApi.invoke('search-apps', { query: searchQuery })
      setSearchResults(results)
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: String(err) }) } 
    finally { setIsSearching(false) }
  }

  const handleLaunchInstallation = async () => {
    if (selectedApps.length === 0) { alert(t('insAlertZero')); return }
    setIsInstalling(true)
    setInstallProgress({ appIndex: 1, totalApps: selectedApps.length, appName: '', stage: 'Khởi động', stagePercent: 0, globalPercent: 0 })
    
    const unlisten = await tauriApi.on('install-apps-progress', (data: any) => {
      if (data.message === 'Hoàn thành!' || data.message === 'Completed!') {
        setInstallProgress(prev => ({ ...prev, globalPercent: 100, stagePercent: 100, stage: 'Hoàn thành' }))
      } else { setInstallProgress(data) }
    })

    try {
      const response: any = await tauriApi.invoke('install-selected-apps', { appIds: selectedApps })
      setCustomModal({ show: true, title: t('insTitle'), message: response.message })
      if (response.success) { setSelectedApps([]); setSearchResults([]); setSearchQuery('') }
    } catch (error: any) { setCustomModal({ show: true, title: "ERROR", message: String(error) }) } 
    finally { setIsInstalling(false); if (unlisten) unlisten(); }
  }

  const toggleAppSelection = (appId: string) => {
    if (selectedApps.includes(appId)) setSelectedApps(selectedApps.filter(id => id !== appId))
    else setSelectedApps([...selectedApps, appId])
  }

  return { selectedApps, setSelectedApps, isInstalling, searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching, installProgress, handleSearchAppOnline, handleLaunchInstallation, toggleAppSelection }
}