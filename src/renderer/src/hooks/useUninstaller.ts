/* eslint-disable */
import { useState, useEffect } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

export function useUninstaller(t: any, setCustomModal: any, activeTab: string) {
  const [systemApps, setSystemApps] = useState<any[]>([])
  const [uninstallerSearch, setUninstallerSearch] = useState('')
  const [isScanningApps, setIsScanningApps] = useState(false)
  const [uninstallConfirm, setUninstallConfirm] = useState<{ show: boolean; appInfo: any; mode: 'clean' | 'basic' } | null>(null)
  const [uninsProgress, setUninsProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)

  const loadSystemApps = async () => {
    setIsScanningApps(true)
    try { 
      const apps: any = await tauriApi.invoke('get-system-installed-apps')
      setSystemApps(apps) 
    } catch (e) { console.error(e) } finally { setIsScanningApps(false) }
  }

  useEffect(() => { if (activeTab === 'uninstaller') setTimeout(() => loadSystemApps(), 0) }, [activeTab])

  const handleCleanUninstall = (appInfo: any) => setUninstallConfirm({ show: true, appInfo, mode: 'clean' })

  const handleCancelProgress = () => { tauriApi.invoke('uninstaller-action', { action: 'abort' }); setUninsProgress(null) }
  const handleForceContinue = () => { tauriApi.invoke('uninstaller-action', { action: 'continue' }) }

  const confirmAndExecuteUninstall = async () => {
    if (!uninstallConfirm || !uninstallConfirm.appInfo) return
    const { appInfo, mode } = uninstallConfirm
    setUninstallConfirm(null)
    setUninsProgress({ show: true, percent: 10, msg: t('uninsPrep') || 'Đang kết nối luồng gỡ...' })

    const unlisten = await tauriApi.on('uninstall-step-progress', (data: any) => {
      setUninsProgress({ show: true, percent: data.percent, msg: data.message })
    })

    try {
      const response: any = await tauriApi.invoke('execute-clean-uninstall', { appPath: appInfo.path, appName: appInfo.name, mode })
      if (!response.aborted) {
        if (response.success) setCustomModal({ show: true, title: t('uninsTitle') || 'Thông Báo', message: response.message })
        else setCustomModal({ show: true, title: "LỖI GỠ CÀI ĐẶT", message: response.message })
      }
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: String(err) }) } 
    finally { if (unlisten) unlisten(); setUninsProgress(null); loadSystemApps() }
  }

  return { systemApps, uninstallerSearch, setUninstallerSearch, isScanningApps, loadSystemApps, handleCleanUninstall, uninstallConfirm, setUninstallConfirm, confirmAndExecuteUninstall, uninsProgress, handleCancelProgress, handleForceContinue }
}