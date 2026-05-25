/* eslint-disable */
import { useState, useEffect } from 'react'
import { useVideoQueue } from './useVideoQueue'
import { tauriApi } from '../utils/tauriAdapter'

export function usePublisher(setCustomModal: any) {
  const { videoQueue, selectedVideoId, setSelectedVideoId, addVideosFromNative, updateMetadata, updateStatus, removeVideo, resetAllStatuses } = useVideoQueue()
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [logs, setLogs] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<any>({ youtube: false, tiktok: true, facebook: false })
  const [publishMode, setPublishMode] = useState<'publish' | 'draft'>('publish')

  const togglePlatform = (id: string) => setPlatforms((prev: any) => ({ ...prev, [id]: !prev[id] }))

  useEffect(() => {
    let unlisten: () => void;
    const setupListener = async () => {
      unlisten = await tauriApi.on('publisher-log-reply', (msg: string) => setLogs(prev => [...prev, msg]))
    }
    setupListener()
    return () => { if (unlisten) unlisten() }
  }, [])

  const handleImportVideo = async () => {
    try {
      const result: any = await tauriApi.invoke('select-multiple-videos')
      if (result && result.length > 0) {
        addVideosFromNative(result)
        setLogs(prev => [...prev, `✅ Đã nạp thành công ${result.length} video vào hàng chờ.`])
      }
    } catch (err: any) {
      setCustomModal({ show: true, title: "LỖI NẠP VIDEO", message: String(err) })
    }
  }

  const handleSetupAccount = async (platformId: string) => {
    try {
      setLogs(prev => [...prev, `\n⚙️ Đang mở cài đặt nền tảng: ${platformId.toUpperCase()}...`])
      await tauriApi.invoke('setup-publisher-account', { platformId })
      setLogs(prev => [...prev, `✅ Đã đóng cài đặt.`])
    } catch (error: any) { setLogs(prev => [...prev, `❌ Lỗi: ${String(error)}`]) }
  }

  const handlePublishSingle = async (id: string, currentMode?: 'publish' | 'draft') => {
    if (isPublishing) return
    const task = videoQueue.find(v => v.id === id)
    if (!task) return
    if (!task.metadata.title?.trim()) { setCustomModal({ show: true, title: "⚠️ THIẾU TIÊU ĐỀ", message: "Vui lòng điền tiêu đề!" }); return }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) { setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Vui lòng chọn nền tảng!" }); return }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    setLogs([`🚀 BẮT ĐẦU ĐĂNG ĐƠN LẺ VIDEO: ${task.fileName}...`]); updateStatus(task.id, 'processing')

    try {
      const response: any = await tauriApi.invoke('trigger-puppeteer-publish', { videoPath: task.filePath, metadata: task.metadata, platforms, publishMode: activeMode })
      if (response && response.success) {
        updateStatus(task.id, 'success'); setLogs(prev => [...prev, `🟢 ĐÃ ĐĂNG THÀNH CÔNG: ${task.fileName}`])
        setCustomModal({ show: true, title: "🎉 THÀNH CÔNG!", message: `Video "${task.metadata.title}" đã đăng xong.` })
      } else {
        updateStatus(task.id, 'error'); setCustomModal({ show: true, title: "❌ THẤT BẠI", message: response.error || "Gặp sự cố." })
      }
    } catch (err: any) { updateStatus(task.id, 'error'); setLogs(prev => [...prev, `❌ Lỗi: ${String(err)}`]) } 
    finally { setIsPublishing(false) }
  }

  const handlePublish = async (currentMode?: 'publish' | 'draft') => {
    const tasksToRun = videoQueue.filter(v => v.status !== 'success')
    if (tasksToRun.length === 0) { setCustomModal({ show: true, title: "⚠️ HÀNG CHỜ TRỐNG", message: "Chưa có video!" }); return }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) { setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Chọn ít nhất 1 nền tảng!" }); return }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    setLogs([`🚀 KHỞI ĐỘNG TIẾN TRÌNH AUTOMATION (${tasksToRun.length} VIDEO)...`])
    let successCount = 0

    for (const task of tasksToRun) {
      setLogs(prev => [...prev, `\n=========================================`, `🔄 ĐANG TỰ ĐỘNG ĐĂNG FILE: ${task.fileName}`])
      updateStatus(task.id, 'processing')
      if (!task.metadata.title?.trim()) { setLogs(prev => [...prev, `❌ Bỏ qua vì chưa nhập Tiêu đề!`]); updateStatus(task.id, 'error'); continue }

      try {
        const response: any = await tauriApi.invoke('trigger-puppeteer-publish', { videoPath: task.filePath, metadata: task.metadata, platforms, publishMode: activeMode })
        if (response && response.success) { successCount++; updateStatus(task.id, 'success'); setLogs(prev => [...prev, `✅ Thành công: ${task.fileName}`]) } 
        else { updateStatus(task.id, 'error'); setLogs(prev => [...prev, `❌ Thất bại: ${response.error}`]) }
      } catch (err: any) { updateStatus(task.id, 'error') }
      await new Promise(r => setTimeout(r, 2000))
    }
    setIsPublishing(false)
    setCustomModal({ show: true, title: "🎉 HOÀN TẤT CHUỖI AUTOMATION!", message: `Đăng thành công: ${successCount} / ${tasksToRun.length} video.` })
  }

  return { videoQueue, selectedVideoId, setSelectedVideoId, updateMetadata, removeVideo, logs, isPublishing, loading: isPublishing, platforms, togglePlatform, publishMode, setPublishMode, handleSetupAccount, handleImportVideo, handlePublish, handlePublishSingle, resetAllStatuses }
}