/* eslint-disable */
import { useState, useEffect } from 'react'
import { tauriApi } from '../utils/tauriAdapter'
import { accountService } from '../utils/accountService'
import type { HubSession } from '../types/auth'

// 🚀 HÀM RÚT GỌN TÊN PHẦN CỨNG THÔNG MINH
const formatHardwareName = (name: string) => {
  if (!name) return name;
  let cleanName = name;
  
  // Dọn dẹp tên CPU (Xóa (R), (TM), và phần xung nhịp @ phía sau)
  cleanName = cleanName.replace(/\(R\)/ig, '').replace(/\(TM\)/ig, '').replace(/\(M\)/ig, '');
  cleanName = cleanName.replace(/ CPU @ .*/ig, '').replace(/ CPU.*/ig, '');
  
  // Dọn dẹp tên GPU (Cắt bỏ chữ NVIDIA GeForce thừa)
  cleanName = cleanName.replace(/NVIDIA GeForce /ig, '');
  
  // Chuẩn hóa viết hoa chữ thường cho đẹp mắt
  cleanName = cleanName.replace(/ I(\d)/ig, ' i$1'); // I7 -> i7
  cleanName = cleanName.replace(/SUPER/ig, 'Super'); // SUPER -> Super
  
  // Xóa khoảng trắng thừa
  return cleanName.replace(/\s+/g, ' ').trim();
}

