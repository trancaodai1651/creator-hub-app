import { useState, useEffect } from 'react'

export function usePublisher(setCustomModal: any) {
  // 1️⃣ QUẢN LÝ DỮ LIỆU VIDEO
  const [videoFile, setVideoFile] = useState<any>(null)
  const removeVideo = () => setVideoFile(null)

  // 2️⃣ QUẢN LÝ THÔNG TIN BÀI ĐĂNG (METADATA)
  const [metadata, setMetadata] = useState<any>({ 
    title: '', 
    description: '', 
    hashtags: '' 
  })

  // 3️⃣ QUẢN LÝ TRẠNG THÁI NỀN TẢNG
  const [platforms, setPlatforms] = useState<any>({ 
    youtube: true, 
    tiktok: false, 
    facebook: false 
  })
  
  const togglePlatform = (id: string) => {
    setPlatforms((prev: any) => ({ ...prev, [id]: !prev[id] }))
  }

  // 4️⃣ QUẢN LÝ TRẠNG THÁI HỆ THỐNG VÀ LOGS
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [logs, setLogs] = useState<string[]>([])
  
  // 🚀 QUẢN LÝ CHẾ ĐỘ ĐĂNG (Công khai / Nháp)
  const [publishMode, setPublishMode] = useState<'publish' | 'draft'>('publish')

  // 🎧 Lắng nghe nhật ký (Log) từ Backend bắn lên để hiển thị ra màn hình đen
  useEffect(() => {
    const handleLog = (_event: any, msg: string) => {
      setLogs((prev) => [...prev, msg])
    }
    
    // 🚀 BẢN VÁ DỨT ĐIỂM TRÙNG LOG: Xóa sạch toàn bộ listener cũ trên kênh này trước khi đăng ký
    if ((window as any).electron.ipcRenderer.removeAllListeners) {
      try {
        ;(window as any).electron.ipcRenderer.removeAllListeners('publisher-log-reply')
      } catch (e) {
        console.log('Chưa có listener nào để xóa')
      }
    }
    
    // Đăng ký listener mới (bây giờ đảm bảo chỉ có duy nhất 1 listener hoạt động)
    ;(window as any).electron.ipcRenderer.on('publisher-log-reply', handleLog)
    
    // Dọn dẹp listener khi unmount
    return () => {
      if ((window as any).electron.ipcRenderer.removeListener) {
        ;(window as any).electron.ipcRenderer.removeListener('publisher-log-reply', handleLog)
      }
    }
  }, [])

  // =====================================================================
  // CÁC HÀM XỬ LÝ SỰ KIỆN (ACTIONS)
  // =====================================================================

  const handleImportVideo = async () => {
    try {
      const result = await (window as any).electron.ipcRenderer.invoke('select-video-file')
      if (result) {
        setVideoFile(result)
        // Tự động lấy tên file làm tiêu đề (Bỏ phần đuôi .mp4)
        if (!metadata.title) {
          setMetadata((prev: any) => ({ ...prev, title: result.name.replace(/\.[^/.]+$/, "") }))
        }
        setLogs([`✅ Đã nạp thành công video: ${result.name} (${result.size})`])
      }
    } catch (err: any) {
      setCustomModal({ show: true, title: "❌ LỖI CHỌN FILE", message: "Không thể mở hộp thoại chọn tệp tin từ hệ thống." })
    }
  }

  const handleSetupAccount = async (platformId: string) => {
    try {
      setLogs((prev) => [...prev, `\n⚙️ Đang mở trình duyệt để cài đặt nền tảng: ${platformId.toUpperCase()}...`])
      await (window as any).electron.ipcRenderer.invoke('setup-publisher-account', platformId)
      setLogs((prev) => [...prev, `✅ Đã đóng trình duyệt cài đặt.`])
    } catch (error: any) {
      setLogs((prev) => [...prev, `❌ Lỗi khi mở cài đặt: ${error.message}`])
    }
  }

  // 👇 SỬA DÒNG NÀY: Thêm tham số mode truyền từ giao diện vào
  const handlePublish = async (currentMode?: 'publish' | 'draft') => {
    try {
      if (!videoFile) {
        setCustomModal({ show: true, title: "⚠️ THIẾU DỮ LIỆU", message: "Vui lòng chọn video trước khi phát hành!" })
        return
      }
      if (!metadata.title?.trim()) {
        setCustomModal({ show: true, title: "⚠️ THIẾU TIÊU ĐỀ", message: "Tiêu đề video không được để trống." })
        return
      }

      setIsPublishing(true)
      
      // Chọn giá trị: Ưu tiên tham số truyền vào, nếu không có thì lấy state dự phòng
      const activeMode = currentMode || publishMode;
      
      setLogs([`🚀 Bắt đầu tiến trình ${activeMode === 'publish' ? 'XUẤT BẢN CÔNG KHAI' : 'LƯU NHÁP'}...`])
      
      // Gọi lệnh xuống Backend
      const response = await (window as any).electron.ipcRenderer.invoke('trigger-puppeteer-publish', {
        videoPath: videoFile.path,
        metadata: metadata,
        platforms: platforms,
        publishMode: activeMode // 🚀 BẮN GIÁ TRỊ THẬT XUỐNG BACKEND
      })

      setIsPublishing(false)

      if (response && response.success) {
        setCustomModal({
          show: true,
          title: "🎉 THÀNH CÔNG RỰC RỠ!",
          message: `Video "${metadata.title}" đã hoàn tất quy trình đẩy lên nền tảng ở chế độ: ${
            activeMode === 'publish' ? 'Công Khai' : 'Lưu Nháp / Không công khai'
          }.`
        })
      } else {
        setCustomModal({ show: true, title: "❌ PHÁT HÀNH BỊ NGẮT", message: response.error || "Hệ thống tự động hóa gặp sự cố." })
      }
    } catch (err: any) {
      setIsPublishing(false)
      setCustomModal({ show: true, title: "❌ LỖI HỆ THỐNG", message: err.message })
    }
  }
  // Trả về toàn bộ State và Function để Giao diện sử dụng
  return {
    videoFile,
    setVideoFile,
    removeVideo,
    metadata,
    setMetadata,
    platforms,
    togglePlatform,
    logs,
    isPublishing,
    loading: isPublishing, // Alias để tương thích ngược nếu form gọi loading
    publishMode,
    setPublishMode,
    handleImportVideo,
    handleSetupAccount,
    handlePublish
  }
}