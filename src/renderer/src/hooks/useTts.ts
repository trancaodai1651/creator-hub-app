/* eslint-disable */
import { useEffect, useMemo, useState } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

export type OmniVoiceRecord = {
  id: string
  name: string
  mode: 'auto' | 'clone' | 'design'
  promptPath?: string
  createdAt?: string
}

export type OmniVoiceStatus = {
  installed: boolean
  torchInstalled?: boolean
  cudaAvailable?: boolean
  device?: string
  model?: string
  message?: string
}

const DEFAULT_VOICE: OmniVoiceRecord = { id: 'auto-default', name: 'OmniVoice tự động', mode: 'auto' }
const VOICE_LIBRARY_KEY = 'hub_omnivoice_voices'
const PROJECT_KEY = 'hub_omnivoice_project_dir'
const OUTPUT_KEY = 'hub_omnivoice_output_dir'
const MODEL_ID = 'k2-fsa/OmniVoice'

const readVoices = (): OmniVoiceRecord[] => {
  try {
    const saved = JSON.parse(localStorage.getItem(VOICE_LIBRARY_KEY) || '[]')
    const records = Array.isArray(saved) ? saved.filter(item => item?.id && item?.name && item?.mode) : []
    return [DEFAULT_VOICE, ...records.filter(item => item.id !== DEFAULT_VOICE.id && item.id !== 'design')]
  } catch {
    return [DEFAULT_VOICE]
  }
}

const languageFromScript = (value: string) => {
  const text = value.trim()
  if (!text) return { code: 'Vietnamese', label: 'Tiếng Việt' }
  if (/[À-ɏḀ-ỿ]/u.test(text) || /\b(sản phẩm|và|là|giá|mua|bạn|đang|của|nhé|này)\b/iu.test(text)) return { code: 'Vietnamese', label: 'Tiếng Việt' }
  if (/[฀-๿]/u.test(text)) return { code: 'Thai', label: 'Tiếng Thái' }
  if (/[぀-ヿ]/u.test(text)) return { code: 'Japanese', label: 'Tiếng Nhật' }
  if (/[가-힯]/u.test(text)) return { code: 'Korean', label: 'Tiếng Hàn' }
  if (/[一-鿿]/u.test(text)) return { code: 'Chinese', label: 'Tiếng Trung' }
  if (/[Ѐ-ӿ]/u.test(text)) return { code: 'Russian', label: 'Tiếng Nga' }
  return { code: 'English', label: 'Tiếng Anh' }
}

const buildScript = (platform: string, product: string, benefits: string, proof: string, offer: string, cta: string) => {
  const name = product.trim() || 'sản phẩm này'
  const value = benefits.trim() || 'thiết kế tiện lợi, dễ dùng và phù hợp cho nhu cầu hằng ngày'
  const trust = proof.trim() || 'nhiều khách hàng đã dùng và phản hồi tích cực'
  const deal = offer.trim() || 'đang có ưu đãi tốt trong thời gian giới hạn'
  const action = cta.trim() || 'bấm vào liên kết để xem chi tiết và đặt hàng ngay'

  if (platform === 'shopee') return `Mở đầu: Bạn đang tìm một món ${name} vừa tiện vừa đáng tiền?\n\n${name} có ${value}. ${trust}.\n\nĐặc biệt, ${deal}. Bạn có thể xem đánh giá, chọn phân loại và đặt hàng ngay trên Shopee.\n\n${action}.`
  if (platform === 'facebook') return `Bạn bè mình ơi, nếu đang quan tâm đến ${name} thì xem hết video này nhé.\n\nĐiểm nổi bật là ${value}. Đây là lựa chọn được nhiều người quan tâm vì ${trust}.\n\nHiện tại ${deal}, nên mình để thông tin chi tiết ở phần liên kết.\n\n${action}.`
  return `Dừng lại 3 giây nếu bạn đang tìm ${name}!\n\nĐiều khiến sản phẩm này được chú ý là ${value}. ${trust}.\n\nTin vui là ${deal}.\n\n${action}.`
}

