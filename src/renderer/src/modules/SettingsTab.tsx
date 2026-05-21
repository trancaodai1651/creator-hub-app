/* eslint-disable */
import React from 'react'

// ĐÃ SỬA: Bổ sung thuộc tính 'onCheckUpdate' vào Type định danh để xóa sạch lỗi ở App.tsx
export const SettingsTab: React.FC<{ 
  cfg: any, 
  t: any, 
  colors: any, 
  isDark: boolean,
  onCheckUpdate: () => void 
}> = ({ cfg, t, colors, isDark, onCheckUpdate }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto select-none ${colors.c_bgPanel}`}>
    <div>
      <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('setMainTitle')}</h3>
      <p className={`text-sm ${colors.c_textSub}`}>{t('setMainSub')}</p>
    </div>
    
    <div className="grid grid-cols-2 gap-8 w-full border-t pt-6 border-zinc-500/10">
      {/* 🌐 Khối lựa chọn ngôn ngữ */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold flex items-center gap-2">🌐 {t('setLangLabel')}</label>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button onClick={() => cfg.setLanguage('vi')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${cfg.language === 'vi' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
            🇻🇳 Tiếng Việt
          </button>
          <button onClick={() => cfg.setLanguage('en')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${cfg.language === 'en' ? 'bg-red-500 border-red-600 text-white shadow-md' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
            🇺🇸 English
          </button>
        </div>
      </div>
      
      {/* 🎨 Khối lựa chọn giao diện theme */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold flex items-center gap-2">🎨 {t('setThemeLabel')}</label>
        <div className="flex flex-col gap-2.5 w-full">
          <button onClick={() => cfg.setThemeSetting('dark')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'dark' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeDark')}</span>{cfg.themeSetting === 'dark' && <span className="text-white">✓</span>}
          </button>
          <button onClick={() => cfg.setThemeSetting('light')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'light' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeLight')}</span>{cfg.themeSetting === 'light' && <span className="text-white">✓</span>}
          </button>
          <button onClick={() => cfg.setThemeSetting('system')} className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'system' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-400 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeSystem')}</span>{cfg.themeSetting === 'system' && <span className="text-white">✓</span>}
          </button>
        </div>
      </div>
      
      {/* 🔑 Cấu hình các dòng API Key */}
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1">
        <label className="text-sm font-bold flex items-center gap-2">🔑 Groq API Key:</label>
        <input type="password" value={cfg.groqKey} onChange={(e) => cfg.setGroqKey(e.target.value)} placeholder="gsk_..." className={`w-full border rounded-xl px-4 py-2 text-xs font-semibold focus:border-red-500 focus:outline-none ${colors.c_bgInput}`} />
      </div>
      
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1">
        <label className="text-sm font-bold flex items-center gap-2">🔑 ElevenLabs API Key:</label>
        <input type="password" value={cfg.elevenKey} onChange={(e) => cfg.setElevenKey(e.target.value)} placeholder="..." className={`w-full border rounded-xl px-4 py-2 text-xs font-semibold focus:border-red-500 focus:outline-none ${colors.c_bgInput}`} />
      </div>

      {/* ====================================================================
      [THÊM MỚI]: CARD UI HỆ THỐNG KIỂM TRA VÀ CẬP NHẬT PHẦN MỀM TỰ ĐỘNG
      ==================================================================== */}
      {/* ====================================================================
      [ĐÃ CHUẨN HÓA]: GỌI LỆNH QUA FILE TRANSLATIONS SẠCH ĐẸP
      ==================================================================== */}
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-2">
        <label className="text-sm font-bold flex items-center gap-2">
          🔄 {t('setUpdateLabel')}
        </label>
        
        <div className={`flex items-center justify-between border p-4 rounded-2xl ${isDark ? 'bg-[#0a0a0a] border-[#222]' : 'bg-zinc-50 border-zinc-200'} mt-0.5 shadow-xs`}>
          <div className="flex flex-col gap-0.5">
            {/* Tiêu đề hộp thông báo */}
            <span className="text-xs font-black text-red-500 tracking-wide uppercase">
              {t('setUpdateTitle')}
            </span>
            {/* Dòng mô tả chi tiết */}
            <span className={`text-[11px] font-medium ${colors.c_textSub}`}>
              {t('setUpdateDesc')}
            </span>
          </div>
          
          {/* Chữ hiển thị trên nút bấm */}
          <button 
            onClick={onCheckUpdate}
            className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-[11px] shadow-sm cursor-pointer transition-all active:scale-[0.96] tracking-wider uppercase shrink-0"
          >
            {t('setUpdateBtn')}
          </button>
        </div>
      </div>

    </div>
  </div>
)