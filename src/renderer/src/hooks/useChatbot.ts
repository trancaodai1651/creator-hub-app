/* eslint-disable */
import { useState, useEffect } from 'react'
import { tauriApi } from '../utils/tauriAdapter'

// ... (Giữ nguyên các interface ChatAttachment, ChatMessage, ChatSession) ...
export interface ChatAttachment { name: string; type: 'image' | 'video' | 'document'; size: string; url?: string; base64?: string }
export interface ChatMessage { role: 'user' | 'assistant'; content: any; attachment?: ChatAttachment }
export interface ChatSession { id: string; title: string; messages: ChatMessage[] }

export function useChatbot(t: any, setCustomModal: any, groqKey: string) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => { const saved = localStorage.getItem('hub_chat_sessions'); return saved ? JSON.parse(saved) : [] })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => localStorage.getItem('hub_active_session_id'))
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('hub_chat_model') || 'llama-3.1-8b-instant')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<ChatAttachment | null>(null)

  useEffect(() => { localStorage.setItem('hub_chat_sessions', JSON.stringify(sessions)) }, [sessions])
  useEffect(() => { if (activeSessionId) localStorage.setItem('hub_active_session_id', activeSessionId); else localStorage.removeItem('hub_active_session_id') }, [activeSessionId])
  useEffect(() => { localStorage.setItem('hub_chat_model', selectedModel) }, [selectedModel])

  const currentSession = sessions.find(s => s.id === activeSessionId)
  const messages = currentSession ? currentSession.messages : []

  const createNewChat = () => {
    const newSession: ChatSession = { id: Date.now().toString(), title: 'Cuộc trò chuyện mới', messages: [] }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setInput('')
    setAttachedFile(null)
  }

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const filtered = sessions.filter(s => s.id !== id)
    setSessions(filtered)
    if (activeSessionId === id) setActiveSessionId(filtered.length > 0 ? filtered[0].id : null)
  }

  const clearAllChatCache = () => {
    setCustomModal({
      show: true, title: t('chatClearTitle') || "🔴 XÓA BỘ NHỚ ĐỆM CHAT",
      message: t('chatClearConfirm') || "Hành động này sẽ xóa vĩnh viễn toàn bộ các cuộc trò chuyện cũ. Bạn có chắc không?",
      onConfirm: () => {
        setSessions([]); setActiveSessionId(null); setAttachedFile(null); setInput('')
        localStorage.removeItem('hub_chat_sessions'); localStorage.removeItem('hub_active_session_id')
      }
    })
  }

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeStr = (file.size / 1024 / 1024).toFixed(2) + ' MB'
    let fileType: 'image' | 'video' | 'document' = 'document'
    if (file.type.startsWith('image/')) fileType = 'image'
    else if (file.type.startsWith('video/')) fileType = 'video'

    const localUrl = URL.createObjectURL(file)
    if (fileType === 'image') {
      const reader = new FileReader()
      reader.onload = (event) => setAttachedFile({ name: file.name, type: fileType, size: sizeStr, url: localUrl, base64: event.target?.result as string })
      reader.readAsDataURL(file)
    } else {
      setAttachedFile({ name: file.name, type: fileType, size: sizeStr, url: localUrl })
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !attachedFile) return
    if (!groqKey) { setCustomModal({ show: true, title: "⚠️ LỖI CẤU HÌNH", message: t('chatRequireKey') }); return }

    let sessionId = activeSessionId
    let updatedSessions = [...sessions]

    if (!sessionId) {
      sessionId = Date.now().toString()
      const titlePrompt = input.trim() || attachedFile?.name || 'Attachment'
      const newSession: ChatSession = { id: sessionId, title: titlePrompt.substring(0, 18) + (titlePrompt.length > 18 ? '...' : ''), messages: [] }
      updatedSessions = [newSession, ...updatedSessions]
    }

    const targetIndex = updatedSessions.findIndex(s => s.id === sessionId)
    const targetSession = updatedSessions[targetIndex]

    if (targetSession.messages.length === 0) {
      const titlePrompt = input.trim() || attachedFile?.name || 'Attachment'
      targetSession.title = titlePrompt.substring(0, 18) + (titlePrompt.length > 18 ? '...' : '')
    }

    let userText = input
    if (attachedFile && attachedFile.type !== 'image') userText = `[Đính kèm tệp ${attachedFile.type === 'video' ? 'Video' : 'Tài liệu'}: ${attachedFile.name} (${attachedFile.size})]\n` + input

    const userMessage: ChatMessage = {
      role: 'user', content: userText,
      attachment: attachedFile ? { name: attachedFile.name, type: attachedFile.type, size: attachedFile.size, url: attachedFile.url } : undefined
    }

    const newMessages = [...targetSession.messages, userMessage]
    targetSession.messages = newMessages
    setSessions(updatedSessions)
    setActiveSessionId(sessionId)
    setInput('')
    setIsLoading(true)
    
    const fileToSend = attachedFile
    setAttachedFile(null)

    try {
      const apiPayload = newMessages.map(m => {
        if (m.role === 'user' && m.attachment?.type === 'image' && fileToSend?.base64) {
          return { role: 'user', content: [{ type: 'text', text: m.content || "Hãy phân tích hình ảnh này giúp tôi." }, { type: 'image_url', image_url: { url: fileToSend.base64 } }] }
        }
        return { role: m.role, content: m.content }
      })

      // 🚀 TAURI INVOKE
      const res: any = await tauriApi.invoke('ask-groq-chatbot', { messages: apiPayload, groqKey, model: selectedModel })
      if (!res.success) throw new Error(res.error)

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...newMessages, { role: 'assistant', content: res.content }] } : s))
    } catch (error: any) {
      setCustomModal({ show: true, title: "❌ LỖI KẾT NỐI AI", message: String(error) })
    } finally { setIsLoading(false) }
  }

  return { 
    sessions, activeSessionId, setActiveSessionId, messages, input, setInput,
    isLoading, sendMessage, handleKeyDown: (e: any) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault() || sendMessage()), 
    createNewChat, deleteChat, clearAllChatCache, attachedFile, handleAttachFile, removeAttachedFile: () => setAttachedFile(null),
    selectedModel, setSelectedModel 
  }
}