/* eslint-disable */
import { useEffect, useRef } from 'react'

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', nameKey: 'model_llama33' },
  { id: 'deepseek-r1-distill-llama-70b', nameKey: 'model_deepseek_r1' },
  { id: 'llama-3.1-70b-versatile', nameKey: 'model_llama31_70b' },
  { id: 'llama-3.1-8b-instant', nameKey: 'model_llama31_8b' },
  { id: 'llama-3.2-3b-preview', nameKey: 'model_llama32_3b' },
  { id: 'mixtral-8x7b-32768', nameKey: 'model_mixtral' },
  { id: 'gemma2-9b-it', nameKey: 'model_gemma2' }
]

export function ChatbotTab({ chat, t, colors, isDark }: any) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, chat.isLoading])

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden relative select-none">
      
      <style>{`
        @keyframes slideInUpSoft {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-soft-up {
          animation: slideInUpSoft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .input-glow-pulse:focus-within {
          border-color: rgba(239, 68, 68, 0.4) !important;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.08);
        }
      `}</style>
      
      {/* ========================================== */}
      {/* 📂 SIDEBAR TỐI GIẢN                        */}
      {/* ========================================== */}
      <div className={`w-64 md:w-72 shrink-0 flex flex-col p-4 rounded-3xl border transition-colors duration-300 ${isDark ? 'bg-transparent border-zinc-800/60' : 'bg-transparent border-zinc-200'}`}>
        
        {/* DROPDOWN CHỌN MÔ HÌNH AI */}
        <div className="mb-5">
          <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block px-1 ${colors.c_textSub}`}>
            {t('modelLabel')}
          </label>
          <div className={`relative rounded-xl border transition-all duration-300 ${isDark ? 'bg-[#181818] border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'} shadow-sm`}>
            <select
              value={chat.selectedModel}
              onChange={(e) => chat.setSelectedModel(e.target.value)}
              className={`w-full appearance-none bg-transparent py-3 pl-4 pr-10 text-xs font-semibold focus:outline-none cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}
            >
              {GROQ_MODELS.map(model => (
                <option key={model.id} value={model.id} className={isDark ? "bg-[#181818]" : "bg-white"}>
                  {t(model.nameKey)}
                </option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none opacity-40">▼</span>
          </div>
        </div>

        {/* NÚT TẠO CHAT MỚI CHUẨN UX CHATGPT */}
        <button
          onClick={chat.createNewChat}
          className={`w-full flex items-center justify-between py-2.5 px-3 mb-4 rounded-xl font-bold text-sm transition-all duration-300 active:scale-[0.98] cursor-pointer shrink-0 ${isDark ? 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800'} shadow-sm`}
          title={t('newChat') || 'New chat'}
        >
          <div className="flex items-center gap-2.5">
            {/* Icon Logo hoặc Icon Plus */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
              <span className="text-lg leading-none mb-0.5">+</span>
            </div>
            <span>{t('newChat') || 'New chat'}</span>
          </div>
          <span className="text-lg leading-none opacity-40 hover:opacity-100 transition-opacity">📝</span>
        </button>

        {/* ĐÃ BỌC HÀM DỊCH THUẬT CHO CHỮ LỊCH SỬ TRÒ CHUYỆN */}
        <label className={`text-[10px] font-black uppercase tracking-widest mt-2 mb-2 block px-1 ${colors.c_textSub}`}>
          {t('chatHistory')}
        </label>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {chat.sessions.map((session: any) => {
            const isActive = session.id === chat.activeSessionId
            return (
              <div
                key={session.id}
                onClick={() => chat.setActiveSessionId(session.id)}
                className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? (isDark ? 'bg-zinc-800/80 text-white' : 'bg-zinc-200 text-black') 
                    : (isDark ? 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-300' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700')
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <span className={`opacity-60 text-xs`}>💬</span>
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => chat.deleteChat(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all cursor-pointer"
                  title="Xóa"
                >✕</button>
              </div>
            )
          })}
        </div>

        {chat.sessions.length > 0 && (
          <div className="mt-4 pt-3 shrink-0">
            <button
              onClick={chat.clearAllChatCache}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${isDark ? 'text-zinc-500 hover:bg-zinc-800/50 hover:text-red-400' : 'text-zinc-400 hover:bg-zinc-100 hover:text-red-500'}`}
            >
              <span>🗑️</span> {t('chatClearCache')}
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 💬 KHU VỰC CHAT CHÍNH                       */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col h-full relative border-l border-zinc-500/10 pl-6">
        <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-3xl flex flex-col gap-8 pb-4`}>
          {chat.messages.length === 0 ? (
            
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-soft-up">
              <div className="w-16 h-16 mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/10 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
                <span className="text-3xl block">✨</span>
              </div>
              <h2 className={`text-2xl font-black tracking-tight mb-2 ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
                Creator Hub Copilot
              </h2>
              <p className={`text-sm font-medium max-w-sm leading-relaxed ${colors.c_textSub}`}>
                {t('descChatbot')}
              </p>
            </div>

          ) : (
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 pt-6">
              {chat.messages.map((msg: any, index: number) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-soft-up`}>
                    <div className={`max-w-[85%] leading-relaxed text-[15px] ${
                      isUser 
                        ? 'bg-zinc-800 text-zinc-100 px-5 py-3.5 rounded-3xl rounded-tr-sm shadow-sm' 
                        : `bg-transparent ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`
                    }`}>
                      {msg.attachment && (
                        <div className={`mb-4 p-2 rounded-xl overflow-hidden max-w-sm ${isDark ? 'bg-[#181818] border border-zinc-800' : 'bg-zinc-50 border border-zinc-200'}`}>
                          {msg.attachment.type === 'image' && msg.attachment.url && (
                            <img src={msg.attachment.url} className="w-full max-h-48 object-cover rounded-lg" alt="Attached Preview" />
                          )}
                          {msg.attachment.type === 'video' && msg.attachment.url && (
                            <video src={msg.attachment.url} controls className="w-full max-h-48 rounded-lg" />
                          )}
                          {msg.attachment.type === 'document' && (
                            <div className="flex items-center gap-3 p-2 text-xs font-semibold opacity-80">
                              <span className="text-xl">📄</span>
                              <div className="truncate flex-1">
                                <p className="truncate">{msg.attachment.name}</p>
                                <p className="text-[10px] opacity-60 mt-0.5">{msg.attachment.size}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!isUser && (
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5">
                            <span className="text-sm">✨</span>
                          </div>
                          <div className="whitespace-pre-wrap flex-1 select-text selection:bg-red-500/30 pt-1">{msg.content}</div>
                        </div>
                      )}
                      {isUser && <div className="whitespace-pre-wrap select-text selection:bg-red-500/30">{msg.content}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {chat.isLoading && (
            <div className="max-w-4xl mx-auto w-full flex justify-start animate-soft-up">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-red-500/10 flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                <div className="flex gap-1.5 items-center pt-3">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ========================================== */}
        {/* KHU VỰC THANH NHẬP LIỆU LƠ LỬNG              */}
        {/* ========================================== */}
        <div className="w-full max-w-3xl mx-auto shrink-0 pb-2 flex flex-col gap-3">
          
          {chat.attachedFile && (
            <div className={`flex items-center gap-3 self-start rounded-xl px-4 py-2.5 text-xs font-semibold animate-soft-up shadow-sm border ${isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'}`}>
              <span className="opacity-70">{chat.attachedFile.type === 'image' ? '🖼️' : chat.attachedFile.type === 'video' ? '🎬' : '📄'}</span>
              <span className="truncate max-w-xs">{chat.attachedFile.name}</span>
              <span className="opacity-40 ml-1">({chat.attachedFile.size})</span>
              <button onClick={chat.removeAttachedFile} className="ml-3 hover:bg-red-500 hover:text-white w-5 h-5 flex items-center justify-center rounded-full cursor-pointer transition-colors">✕</button>
            </div>
          )}

          <div className={`p-1.5 rounded-[24px] border flex items-end gap-2 shadow-sm input-glow-pulse transition-all duration-300 ${isDark ? 'bg-[#1e1e1e] border-zinc-700/80' : 'bg-white border-zinc-300'}`}>
            <input type="file" ref={fileInputRef} onChange={chat.handleAttachFile} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" />

            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={`w-10 h-10 mb-1 ml-1 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${isDark ? 'hover:bg-zinc-700/50 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`} 
              title={t('chatAttachFile')} 
              disabled={chat.isLoading}
            >
              <span className="text-xl leading-none">+</span>
            </button>

            <textarea
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              onKeyDown={chat.handleKeyDown}
              placeholder={t('chatInputPlaceholder')}
              className="flex-1 bg-transparent resize-none min-h-[48px] max-h-40 py-3.5 px-1 text-sm focus:outline-none custom-scrollbar leading-relaxed"
              disabled={chat.isLoading}
            />

            <button
              onClick={chat.sendMessage}
              disabled={chat.isLoading || (!chat.input.trim() && !chat.attachedFile)}
              className={`w-10 h-10 mb-1 mr-1 rounded-full transition-all duration-300 active:scale-90 flex items-center justify-center shrink-0 cursor-pointer ${
                (!chat.input.trim() && !chat.attachedFile) || chat.isLoading 
                  ? (isDark ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed')
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-md'
              }`}
              title="Send"
            >
              {chat.isLoading ? (
                <span className="animate-spin text-sm block">⚙️</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-0.5">
                  <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}