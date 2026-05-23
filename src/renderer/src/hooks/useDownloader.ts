/* eslint-disable */
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface DownloadTask {
  id: string; url: string; title: string; thumbnail: string;
  status: 'idle' | 'downloading' | 'success' | 'error';
  percent: number; msgKey: string;
  startTime: string; endTime: string;   
  availableResolutions: string[]; selectedResolution: string;
  platform: { name: string, bg: string, text: string }; 
}

const getPlatformData = (url: string) => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return { name: 'YouTube', bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' };
  if (lowerUrl.includes('tiktok.com')) return { name: 'TikTok', bg: 'bg-zinc-200 dark:bg-zinc-800', text: 'text-zinc-800 dark:text-white' };
  if (lowerUrl.includes('douyin.com')) return { name: 'Douyin', bg: 'bg-zinc-800 dark:bg-zinc-700', text: 'text-white' };
  if (lowerUrl.includes('bilibili.com')) return { name: 'Bilibili', bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' };
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) return { name: 'Facebook', bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' };
  if (lowerUrl.includes('instagram.com')) return { name: 'Instagram', bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20', text: 'text-fuchsia-600 dark:text-fuchsia-400' };
  return { name: 'Web Video', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' };
}

export function useDownloader(t: any, setCustomModal: any) {
  const [queue, setQueue] = useState<DownloadTask[]>([])
  const [downloadFolder, setDownloadFolder] = useState('')
  const [isLight, setIsLight] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // 🚀 STATE TÌM KIẾM
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    const handleProgress = (_e: any, data: { id: string, msgKey: string, percent: number }) => {
      setQueue(prev => prev.map(task => task.id === data.id ? { ...task, percent: data.percent, msgKey: data.msgKey } : task))
    }
    window.electron.ipcRenderer.on('download-progress', handleProgress)
    return () => { window.electron.ipcRenderer.removeAllListeners('download-progress') }
  }, [])

  // 🚀 HÀM TÌM KIẾM
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    // Nếu nhập link trực tiếp thì thêm thẳng vào hàng chờ luôn
    if (searchInput.startsWith('http')) {
      await addVideoToQueue(searchInput);
      setSearchInput('');
      return;
    }
    
    // Nếu là từ khóa thì mở Modal tìm kiếm
    setIsSearching(true);
    setShowSearchModal(true);
    setSearchResults([]);
    const res = await window.electron.ipcRenderer.invoke('search-video', { keyword: searchInput, limit: 10 });
    if (res.success) setSearchResults(res.results);
    else setCustomModal({ show: true, title: 'Lỗi Tìm Kiếm', message: res.message });
    setIsSearching(false);
  }

  // 🚀 HÀM LÕI THÊM VIDEO VÀO HÀNG CHỜ (Dùng chung cho Paste và Search)
  const addVideoToQueue = async (targetUrl: string) => {
    const tempId = uuidv4();
    setQueue(prev => [...prev, { 
      id: tempId, url: targetUrl, title: t('dl_msg_fetching_preview') || 'Đang nạp thông tin video...', 
      thumbnail: '', status: 'idle', percent: 0, msgKey: '', startTime: '', endTime: '', 
      availableResolutions: ['best'], selectedResolution: 'best', platform: getPlatformData(targetUrl)
    }])

    const info = await window.electron.ipcRenderer.invoke('get-video-info', targetUrl)
    if (info.success && info.isPlaylist) {
      setQueue(prev => prev.filter(t => t.id !== tempId));
      const playlistTasks: DownloadTask[] = info.entries.map((entry: any) => ({
        id: uuidv4(), url: entry.url, title: entry.title, thumbnail: entry.thumbnail,
        status: 'idle', percent: 0, msgKey: '', startTime: '', endTime: '',
        availableResolutions: entry.availableResolutions || ['best'], selectedResolution: 'best', platform: getPlatformData(entry.url)
      }));
      setQueue(prev => [...prev, ...playlistTasks]);
    } else {
      setQueue(prev => prev.map(task => {
        if (task.id === tempId) {
          return info.success ? { ...task, title: info.title, thumbnail: info.thumbnail, availableResolutions: info.availableResolutions } : { ...task, title: 'Lỗi không lấy được thông tin', status: 'error' }
        }
        return task;
      }))
    }
  }

  const handleAddFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.startsWith('http')) { alert("Vui lòng Copy đường link hợp lệ!"); return; }
      addVideoToQueue(text);
    } catch (err) { alert("Không thể đọc Clipboard. Vui lòng thử lại!"); }
  }

  const setTaskResolution = (id: string, res: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, selectedResolution: res } : t)) }
  const setTaskStartTime = (id: string, time: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, startTime: time } : t)) }
  const setTaskEndTime = (id: string, time: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, endTime: time } : t)) }
  const removeTask = (id: string) => { if(!isProcessing) setQueue(prev => prev.filter(t => t.id !== id)) }

  const handleStartBatch = async () => {
    const tasksToRun = queue.filter(t => t.status === 'idle' || t.status === 'error')
    if (tasksToRun.length === 0) return;
    setIsProcessing(true);
    let successCount = 0;
    for (const task of tasksToRun) {
      setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'downloading', percent: 0, msgKey: 'dl_msg_starting' } : t))
      try {
        const res = await window.electron.ipcRenderer.invoke('download-video', { id: task.id, url: task.url, saveDir: downloadFolder, isLight, resolution: task.selectedResolution, startTime: task.startTime, endTime: task.endTime })
        if (res.success) { successCount++; setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'success', percent: 100, msgKey: 'dl_msg_done' } : t)) }
        else setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', msgKey: 'dl_msg_error' } : t))
      } catch (err) { setQueue(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', msgKey: 'dl_msg_error' } : t)) }
    }
    setIsProcessing(false);
    const finishMessage = (t('dl_batch_done') || 'Hoàn tất tải {success}/{total} video!').replace('{success}', successCount.toString()).replace('{total}', tasksToRun.length.toString());
    setCustomModal({ show: true, title: t('dlTitle'), message: finishMessage })
  }

  return { queue, downloadFolder, setDownloadFolder, isLight, setIsLight, isProcessing, 
    searchInput, setSearchInput, searchResults, isSearching, showSearchModal, setShowSearchModal, handleSearch, addVideoToQueue,
    handleAddFromClipboard, removeTask, handleStartBatch, setTaskResolution, setTaskStartTime, setTaskEndTime }
}