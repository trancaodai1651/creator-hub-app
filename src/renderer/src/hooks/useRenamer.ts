/* eslint-disable */
import { useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

export function useRenamer(t: any, setCustomModal: any) {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([])
  const [keepOriginal, setKeepOriginal] = useState(true) 
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [renamePrefix, setRenamePrefix] = useState('')
  const [useCounter, setUseCounter] = useState(true) 
  const [counterStart, setCounterStart] = useState(1)
  const [counterDigits, setCounterDigits] = useState(2) 

  const buildNewFileName = (originName: string, idx: number) => {
    let baseText = keepOriginal ? originName : ''
    if (keepOriginal && findText) { baseText = baseText.replaceAll(findText, replaceText) }
    const numberPart = useCounter ? String(counterStart + idx).padStart(counterDigits, '0') : ''
    let parts: string[] = []
    if (renamePrefix) parts.push(renamePrefix)
    if (numberPart) parts.push(numberPart)
    if (baseText) parts.push(baseText)
    return parts.join('_') || originName 
  }

  const handleApplyRename = async () => {
    if (selectedFiles.length === 0) return
    const fileRules = selectedFiles.map((f, idx) => {
      const finalNewName = buildNewFileName(f.name, idx)
      const directory = f.path.substring(0, f.path.lastIndexOf(f.path.includes('\\') ? '\\' : '/'))
      const separator = f.path.includes('\\') ? '\\' : '/'
      return { oldPath: f.path, newPath: `${directory}${separator}${finalNewName}${f.ext}` }
    })
    const response: any = await tauriApi.invoke('execute-batch-rename', { fileRules })
    setCustomModal({ show: true, title: t('renamerTitle'), message: response.message })
    if (response.success) setSelectedFiles([])
  }

  return { selectedFiles, setSelectedFiles, keepOriginal, setKeepOriginal, findText, setFindText, replaceText, setReplaceText, renamePrefix, setRenamePrefix, useCounter, setUseCounter, counterStart, setCounterStart, counterDigits, setCounterDigits, buildNewFileName, handleApplyRename }
}