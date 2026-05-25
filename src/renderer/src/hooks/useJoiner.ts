/* eslint-disable */
import { useState, useEffect } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

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

export function useJoiner(t: (key: string) => string, setCustomModal: (modal: any) => void) {
  const [videoList, setVideoList] = useState<string[]>([]) 
  const [minTime, setMinTime] = useState<number>(60)
  const [maxTime, setMaxTime] = useState<number>(70)
  const [requirePillar, setRequirePillar] = useState<boolean>(true)
  const [useGpu, setUseGpu] = useState<boolean>(true) 
  const [outputFolder, setOutputFolder] = useState<string>('')
  const [logoPath, setLogoPath] = useState<string>('')
  const [logoPosition, setLogoPosition] = useState<string>('top-right')
  
  const [logoSize, setLogoSize] = useState<number>(150) 
  const [joinRatio, setJoinRatio] = useState<string>('original')

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
    setIsProcessing(true); setIsPaused(false); setProgressPercent(0); setProgressMsg(t('processing'))
    
    unlistenProgress = await tauriApi.on('join-progress', (data: any) => {
      setProgressMsg(data.message)
      setProgressPercent(data.percent)
      if (data.message.includes('[TAM DUNG]')) setIsPaused(true)
    })

    try {
      const response: any = await tauriApi.invoke('start-joining', { 
        videoPaths: videoList, minMins: Number(minTime), maxMins: Number(maxTime), 
        requirePillar, outputDir: outputFolder, logoPath, logoPosition, 
        logoSize, ratio: joinRatio, useGpu, singleMode, hardwareMode
      })
      setCustomModal({ show: true, title: t('joinTitle'), message: response.message })
    } catch (error: any) { 
      setCustomModal({ show: true, title: "ERROR", message: String(error) }) 
    } finally {
      setIsProcessing(false); 
      setIsPaused(false); 
      if (unlistenProgress) unlistenProgress();
    }
  }

  const handlePauseToggle = async () => {
    if (isPaused) { 
      await tauriApi.invoke('resume-joining'); 
      setIsPaused(false) 
    } else { 
      await tauriApi.invoke('pause-joining'); 
      setIsPaused(true); 
      setProgressMsg('[PAUSED]... ') 
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
    logoPath, setLogoPath, logoPosition, setLogoPosition, logoSize, setLogoSize,
    joinRatio, setJoinRatio, isProcessing, isPaused, progressMsg, progressPercent,
    singleMode, setSingleMode, hardwareMode, setHardwareMode,
    gpuName, cpuName,
    scanDirectory, handleStartProcess, handlePauseToggle, handleCancel, handleDrop
  }
}