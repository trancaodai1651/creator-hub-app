/* eslint-disable */
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { VideoTask, Platform, TaskStatus } from '../types/video';

export function useVideoQueue() {
  const [videoQueue, setVideoQueue] = useState<VideoTask[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // 🚀 ĐÂY CHÍNH LÀ HÀM MÀ TYPESCRIPT ĐANG KÊU THIẾU:
  // Hàm này thay thế cho addVideos cũ để nhận đường dẫn tuyệt đối từ Electron
  const addVideosFromNative = (nativeFiles: Array<{name: string, path: string}>) => {
    const newTasks: VideoTask[] = nativeFiles.map((file) => ({
      id: uuidv4(),
      fileName: file.name,
      filePath: file.path, 
      thumbnail: '',
      // Tự động lấy tên file làm tiêu đề gốc (bỏ đuôi .mp4)
      metadata: { title: file.name.replace(/\.[^/.]+$/, ""), description: '', hashtags: '' },
      platforms: { tiktok: false, youtube: false, facebook: false },
      status: 'idle',
      logs: []
    }));

    setVideoQueue((prev) => {
      const updatedQueue = [...prev, ...newTasks];
      // Tự động focus vào video đầu tiên nếu chưa chọn gì
      if (!selectedVideoId && updatedQueue.length > 0) {
        setSelectedVideoId(updatedQueue[0].id);
      }
      return updatedQueue;
    });
  };

  const updateMetadata = (id: string, field: keyof VideoTask['metadata'], value: string) => {
    setVideoQueue((prev) => 
      prev.map(task => 
        task.id === id 
          ? { ...task, metadata: { ...task.metadata, [field]: value } }
          : task
      )
    );
  };

  // Cập nhật trạng thái (icon loading/success/error)
  const updateStatus = (id: string, status: TaskStatus) => {
    setVideoQueue((prev) => prev.map(task => task.id === id ? { ...task, status } : task));
  };

  // Xóa video khỏi hàng chờ
  const removeVideo = (id: string) => {
    // 1. Nếu video bị xóa chính là video đang được chọn, ta tính toán id mới ngay từ ngoài
    if (selectedVideoId === id) {
      const remainingVideos = videoQueue.filter(task => task.id !== id);
      setSelectedVideoId(remainingVideos.length > 0 ? remainingVideos[0].id : null);
    }
    
    // 2. Cập nhật lại mảng
    setVideoQueue((prev) => prev.filter(task => task.id !== id));
  };

  // Thêm hàm này vào bên trong function useVideoQueue()
  const resetAllStatuses = () => {
    setVideoQueue((prev) => 
      prev.map(task => ({
        ...task,
        status: 'idle', // Đưa tất cả về trạng thái Chờ xử lý
        logs: []        // Xóa sạch log cũ nếu muốn (tùy chọn)
      }))
    );
  };

  // Trả về toàn bộ state và function
  return {
    videoQueue,
    selectedVideoId,
    setSelectedVideoId,
    addVideosFromNative, // 👈 Đã export hàm này ra cho usePublisher dùng
    updateMetadata,
    updateStatus,
    removeVideo,
    resetAllStatuses,
  };
}