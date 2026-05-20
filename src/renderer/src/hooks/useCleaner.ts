/* eslint-disable */
import { useState, useEffect } from 'react'

export function useCleaner(t: any, setCustomModal: any, activeTab: string) {
  const [junkList, setJunkList] = useState<any[]>([])
  const [selectedJunkIds, setSelectedJunkIds] = useState<string[]>([])
  const [isScanningJunk, setIsScanningJunk] = useState(false)

  const handleScanJunkFiles = async () => {
    setIsScanningJunk(true)
    try {
      const data = await window.electron.ipcRenderer.invoke('scan-system-junk')
      if (data && Array.isArray(data)) { 
        setJunkList(data)
        setSelectedJunkIds(data.map((item: any) => item.id)) 
      }
    } catch (err) { console.error(err) } finally { setIsScanningJunk(false) }
  }

  useEffect(() => {
    if (activeTab === 'cleaner') handleScanJunkFiles()
  }, [activeTab])

  const handleExecuteCleanJunk = async () => {
    if (selectedJunkIds.length === 0) { alert(t('cleanerAlertZero')); return }
    const targets = (junkList || []).filter(j => selectedJunkIds.includes(j.id)).map(j => j.path)
    setIsScanningJunk(true)
    try {
      const response = await window.electron.ipcRenderer.invoke('execute-system-clean', { targets })
      setCustomModal({ show: true, title: t('cleanerTitle'), message: response.message })
      handleScanJunkFiles()
    } catch (err: any) { setCustomModal({ show: true, title: "ERROR", message: err.message }) } 
    finally { setIsScanningJunk(false) }
  }

  // THÊM MỚI 1: Hàm định dạng byte chuẩn chỉnh cho tab rác
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // THÊM MỚI 2: Tự động dồn tổng dung lượng dựa trên các mục đang được tích chọn thực tế
  const totalJunkBytes = (junkList || [])
    .filter((j: any) => selectedJunkIds.includes(j.id))
    .reduce((acc: number, curr: any) => acc + (curr.size || 0), 0)

  return { 
    junkList, selectedJunkIds, setSelectedJunkIds, isScanningJunk, 
    handleScanJunkFiles, handleExecuteCleanJunk, formatBytes, totalJunkBytes 
  }
}