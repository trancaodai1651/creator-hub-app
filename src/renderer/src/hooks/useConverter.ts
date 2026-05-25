/* eslint-disable */
import { useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

export function useConverter(t: any, setCustomModal: any, groqKey: string) {
  const [convertFile, setConvertFile] = useState('')
  const [convertSub, setConvertSub] = useState('')
  const [targetExtension, setTargetExtension] = useState('mp4')
  const [convertFolder, setConvertFolder] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [convMsg, setConvMsg] = useState('')
  const [convPercent, setConvertPercent] = useState(0)

  const handleConvertFile = async () => {
    if (!convertFile) { alert(t('alertChooseFile')); return }
    setIsConverting(true); setConvertPercent(0); setConvMsg(t('converting'))
    
    // 🚀 Lắng nghe Tauri an toàn
    const unlisten = await tauriApi.on('convert-progress', (data: any) => {
      setConvMsg(data.message); setConvertPercent(data.percent)
    })

    try {
      const response: any = await tauriApi.invoke('convert-file', { inputPath: convertFile, outputDir: convertFolder, targetExt: targetExtension, subPath: convertSub, apiKey: groqKey })
      setCustomModal({ show: true, title: t('convTitle'), message: response.message })
      if (response.success) { setConvertFile(''); setConvertSub('') }
    } catch (error: any) {
      setCustomModal({ show: true, title: "ERROR", message: String(error) })
    } finally {
      setIsConverting(false); 
      if (unlisten) unlisten(); // Dọn dẹp listener
    }
  }

  return { convertFile, setConvertFile, convertSub, setConvertSub, targetExtension, setTargetExtension, convertFolder, setConvertFolder, isConverting, convMsg, convPercent, handleConvertFile }
}