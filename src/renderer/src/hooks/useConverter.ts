/* eslint-disable */
import { useState } from 'react'

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
    window.electron.ipcRenderer.on('convert-progress', (_e: any, data: any) => {
      setConvMsg(data.message); setConvertPercent(data.percent)
    })
    try {
      const response = await window.electron.ipcRenderer.invoke('convert-file', { inputPath: convertFile, outputDir: convertFolder, targetExt: targetExtension, subPath: convertSub, apiKey: groqKey })
      setCustomModal({ show: true, title: t('convTitle'), message: response.message })
      if (response.success) { setConvertFile(''); setConvertSub('') }
    } catch (error: any) {
      setCustomModal({ show: true, title: "ERROR", message: error.message })
    } finally {
      setIsConverting(false); window.electron.ipcRenderer.removeAllListeners('convert-progress')
    }
  }

  return {
    convertFile, setConvertFile, convertSub, setConvertSub, targetExtension, setTargetExtension,
    convertFolder, setConvertFolder, isConverting, convMsg, convPercent, handleConvertFile
  }
}