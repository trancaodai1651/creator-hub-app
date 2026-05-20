/* eslint-disable */
import { useState, useEffect } from 'react'

export function useTts(t: any, setCustomModal: any, elevenKey: string, activeTab: string) {
  const [ttsText, setTtsText] = useState('')
  const [voices, setVoices] = useState<any[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [ttsFolder, setTtsFolder] = useState('')
  const [isTtsProcessing, setIsTtsProcessing] = useState(false)

  useEffect(() => {
    if (activeTab === 'tts' && elevenKey.length > 5) {
      window.electron.ipcRenderer.invoke('get-elevenlabs-voices', { apiKey: elevenKey }).then((res: any) => {
        if (res && Array.isArray(res)) {
          setVoices(res.map((v: any) => ({ id: v.voice_id, name: v.name, category: v.category })))
          if (res.length > 0) setSelectedVoice(res[0].voice_id)
        } else { setVoices([]) }
      }).catch(() => setVoices([]))
    }
  }, [activeTab, elevenKey])

  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) { alert(t('ttsPlaceholder')); return }
    setIsTtsProcessing(true)
    try {
      const response = await window.electron.ipcRenderer.invoke('generate-tts-elevenlabs', { text: ttsText, voiceId: selectedVoice, apiKey: elevenKey, outputDir: ttsFolder })
      setCustomModal({ show: true, title: t('ttsTitle'), message: response.message })
      if (response.success) setTtsText('')
    } catch (err: any) {
      setCustomModal({ show: true, title: "ERROR", message: err.message })
    } finally { setIsTtsProcessing(false) }
  }

  return { ttsText, setTtsText, voices, selectedVoice, setSelectedVoice, ttsFolder, setTtsFolder, isTtsProcessing, handleGenerateTTS }
}