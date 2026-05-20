/* eslint-disable */
import { useState } from 'react'

export function useDownloader(t: any, setCustomModal: any) {
  const [downloadUrl, setDownloadUrl] = useState('')
  const [downloadFolder, setDownloadFolder] = useState('')
  const [dlResolution, setDlResolution] = useState('best')
  const [isDownloading, setIsDownloading] = useState(false)
  const [dlMsg, setDlMsg] = useState('')
  const [dlPercent, setDlPercent] = useState(0)
  const [dlStart, setDlStart] = useState('')
  const [dlEnd, setDlEnd] = useState('')

  const handleDownloadVideo = async () => {
    if (!downloadUrl.trim()) { alert(t('alertChooseUrl')); return }
    setIsDownloading(true); setDlPercent(0); setDlMsg(t('downloading'))
    window.electron.ipcRenderer.on('download-progress', (_e: any, data: any) => {
      setDlMsg(data.message); setDlPercent(data.percent)
    })
    try {
      const response = await window.electron.ipcRenderer.invoke('download-video', { url: downloadUrl, saveDir: downloadFolder, resolution: dlResolution, startTime: dlStart, endTime: dlEnd })
      setCustomModal({ show: true, title: t('dlTitle'), message: response.message })
      if (response.success) { setDownloadUrl(''); setDlStart(''); setDlEnd('') } 
    } catch (error: any) {
      setCustomModal({ show: true, title: "ERROR", message: error.message })
    } finally {
      setIsDownloading(false); window.electron.ipcRenderer.removeAllListeners('download-progress')
    }
  }

  return {
    downloadUrl, setDownloadUrl, downloadFolder, setDownloadFolder, dlResolution, setDlResolution,
    isDownloading, dlMsg, dlPercent, dlStart, setDlStart, dlEnd, setDlEnd, handleDownloadVideo
  }
}