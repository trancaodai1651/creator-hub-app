/* eslint-disable */
import { useState } from 'react'

export interface VideoMetadata {
  title: string
  description: string
  hashtags: string
}

export function usePublisher(t: any, setCustomModal: any) {
  const [videoFile, setVideoFile] = useState<{ name: string; size: string; path: string } | null>(null)
  const [metadata, setMetadata] = useState<VideoMetadata>({ title: '', description: '', hashtags: '' })
  const [platforms, setPlatforms] = useState({ youtube: true, tiktok: false, facebook: false })
  const [isPublishing, setIsPublishing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // Xử lý nạp video thông qua hộp thoại Native chính chủ của OS
  const handleImportVideo = async () => {
    try {
      const fileData = await (window as any).electron.ipcRenderer.invoke('select-video-file')
      if (!fileData) return // Người dùng bấm hủy không chọn nữa

      // fileData nhận về sẽ có cấu trúc: { name, size, path }
      setVideoFile(fileData)

      // Tự động lấy tên file làm tiêu đề nháp
      const fileNameWithoutExt = fileData.name.substring(0, fileData.name.lastIndexOf('.')) || fileData.name
      setMetadata(prev => ({ ...prev, title: fileNameWithoutExt }))
    } catch (err: any) {
      setCustomModal({ show: true, title: "❌ LỖI CHỌN FILE", message: err.message })
    }
  }

  const togglePlatform = (key: 'youtube' | 'tiktok' | 'facebook') => {
    setPlatforms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSetupAccount = async (platform: string) => {
    setLogs([`Mở trình duyệt để thiết lập tài khoản ${platform}... Vui lòng đăng nhập và tự tắt trình duyệt khi xong.`])
    await (window as any).electron.ipcRenderer.invoke('setup-publisher-account', platform)
  }

  const handlePublish = async () => {
    if (!videoFile) {
      setCustomModal({ show: true, title: "⚠️ THIẾU TỆP TIN", message: "Vui lòng chọn một file video MP4 trước khi đăng." })
      return
    }
    if (!metadata.title.trim()) {
      setCustomModal({ show: true, title: "⚠️ THIẾU TIÊU ĐỀ", message: "Tiêu đề video không được để trống." })
      return
    }

    const targetPlatforms = Object.keys(platforms).filter(k => (platforms as any)[k])
    if (targetPlatforms.length === 0) {
      setCustomModal({ show: true, title: "⚠️ THIẾU NỀN TẢNG", message: "Vui lòng chọn ít nhất 1 nền tảng để đăng bài." })
      return
    }

    setIsPublishing(true)
    setLogs([`🚀 Khởi động trạm phát hành tự động...`])

    try {
      // Đăng ký cổng lắng nghe Log liên tục bắn ngược từ Puppeteer Backend lên giao diện
      (window as any).electron.ipcRenderer.on('publisher-log-reply', (_e: any, message: string) => {
        setLogs(prev => [...prev, message])
      })

      // Gọi lệnh xuống Main Process kích hoạt trình duyệt ảo Puppeteer
      const res = await (window as any).electron.ipcRenderer.invoke('trigger-puppeteer-publish', {
        videoPath: videoFile.path,
        metadata,
        platforms
      })

      if (res.success) {
        setLogs(prev => [...prev, `🟢 [HOÀN TẤT] Tất cả video đã được đăng tải thành công!`])
      } else {
        throw new Error(res.error)
      }
    } catch (error: any) {
      setLogs(prev => [...prev, `❌ [THẤT BẠI] Lỗi: ${error.message}`])
      setCustomModal({ show: true, title: "❌ LỖI VẬN HÀNH TOOL", message: error.message })
    } finally {
      setIsPublishing(false)
      // Tắt cổng lắng nghe log khi kết thúc luồng bằng cách ép kiểu an toàn
      const ipc = (window as any).electron.ipcRenderer;
      if (ipc && typeof ipc.removeAllListeners === 'function') {
        ipc.removeAllListeners('publisher-log-reply');
      }
    }
  }

  return {
    videoFile, metadata, setMetadata, platforms, togglePlatform,
    isPublishing, logs, handleImportVideo, handlePublish, handleSetupAccount, removeVideo: () => setVideoFile(null)
  }
}
