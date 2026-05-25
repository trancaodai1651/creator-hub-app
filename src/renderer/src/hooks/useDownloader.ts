/* eslint-disable */
import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

export interface DownloadTask {
  id: string; url: string; title: string; thumbnail: string;
  status: 'idle' | 'fetching' | 'downloading' | 'success' | 'error';
  percent: number; msgKey: string;
  startMin: string; startSec: string;
  endMin: string; endSec: string;
  availableResolutions: string[]; selectedResolution: string;
  platform: { name: string, bg: string, text: string }; 
  isLight: boolean;
  localPath?: string;
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
  const [highBitrate, setHighBitrate] = useState(true) // 🚀 Mặc định bật Bitrate cao Pro
  const [isProcessing, setIsProcessing] = useState(false)

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const queueRef = useRef<DownloadTask[]>([]);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);

  useEffect(() => {
    let unlistenFn: () => void;
    const setupListener = async () => {
      unlistenFn = await listen('download-progress', (event: any) => {
        const data = event.payload as { id: string, msgKey: string, percent: number };
        setQueue(prev => prev.map(task => {
          if (task.id === data.id) {
            return { 
              ...task, 
              percent: data.percent, 
              msgKey: data.msgKey,
              status: data.percent === 100 ? 'success' : 'downloading'
            }
          }
          return task;
        }))
      });
    }
    setupListener();
    return () => { if (unlistenFn) unlistenFn(); }
  }, [])

  const handleSearch = async (overrideInput?: string) => {
    const query = overrideInput !== undefined ? overrideInput : searchInput;
    if (!query || !query.trim()) return;

    const cleanQuery = query.trim();
    if (cleanQuery.startsWith('http')) {
      setSearchInput('');
      await addVideoToQueue(cleanQuery);
      return;
    }
    
    setIsSearching(true); setShowSearchModal(true); setSearchResults([]);
    try {
      const res: any = await invoke('search_video', { keyword: query.trim(), limit: 10 });
      if (res.success) { setSearchResults(res.results); } 
      else { setCustomModal({ show: true, title: 'Lỗi Tìm Kiếm', message: res.message }); setShowSearchModal(false); }
    } catch (err: any) {
      setCustomModal({ show: true, title: 'Lỗi Hệ Thống', message: String(err) }); setShowSearchModal(false);
    } finally { setIsSearching(false); }
  }

  const addVideoToQueue = async (targetUrl: string) => {
    const tempId = crypto.randomUUID();
    setQueue(prev => [...prev, { 
      id: tempId, url: targetUrl, title: t('dl_msg_fetching_preview') || 'Đang nạp thông tin video...', 
      thumbnail: '', status: 'fetching', percent: 0, msgKey: '', 
      startMin: '', startSec: '', endMin: '', endSec: '',
      availableResolutions: ['best'], selectedResolution: 'best', platform: getPlatformData(targetUrl),
      isLight: !highBitrate
    }])

    try {
      const info: any = await invoke('get_video_info', { url: targetUrl })
      if (info.success && info.isPlaylist) {
        setQueue(prev => prev.filter(t => t.id !== tempId));
        const playlistTasks: DownloadTask[] = info.entries.map((entry: any) => ({
          id: crypto.randomUUID(), url: entry.url, title: entry.title, thumbnail: entry.thumbnail,
          status: 'idle', percent: 0, msgKey: '', startMin: '', startSec: '', endMin: '', endSec: '',
          availableResolutions: entry.availableResolutions || ['best'], selectedResolution: 'best', 
          platform: getPlatformData(entry.url), isLight: !highBitrate
        }));
        setQueue(prev => [...prev, ...playlistTasks]);
      } else {
        setQueue(prev => prev.map(task => {
          if (task.id === tempId) {
            return info.success 
              ? { ...task, status: 'idle', title: info.title, thumbnail: info.thumbnail, availableResolutions: info.availableResolutions || ['best'] } 
              : { ...task, title: 'Lỗi không lấy được thông tin video hoặc link bảo mật', status: 'error' }
          }
          return task;
        }))
      }
    } catch (error) {
      setQueue(prev => prev.map(task => task.id === tempId ? { ...task, title: 'Lỗi kết nối lõi tải xuống', status: 'error' } : task));
    }
  }

  const handleAddFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim().startsWith('http')) { 
        alert("Bộ nhớ tạm (Clipboard) không chứa đường link video hợp lệ!"); return; 
      }
      addVideoToQueue(text.trim());
    } catch (err) { alert("Ứng dụng không xin được quyền đọc Clipboard của hệ thống!"); }
  }

  // 🚀 ĐỒNG BỘ CÔNG TẮC: Khi gạt nút tổng, ép hàng loạt nút con bật theo
  const toggleGlobalHighBitrate = (val: boolean) => {
    setHighBitrate(val);
    setQueue(prev => prev.map(task => {
      if (task.status === 'idle' || task.status === 'error') {
        return { ...task, isLight: !val }; 
      }
      return task;
    }));
  }

  const setTaskResolution = (id: string, res: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, selectedResolution: res } : t)) }
  const setTaskStartMin = (id: string, val: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, startMin: val } : t)) }
  const setTaskStartSec = (id: string, val: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, startSec: val } : t)) }
  const setTaskEndMin = (id: string, val: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, endMin: val } : t)) }
  const setTaskEndSec = (id: string, val: string) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, endSec: val } : t)) }
  const setTaskIsLight = (id: string, val: boolean) => { setQueue(prev => prev.map(t => t.id === id ? { ...t, isLight: val } : t)) }
  const removeTask = (id: string) => { setQueue(prev => prev.filter(t => t.id !== id)) }

  const handleStartBatch = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    isRunningRef.current = true;
    let successCount = 0;
    let totalTasksRun = 0;

    while (isRunningRef.current) {
      const nextTask = queueRef.current.find(t => t.status === 'idle' || t.status === 'error');
      if (!nextTask) break;

      totalTasksRun++;
      setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'downloading', percent: 0, msgKey: 'dl_msg_starting' } : t));

      const startString = nextTask.startMin || nextTask.startSec ? `${nextTask.startMin || '00'}:${nextTask.startSec || '00'}` : '';
      const endString = nextTask.endMin || nextTask.endSec ? `${nextTask.endMin || '00'}:${nextTask.endSec || '00'}` : '';

      try {
        const res: any = await invoke('download_video', { 
          id: nextTask.id, url: nextTask.url, saveDir: downloadFolder, 
          isLight: nextTask.isLight, resolution: nextTask.selectedResolution, 
          startTime: startString, endTime: endString 
        });
        
        if (res.success) { 
          successCount++;
          setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'success', percent: 100, msgKey: 'dl_msg_done', localPath: res.path } : t));
        } else { 
          setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'error', msgKey: 'dl_msg_error' } : t));
        }
      } catch (err) { 
        setQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'error', msgKey: 'dl_msg_error' } : t));
      }
    }
    
    setIsProcessing(false);
    isRunningRef.current = false;

    if (totalTasksRun > 0) {
      const finishMessage = (t('dl_batch_done') || 'Hoàn tất tải {success}/{total} video!')
        .replace('{success}', successCount.toString())
        .replace('{total}', totalTasksRun.toString());
      setCustomModal({ show: true, title: t('dlTitle') || 'Tải Hoàn Tất', message: finishMessage });
    }
  }

  const handleCancelQueue = () => {
    isRunningRef.current = false;
    setIsProcessing(false);
  }

  // 🚀 GỌI HÀM NATIVE CỦA RUST ĐỂ MỞ FILE VIDEO BẰNG WINDOWS MEDIA PLAYER/VLC CHUẨN XÁC
  const handlePlayVideo = async (localPath: string) => {
    if (!localPath) return;
    try {
      await invoke('open_video_native', { path: localPath });
    } catch (err) {
      alert(String(err));
    }
  }

  return { 
    queue, downloadFolder, setDownloadFolder, highBitrate, toggleGlobalHighBitrate, isProcessing, 
    searchInput, setSearchInput, searchResults, isSearching, showSearchModal, setShowSearchModal, 
    handlePlayVideo,
    handleSearch, addVideoToQueue, handleAddFromClipboard, removeTask, handleStartBatch, handleCancelQueue,
    setTaskResolution, setTaskStartMin, setTaskStartSec, setTaskEndMin, setTaskEndSec, setTaskIsLight, setInputUrl: setSearchInput
  }
}