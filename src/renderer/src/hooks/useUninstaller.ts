/* eslint-disable */
import { useState, useEffect } from 'react'

export function useUninstaller(t: any, setCustomModal: any, activeTab: string, joiner?: any) {
  const [systemApps, setSystemApps] = useState<any[]>([])
  const [uninstallerSearch, setUninstallerSearch] = useState('')
  const [isScanningApps, setIsScanningApps] = useState(false)
  const [uninstallConfirm, setUninstallConfirm] = useState<{ show: boolean; appInfo: any; mode: 'clean' | 'basic' } | null>(null)
  const [uninsProgress, setUninsProgress] = useState<{ show: boolean; msg: string; percent: number } | null>(null)

  const loadSystemApps = async () => {
    setIsScanningApps(true)
    try { 
      const apps = await window.electron.ipcRenderer.invoke('get-system-installed-apps')
      setSystemApps(apps) 
    } catch (e) { console.error(e) } finally { setIsScanningApps(false) }
  }

  useEffect(() => {
    if (activeTab === 'uninstaller') { setTimeout(() => loadSystemApps(), 0) }
  }, [activeTab])

  const handleCleanUninstall = (appInfo: any) => {
    setUninstallConfirm({ show: true, appInfo, mode: 'clean' })
  }

  // LỆNH ĐÓNG BẢNG (DẤU X)
  const handleCancelProgress = () => {
    window.electron.ipcRenderer.send('uninstaller-action', { action: 'abort' })
    setUninsProgress(null)
  }

  // LỆNH ÉP ĐI TIẾP KHI BỊ KẸT
  const handleForceContinue = () => {
    window.electron.ipcRenderer.send('uninstaller-action', { action: 'continue' })
  }

  const confirmAndExecuteUninstall = async () => {
    if (!uninstallConfirm || !uninstallConfirm.appInfo) return
    const { appInfo, mode } = uninstallConfirm
    setUninstallConfirm(null)

    setUninsProgress({ show: true, percent: 10, msg: t('uninsPrep') || 'Đang kết nối luồng gỡ...' })

    const progressListener = (_e: any, data: any) => {
      setUninsProgress({ show: true, percent: data.percent, msg: data.message })
    }
    window.electron.ipcRenderer.on('uninstall-step-progress', progressListener)

    try {
      const response = await window.electron.ipcRenderer.invoke('execute-clean-uninstall', { appPath: appInfo.path, appName: appInfo.name, mode })
      
      // Nếu bấm dấu X thì im lặng không hiện thông báo
      if (!response.aborted) {
        if (response.success) {
          setCustomModal({ show: true, title: t('uninsTitle') || 'Thông Báo', message: response.message })
        } else {
          setCustomModal({ show: true, title: "LỖI GỠ CÀI ĐẶT", message: response.message })
        }
      }
    } catch (err: any) { 
      setCustomModal({ show: true, title: "ERROR", message: err.message }) 
    } finally { 
      window.electron.ipcRenderer.removeListener('uninstall-step-progress', progressListener)
      setUninsProgress(null)
      loadSystemApps()
    }
  }

  return { systemApps, uninstallerSearch, setUninstallerSearch, isScanningApps, loadSystemApps, handleCleanUninstall, uninstallConfirm, setUninstallConfirm, confirmAndExecuteUninstall, uninsProgress, handleCancelProgress, handleForceContinue }
}