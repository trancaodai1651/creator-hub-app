/* eslint-disable */
import { useState, useEffect } from 'react'
import { useVideoQueue } from './useVideoQueue'

export function usePublisher(setCustomModal: any) {
  const {
    videoQueue, selectedVideoId, setSelectedVideoId,
    addVideosFromNative, updateMetadata, updateStatus, removeVideo, resetAllStatuses
  } = useVideoQueue()

  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [logs, setLogs] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<any>({ youtube: false, tiktok: true, facebook: false })
  const [publishMode, setPublishMode] = useState<'publish' | 'draft'>('publish')

  const togglePlatform = (id: string) => setPlatforms((prev: any) => ({ ...prev, [id]: !prev[id] }))

  useEffect(() => {
    const handleLog = (_event: any, msg: string) => setLogs((prev) => [...prev, msg])
    if ((window as any).electron?.ipcRenderer?.removeAllListeners) {
      try { ;(window as any).electron.ipcRenderer.removeAllListeners('publisher-log-reply') } catch (e) {}
    }
    ;(window as any).electron?.ipcRenderer?.on('publisher-log-reply', handleLog)
    return () => {
      if ((window as any).electron?.ipcRenderer?.removeListener) {
        ;(window as any).electron.ipcRenderer.removeListener('publisher-log-reply', handleLog)
      }
    }
  }, [])

  // =====================================================================
  // 1. GỌI CỬA SỔ CHỌN FILE NATIVE CỦA HỆ ĐIỀU HÀNH
  // =====================================================================
  const handleImportVideo = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('select-multiple-videos');
      if (result && result.length > 0) {
        addVideosFromNative(result);
        setLogs((prev) => [...prev, `✅ Đã nạp thành công ${result.length} video vào hàng chờ.`]);
      }
    } catch (err: any) {
      // 🚀 BẪY LỖI NẾU BẠN QUÊN RESTART APP
      setCustomModal({ 
        show: true, 
        title: "❌ CHƯA KHỞI ĐỘNG LẠI APP", 
        message: "Hệ thống chưa nhận diện được cổng chọn file mới.\n\nVui lòng TẮT HOÀN TOÀN Terminal hiện tại (ấn Ctrl + C), sau đó gõ lại lệnh 'npm run dev' để khởi động lại nhé!" 
      });
    }
  }

  const handleSetupAccount = async (platformId: string) => {
    try {
      setLogs((prev) => [...prev, `\n⚙️ Đang mở trình duyệt cài đặt nền tảng: ${platformId.toUpperCase()}...`])
      await (window as any).electron.ipcRenderer.invoke('setup-publisher-account', platformId)
      setLogs((prev) => [...prev, `✅ Đã đóng trình duyệt cài đặt.`])
    } catch (error: any) {
      setLogs((prev) => [...prev, `❌ Lỗi khi mở cài đặt: ${error.message}`])
    }
  }

  // =====================================================================
  // 2. HÀM ĐĂNG ĐƠN LẺ CHO 1 VIDEO ĐANG ĐƯỢC CLICK CHỌN
  // =====================================================================
  const handlePublishSingle = async (id: string, currentMode?: 'publish' | 'draft') => {
    if (isPublishing) return;
    const task = videoQueue.find(v => v.id === id);
    if (!task) return;

    if (!task.metadata.title?.trim()) {
      setCustomModal({ show: true, title: "⚠️ THIẾU TIÊU ĐỀ", message: "Vui lòng điền tiêu đề cho video này!" });
      return;
    }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) {
      setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Vui lòng tích chọn nền tảng ở cột bên phải!" });
      return;
    }

    setIsPublishing(true);
    const activeMode = currentMode || publishMode;
    setLogs([`🚀 BẮT ĐẦU ĐĂNG ĐƠN LẺ VIDEO: ${task.fileName}...`]);
    updateStatus(task.id, 'processing');

    try {
      const response = await (window as any).electron.ipcRenderer.invoke('trigger-puppeteer-publish', {
        videoPath: task.filePath,
        metadata: task.metadata,
        platforms: platforms, // Lấy cấu hình nền tảng chung
        publishMode: activeMode
      });

      if (response && response.success) {
        updateStatus(task.id, 'success');
        setLogs((prev) => [...prev, `🟢 ĐÃ ĐĂNG THÀNH CÔNG: ${task.fileName}`]);
        setCustomModal({ show: true, title: "🎉 THÀNH CÔNG!", message: `Video "${task.metadata.title}" đã đăng xong.` });
      } else {
        updateStatus(task.id, 'error');
        setCustomModal({ show: true, title: "❌ THẤT BẠI", message: response.error || "Gặp sự cố." });
      }
    } catch (err: any) {
      updateStatus(task.id, 'error');
      setLogs((prev) => [...prev, `❌ Lỗi hệ thống: ${err.message}`]);
    } finally {
      setIsPublishing(false);
    }
  };

  // =====================================================================
  // 3. HÀM ĐĂNG HÀNG LOẠT (TỰ ĐỘNG CHẠY TUẦN TỰ)
  // =====================================================================
  const handlePublish = async (currentMode?: 'publish' | 'draft') => {
    try {
      const tasksToRun = videoQueue.filter((v) => v.status !== 'success')
      if (tasksToRun.length === 0) {
        setCustomModal({ show: true, title: "⚠️ HÀNG CHỜ TRỐNG", message: "Vui lòng bấm nút Import để thêm video!" })
        return
      }
      if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) {
        setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Vui lòng tích chọn ít nhất một Nền tảng đích!" })
        return
      }

      setIsPublishing(true)
      const activeMode = currentMode || publishMode
      setLogs([`🚀 KHỞI ĐỘNG TIẾN TRÌNH AUTOMATION (${tasksToRun.length} VIDEO)...`])
      let successCount = 0

      for (const task of tasksToRun) {
        setLogs((prev) => [...prev, `\n=========================================`])
        setLogs((prev) => [...prev, `🔄 ĐANG TỰ ĐỘNG ĐĂNG FILE: ${task.fileName}`])
        updateStatus(task.id, 'processing')

        if (!task.metadata.title?.trim()) {
          setLogs((prev) => [...prev, `❌ Bỏ qua video vì chưa nhập Tiêu đề!`])
          updateStatus(task.id, 'error')
          continue 
        }

        try {
          const response = await (window as any).electron.ipcRenderer.invoke('trigger-puppeteer-publish', {
            videoPath: task.filePath,
            metadata: task.metadata,
            platforms: platforms,
            publishMode: activeMode
          })

          if (response && response.success) {
            successCount++
            updateStatus(task.id, 'success')
            setLogs((prev) => [...prev, `✅ Thành công: ${task.fileName}`])
          } else {
            updateStatus(task.id, 'error')
            setLogs((prev) => [...prev, `❌ Thất bại: ${response.error}`])
          }
        } catch (err: any) {
          updateStatus(task.id, 'error')
        }
        await new Promise(r => setTimeout(r, 2000))
      }

      setIsPublishing(false)
      setCustomModal({
        show: true, title: "🎉 HOÀN TẤT CHUỖI AUTOMATION!",
        message: `Hệ thống đã chạy xong toàn bộ.\nĐăng thành công: ${successCount} / ${tasksToRun.length} video.`
      })
    } catch (err: any) {
      setIsPublishing(false)
    }
  }

  // 🚀 TRẢ VỀ TOÀN BỘ CÁC BIẾN & HÀM CHO GIAO DIỆN
  return {
    videoQueue, selectedVideoId, setSelectedVideoId, updateMetadata, removeVideo,
    logs, isPublishing, loading: isPublishing, platforms, togglePlatform, publishMode, setPublishMode,
    handleSetupAccount, handleImportVideo, handlePublish, handlePublishSingle, resetAllStatuses
  }
}