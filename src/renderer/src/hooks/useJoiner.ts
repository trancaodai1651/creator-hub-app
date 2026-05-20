/* eslint-disable */
import { useState } from 'react'

export function useJoiner(t: (key: string) => string, setCustomModal: (modal: any) => void) {
  const [videoList, setVideoList] = useState<string[]>([]) 
  const [minTime, setMinTime] = useState<number>(60)
  const [maxTime, setMaxTime] = useState<number>(70)
  const [requirePillar, setRequirePillar] = useState<boolean>(true)
  const [useGpu, setUseGpu] = useState<boolean>(true) 
  const [outputFolder, setOutputFolder] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const [logoPosition, setLogoPosition] = useState<string>('top-right')
  const [logoSize, setLogoSize] = useState<number>(200) 
  const [joinRatio, setJoinRatio] = useState<string>('original')

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  const scanDirectory = async (folderPath: string) => {
    if (!folderPath) return
    try { 
      const result = await window.electron.ipcRenderer.invoke('scan-folder', folderPath) 
      result.sort((a: string, b: string) => {
        const getFileName = (p: string) => p.split(/[/\\]/).pop()?.toLowerCase() || ''
        return getFileName(a).localeCompare(getFileName(b))
      })
      setVideoList(result)
    } catch (error) { console.error(error) }
  }

  const handleStartProcess = async () => {
    if (videoList.length === 0) { alert(t('alertChooseFolder')); return }
    setIsProcessing(true); setIsPaused(false); setProgressPercent(0); setProgressMsg(t('processing'))
    
    window.electron.ipcRenderer.on('join-progress', (_event: any, data: any) => {
      setProgressMsg(data.message)
      setProgressPercent(data.percent)
      if (data.message.includes('[TAM DUNG]')) setIsPaused(true)
    })

    try {
      const response = await window.electron.ipcRenderer.invoke('start-joining', { videoPaths: videoList, minMins: Number(minTime), maxMins: Number(maxTime), requirePillar, outputDir: outputFolder, logoPath, logoPosition, logoSize, ratio: joinRatio, useGpu })
      setCustomModal({ show: true, title: t('joinTitle'), message: response.message })
    } catch (error: any) { 
      setCustomModal({ show: true, title: "ERROR", message: error.message }) 
    } finally {
      setIsProcessing(false); setIsPaused(false); window.electron.ipcRenderer.removeAllListeners('join-progress')
    }
  }

  const handlePauseToggle = async () => {
    if (isPaused) { await window.electron.ipcRenderer.invoke('resume-joining'); setIsPaused(false) } 
    else { await window.electron.ipcRenderer.invoke('pause-joining'); setIsPaused(true); setProgressMsg('[PAUSED]... ') }
  }

  const handleCancel = async () => {
    if (confirm(t('alertConfirmCancel'))) { await window.electron.ipcRenderer.invoke('cancel-joining'); setIsProcessing(false); setIsPaused(false) }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      // Ép kiểu (window as any) để vá lỗi thuộc tính api cực nhanh
      let folderPath = (files[0] as any).path || (window as any).api?.getPath?.(files[0])
      if (folderPath) scanDirectory(folderPath)
    }
  }

  return {
    videoList, setVideoList, minTime, setMinTime, maxTime, setMaxTime,
    requirePillar, setRequirePillar, useGpu, setUseGpu, outputFolder, setOutputFolder,
    logoPath, setLogoPath, logoPosition, setLogoPosition, logoSize, setLogoSize,
    joinRatio, setJoinRatio, isProcessing, isPaused, progressMsg, progressPercent,
    scanDirectory, handleStartProcess, handlePauseToggle, handleCancel, handleDrop
  }
}