export function useTts(t: any, setCustomModal: any, activeTab: string) {
  const [platform, setPlatform] = useState<'tiktok' | 'shopee' | 'facebook'>('tiktok')
  const [productName, setProductName] = useState('')
  const [benefits, setBenefits] = useState('')
  const [proof, setProof] = useState('')
  const [offer, setOffer] = useState('')
  const [cta, setCta] = useState('')
  const [scriptText, setScriptText] = useState('')
  const [approvedScript, setApprovedScript] = useState('')
  const [voiceLibrary, setVoiceLibrary] = useState<OmniVoiceRecord[]>(readVoices)
  const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_VOICE.id)
  const [referenceAudio, setReferenceAudio] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [voiceName, setVoiceName] = useState('Giọng của tôi')
  const [voiceInstruction, setVoiceInstruction] = useState('Giọng nữ tự nhiên, thân thiện, rõ ràng, phù hợp nội dung bán hàng.')
  const [projectDir, setProjectDir] = useState(() => localStorage.getItem(PROJECT_KEY) || '')
  const [outputDir, setOutputDir] = useState(() => localStorage.getItem(OUTPUT_KEY) || '')
  const [device, setDevice] = useState<'auto' | 'cpu' | 'gpu'>('auto')
  const [status, setStatus] = useState<OmniVoiceStatus>({ installed: false, message: 'Đang kiểm tra lõi OmniVoice...' })
  const [isTtsProcessing, setIsTtsProcessing] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [generatedPath, setGeneratedPath] = useState('')

  const detectedLanguage = useMemo(() => languageFromScript(scriptText), [scriptText])
  const isApproved = Boolean(approvedScript && approvedScript === scriptText.trim())
  const selectedVoice = voiceLibrary.find(voice => voice.id === selectedVoiceId) || DEFAULT_VOICE

  const refreshStatus = async () => {
    try {
      const result: any = await tauriApi.invoke('omnivoice-status')
      if (result) setStatus(result)
      else setStatus({ installed: false, message: 'Hãy mở ứng dụng bằng bản cài đặt Tauri để chạy lõi OmniVoice.' })
    } catch (error: any) {
      setStatus({ installed: false, message: String(error) })
    }
  }

  useEffect(() => {
    if (activeTab === 'tts') void refreshStatus()
  }, [activeTab])

  useEffect(() => {
    localStorage.setItem(VOICE_LIBRARY_KEY, JSON.stringify(voiceLibrary.filter(voice => voice.id !== DEFAULT_VOICE.id)))
  }, [voiceLibrary])

  useEffect(() => {
    if (projectDir) localStorage.setItem(PROJECT_KEY, projectDir)
    else localStorage.removeItem(PROJECT_KEY)
    if (outputDir) localStorage.setItem(OUTPUT_KEY, outputDir)
    else localStorage.removeItem(OUTPUT_KEY)
  }, [projectDir, outputDir])

  const showError = (message: string) => setCustomModal({ show: true, title: 'LỖI GIỌNG ĐỌC', message })

  const handleGenerateScript = () => {
    setScriptText(buildScript(platform, productName, benefits, proof, offer, cta))
    setApprovedScript('')
  }

  const handleApproveScript = () => {
    if (!scriptText.trim()) return showError('Hãy tạo hoặc dán kịch bản trước khi duyệt.')
    setApprovedScript(scriptText.trim())
  }

  const handleUsePastedScript = () => {
    if (!scriptText.trim()) return showError('Hãy dán kịch bản vào ô biên tập trước.')
    setApprovedScript(scriptText.trim())
  }

  const handleInstallRuntime = async () => {
    setIsInstalling(true)
    try {
      const result: any = await tauriApi.invoke('install-omnivoice-runtime')
      setCustomModal({ show: true, title: 'CÀI LÕI OMNIVOICE', message: result?.message || 'Đã cài lõi OmniVoice.' })
      await refreshStatus()
    } catch (error: any) {
      showError(String(error))
    } finally {
      setIsInstalling(false)
    }
  }

  const handleCloneVoice = async () => {
    if (!voiceName.trim() || !referenceAudio || !referenceText.trim()) return showError('Cần tên giọng, âm thanh mẫu và nội dung âm thanh mẫu.')
    setIsCloning(true)
    try {
      const result: any = await tauriApi.invoke('clone-omnivoice-voice', {
        name: voiceName,
        referenceAudio,
        referenceText,
        projectDir: projectDir || undefined,
        device,
        modelId: MODEL_ID
      })
      const record: OmniVoiceRecord = { id: result.voiceId, name: voiceName.trim(), mode: 'clone', promptPath: result.promptPath, createdAt: new Date().toISOString() }
      setVoiceLibrary(current => [...current.filter(voice => voice.id !== record.id), record])
      setSelectedVoiceId(record.id)
      if (result.projectDir) setProjectDir(result.projectDir)
      setCustomModal({ show: true, title: 'LƯU GIỌNG ĐỌC', message: result.message || 'Đã lưu giọng đọc vào dự án.' })
    } catch (error: any) {
      showError(String(error))
    } finally {
      setIsCloning(false)
    }
  }

  const handleGenerateTTS = async () => {
    if (!isApproved) return showError('Hãy duyệt kịch bản hoặc dùng nút “Dùng bản đã dán” trước khi tạo giọng đọc.')
    setIsTtsProcessing(true)
    try {
      const result: any = await tauriApi.invoke('generate-omnivoice-voice', {
        text: approvedScript,
        language: detectedLanguage.code,
        voiceId: selectedVoiceId === 'design' ? 'voice-design' : selectedVoice.id,
        promptPath: selectedVoiceId === 'design' ? undefined : selectedVoice.promptPath,
        voiceInstruction: selectedVoiceId === 'design' ? voiceInstruction : undefined,
        outputDir: outputDir || undefined,
        projectDir: projectDir || undefined,
        device,
        modelId: MODEL_ID
      })
      if (!result) throw new Error('Không nhận được phản hồi từ lõi OmniVoice.')
      setGeneratedPath(result.outputPath || '')
      if (result.projectDir) setProjectDir(result.projectDir)
      setCustomModal({ show: true, title: 'TẠO GIỌNG ĐỌC', message: `${result.message || 'Đã hoàn tất.'}\n\n${result.outputPath || ''}` })
    } catch (error: any) {
      showError(String(error))
    } finally {
      setIsTtsProcessing(false)
    }
  }

  return {
    platform, setPlatform, productName, setProductName, benefits, setBenefits, proof, setProof, offer, setOffer, cta, setCta,
    scriptText, setScriptText: (value: string) => { setScriptText(value); if (approvedScript !== value.trim()) setApprovedScript('') },
    approvedScript, isApproved, handleGenerateScript, handleApproveScript, handleUsePastedScript,
    voiceLibrary, selectedVoiceId, setSelectedVoiceId, selectedVoice, referenceAudio, setReferenceAudio, referenceText, setReferenceText,
    voiceName, setVoiceName, voiceInstruction, setVoiceInstruction, projectDir, setProjectDir, outputDir, setOutputDir,
    device, setDevice, status, refreshStatus, isTtsProcessing, isCloning, isInstalling, handleInstallRuntime, handleCloneVoice,
    detectedLanguage, generatedPath, handleGenerateTTS, t
  }
}