export function useJoiner(t: (key: string) => string, setCustomModal: (modal: any) => void, session: HubSession | null = null) {
  type HighlightSegment = { id: string; videoPath: string; startSecs: number; endSecs: number }
  const [videoList, setVideoList] = useState<string[]>([]) 
  const [minTime, setMinTime] = useState<number>(60)
  const [maxTime, setMaxTime] = useState<number>(70)
  const [requirePillar, setRequirePillar] = useState<boolean>(true)
  const [useGpu, setUseGpu] = useState<boolean>(true) 
  const [outputFolder, setOutputFolder] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const [logoPosition, setLogoPosition] = useState<string>('top-right')
  
  const [logoSize, setLogoSize] = useState<number>(150) 
  const [logoMode, setLogoMode] = useState<'both' | 'long' | 'short'>('both')
  const [joinRatio, setJoinRatio] = useState<string>('original')
  const [shortVersionEnabled, setShortVersionEnabled] = useState<boolean>(false)
  const [shortDuration, setShortDuration] = useState<number>(1)
  const [shortRatio, setShortRatio] = useState<string>('9:16')

  const [highlightSegments, setHighlightSegments] = useState<HighlightSegment[]>([])
  const [highlightOutputMode, setHighlightOutputMode] = useState('multiple-long')
  const [highlightRatio, setHighlightRatio] = useState('original')
  const [highlightProcessing, setHighlightProcessing] = useState(false)

  const [singleMode, setSingleMode] = useState<boolean>(false)
  const [hardwareMode, setHardwareMode] = useState<string>('max')

  const [gpuName, setGpuName] = useState<string>('Đang quét GPU...')
  const [cpuName, setCpuName] = useState<string>('Đang quét CPU...')

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [progressMsg, setProgressMsg] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  let unlistenProgress: (() => void) | null = null;

  useEffect(() => {
    // 🚀 ÁP DỤNG HÀM RÚT GỌN KHI NHẬN KẾT QUẢ TỪ RUST
    tauriApi.invoke('get_gpu_name')
      .then((res: any) => setGpuName(formatHardwareName(res) || 'Chíp Đồ Họa'))
      .catch(() => setGpuName('Chíp Đồ Họa'));
      
    tauriApi.invoke('get_cpu_name')
      .then((res: any) => setCpuName(formatHardwareName(res) || 'CPU Hệ Thống'))
      .catch(() => setCpuName('CPU Hệ Thống'));
  }, []);

  const scanDirectory = async (folderPath: string) => {
    if (!folderPath) return
    try { 
      const result: string[] = await tauriApi.invoke('scan-folder', { folderPath }) 
      result.sort((a, b) => {
        const getFileName = (p: string) => p.split(/[/\\]/).pop()?.toLowerCase() || ''
        return getFileName(a).localeCompare(getFileName(b))
      })
      setVideoList(result)
    } catch (error) { console.error(error) }
  }

  const handleStartProcess = async () => {
    if (videoList.length === 0) { alert(t('alertChooseFolder')); return }
    void accountService.track(session, {
      feature: 'joiner',
      action: 'export_start',
      resource: `${videoList.length} tệp video`,
      metadata: { minMins: minTime, maxMins: maxTime, ratio: joinRatio, singleMode, shortVersion: shortVersionEnabled, shortDuration, shortRatio, logoMode }
    })
    setIsProcessing(true); setIsPaused(false); setProgressPercent(0); setProgressMsg(t('processing'))
    
    unlistenProgress = await tauriApi.on('join-progress', (data: any) => {
      setProgressMsg(data.message)
      setProgressPercent(data.percent)
      if (data.message.includes('[TAM DUNG]')) setIsPaused(true)
    })

    try {
      const response: any = await tauriApi.invoke('start-joining', { 
        videoPaths: videoList, minMins: Number(minTime), maxMins: Number(maxTime),
        requirePillar, outputDir: outputFolder, logoPath: logoMode === 'short' ? '' : logoPath, logoPosition,
        logoSize, ratio: joinRatio, useGpu, singleMode, hardwareMode
      })
      let message = response?.message || 'Đã hoàn thành phiên bản gốc.'
      if (response?.success && shortVersionEnabled === true) {
        try {
          const joinedVideoPaths = Array.isArray(response?.paths) ? response.paths.filter(Boolean) : []
          if (joinedVideoPaths.length === 0) throw new Error('Không tìm thấy tệp bản dài để tạo bản ngắn theo cùng kịch bản.')
          const shortResponse: any = await tauriApi.invoke('export-short-version', {
            videoPaths: joinedVideoPaths,
            outputDir: outputFolder,
            shortDurationMins: Number(shortDuration),
            shortRatio,
            logoPath: logoMode === 'long' ? '' : logoPath,
            logoPosition,
            logoSize
          })
          message = `${message}\n\n${shortResponse?.message || 'Đã xuất thêm phiên bản ngắn.'}`
        } catch (shortError: any) {
          message = `${message}\n\nKhông thể xuất bản ngắn: ${String(shortError)}`
        }
      }
      setCustomModal({ show: true, title: t('joinTitle'), message })
    } catch (error: any) { 
      setCustomModal({ show: true, title: 'LỖI', message: String(error) })
    } finally {
      setIsProcessing(false); 
      setIsPaused(false); 
      if (unlistenProgress) unlistenProgress();
    }
  }

  const chooseHighlightVideos = async () => {
    const files: any[] = await tauriApi.invoke('open_multi_files_dialog')
    const paths = (files || []).map(file => typeof file === 'string' ? file : file?.path).filter(Boolean)
    if (paths.length === 0) return
    setHighlightSegments(current => {
      const existing = new Set(current.map(segment => segment.videoPath))
      const additions = paths.filter((videoPath: string) => !existing.has(videoPath)).map((videoPath: string) => ({ id: crypto.randomUUID(), videoPath, startSecs: 0, endSecs: 60 }))
      return current.length > 0 ? [...current, ...additions] : additions
    })
  }

  const addHighlightSegment = () => {
    const videoPath = highlightSegments[0]?.videoPath || videoList[0] || ''
    if (!videoPath) return
    setHighlightSegments(current => [...current, { id: crypto.randomUUID(), videoPath, startSecs: 0, endSecs: 60 }])
  }

  const updateHighlightSegment = (id: string, patch: Partial<HighlightSegment>) => {
    setHighlightSegments(current => current.map(segment => segment.id === id ? { ...segment, ...patch } : segment))
  }

  const removeHighlightSegment = (id: string) => setHighlightSegments(current => current.filter(segment => segment.id !== id))

  const handleHighlightExport = async () => {
    const segments = highlightSegments.filter(segment => segment.videoPath && segment.endSecs > segment.startSecs)
    if (segments.length === 0) {
      setCustomModal({ show: true, title: 'ĐOẠN NỔI BẬT', message: 'Hãy chọn video và nhập mốc kết thúc lớn hơn mốc bắt đầu.' })
      return
    }
    setHighlightProcessing(true)
    void accountService.track(session, { feature: 'joiner', action: 'highlight_export_start', resource: `${segments.length} đoạn nổi bật`, metadata: { outputMode: highlightOutputMode, ratio: highlightRatio, logoMode } })
    try {
      const isShort = highlightOutputMode.includes('short')
      const response: any = await tauriApi.invoke('export-highlights', {
        segments: segments.map(segment => ({ video_path: segment.videoPath, start_secs: Number(segment.startSecs), end_secs: Number(segment.endSecs) })),
        outputDir: outputFolder,
        outputMode: highlightOutputMode,
        ratio: highlightRatio,
        logoPath: logoMode === 'both' || (isShort && logoMode === 'short') || (!isShort && logoMode === 'long') ? logoPath : '',
        logoPosition,
        logoSize
      })
      if (!response?.success) throw new Error(response?.message || 'Không thể xuất đoạn nổi bật.')
      void accountService.track(session, { feature: 'joiner', action: 'highlight_export_success', resource: `${response.paths?.length || 0} tệp đầu ra`, metadata: { outputMode: highlightOutputMode, ratio: highlightRatio } })
      setCustomModal({ show: true, title: 'ĐOẠN NỔI BẬT', message: response.message || 'Đã xuất đoạn nổi bật thành công.' })
    } catch (error: any) {
      const message = error?.message || String(error)
      void accountService.track(session, { feature: 'joiner', action: 'highlight_export_error', resource: 'Xuất đoạn nổi bật', metadata: { error: message } })
      setCustomModal({ show: true, title: 'LỖI ĐOẠN NỔI BẬT', message })
    } finally {
      setHighlightProcessing(false)
    }
  }

  const handlePauseToggle = async () => {
    if (isPaused) { 
      await tauriApi.invoke('resume-joining'); 
      setIsPaused(false) 
    } else { 
      await tauriApi.invoke('pause-joining'); 
      setIsPaused(true); 
      setProgressMsg('[TẠM DỪNG]... ')
    }
  }

  const handleCancel = async () => {
    if (confirm(t('alertConfirmCancel'))) { 
      await tauriApi.invoke('cancel-joining'); 
      setIsProcessing(false); 
      setIsPaused(false) 
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }

  return {
    videoList, setVideoList, minTime, setMinTime, maxTime, setMaxTime,
    requirePillar, setRequirePillar, useGpu, setUseGpu, outputFolder, setOutputFolder,
    logoPath, setLogoPath, logoPosition, setLogoPosition, logoSize, setLogoSize, logoMode, setLogoMode,
    joinRatio, setJoinRatio, shortVersionEnabled, setShortVersionEnabled, shortDuration, setShortDuration, shortRatio, setShortRatio,
    highlightSegments, chooseHighlightVideos, addHighlightSegment, updateHighlightSegment, removeHighlightSegment, highlightOutputMode, setHighlightOutputMode, highlightRatio, setHighlightRatio, highlightProcessing, handleHighlightExport,
    isProcessing, isPaused, progressMsg, progressPercent,
    singleMode, setSingleMode, hardwareMode, setHardwareMode,
    gpuName, cpuName,
    scanDirectory, handleStartProcess, handlePauseToggle, handleCancel, handleDrop
  }
}
