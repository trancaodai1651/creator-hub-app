/* eslint-disable */
import React from 'react'

// ĐÃ CẬP NHẬT: Nhận đầy đủ bộ gõ font chữ (fontSize, setFontSize) từ cha truyền sang
export const SettingsTab: React.FC<{ 
  cfg: any, 
  t: any, 
  colors: any, 
  isDark: boolean,
  onCheckUpdate: () => void 
}> = ({ cfg, t, colors, isDark, onCheckUpdate }) => (
  <div className={`w-full flex-1 border rounded-3xl p-8 flex flex-col gap-6 overflow-y-auto select-none ${colors.c_bgPanel} ${colors.c_borderT}`}>
    <div>
      <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">{t('setMainTitle')}</h3>
      <p className={`text-sm ${colors.c_textSub}`}>{t('setMainSub')}</p>
    </div>
    
    <div className="grid grid-cols-2 gap-6 w-full border-t pt-6 border-zinc-500/10">
      
      {/* 1. 🌐 Khối lựa chọn ngôn ngữ */}
      <div className="flex flex-col gap-3 col-span-1">
        <label className="text-sm font-semibold flex items-center gap-2">🌐 {t('setLangLabel')}</label>
        <div className="grid grid-cols-2 gap-3 w-full">
          <button onClick={() => cfg.setLanguage('vi')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${cfg.language === 'vi' ? 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/10' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
            Việt Nam
          </button>
          <button onClick={() => cfg.setLanguage('en')} className={`py-3.5 rounded-xl font-bold text-sm border transition-all ${cfg.language === 'en' ? 'bg-red-500 border-red-600 text-white shadow-md shadow-red-500/10' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'}`}>
            English
          </button>
        </div>
      </div>
      
      {/* 2. 🎨 Khối lựa chọn giao diện theme */}
      <div className="flex flex-col gap-3 col-span-1">
        <label className="text-sm font-semibold flex items-center gap-2">🎨 {t('setThemeLabel')}</label>
        <div className="flex flex-col gap-2 w-full">
          <button onClick={() => cfg.setThemeSetting('dark')} className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'dark' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeDark')}</span>{cfg.themeSetting === 'dark' && <span className="text-white">✓</span>}
          </button>
          <button onClick={() => cfg.setThemeSetting('light')} className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'light' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeLight')}</span>{cfg.themeSetting === 'light' && <span className="text-white">✓</span>}
          </button>
          <button onClick={() => cfg.setThemeSetting('system')} className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs border text-left flex justify-between items-center transition-all ${cfg.themeSetting === 'system' ? 'bg-red-500 border-red-600 text-white' : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>
            <span>{t('themeSystem')}</span>{cfg.themeSetting === 'system' && <span className="text-white">✓</span>}
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. 🔤 [THÊM MỚI]: BẢNG ĐIỀU CHỈNH KÍCH THƯỚC CHỮ TỔNG CỤC   */}
      {/* ========================================================== */}
      <div className="flex flex-col gap-3 border-t pt-5 border-zinc-500/10 col-span-2">
        <label className="text-sm font-bold flex items-center gap-2">
          🔤 {t('setThemeLabel') ? 'Kích thước chữ hệ thống:' : 'Font Size Settings:'}
        </label>
        
        <div className="grid grid-cols-4 gap-3 w-full">
          {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => {
            const sizeLabels = { small: '🔎 Nhỏ', medium: '📱 Vừa', large: '📺 To', xlarge: '📢 Rất To' }
            const isSelected = cfg.fontSize === size
            
            return (
              <button
                key={size}
                onClick={() => cfg.setFontSize(size)}
                className={`py-3 rounded-xl font-black text-xs border transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-600 text-white shadow-md shadow-red-500/10 scale-[1.02]' 
                    : isDark ? 'bg-[#0a0a0a] border-[#333] text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {sizeLabels[size]}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* 4. 🔑 Cấu hình các dòng API Key (Đã ép màu chữ text-current chống mù màu tối) */}
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1">
        <label className="text-sm font-bold flex items-center gap-2">🔑 Groq API Key:</label>
        <input 
          type="password" 
          value={cfg.groqKey} 
          onChange={(e) => cfg.setGroqKey(e.target.value)} 
          placeholder="gsk_..." 
          className={`w-full border rounded-xl px-4 py-2.5 text-xs font-black focus:border-red-500/50 focus:outline-none shadow-inner ${colors.c_bgInput} ${
            isDark ? 'text-white' : 'text-zinc-800'
          }`} 
        />
      </div>
      
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-1">
        <label className="text-sm font-bold flex items-center gap-2">🔑 ElevenLabs API Key:</label>
        <input 
          type="password" 
          value={cfg.elevenKey} 
          onChange={(e) => cfg.setElevenKey(e.target.value)} 
          placeholder="Nhập API Key..." 
          className={`w-full border rounded-xl px-4 py-2.5 text-xs font-black focus:border-red-500/50 focus:outline-none shadow-inner ${colors.c_bgInput} ${
            isDark ? 'text-white' : 'text-zinc-800'
          }`} 
        />
      </div>

      {/* 5. 🔄 Khối kiểm tra cập nhật tự động */}
      <div className="flex flex-col gap-2.5 border-t pt-5 border-zinc-500/10 col-span-2">
        <label className="text-sm font-bold flex items-center gap-2">
          🔄 {t('setUpdateLabel')}
        </label>
        
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded-2xl gap-4 ${isDark ? 'bg-[#0a0a0a] border-[#222]' : 'bg-zinc-50 border-zinc-200'} shadow-sm`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-black text-red-500 tracking-wide uppercase">
              {t('setUpdateTitle')}
            </span>
            <span className={`text-[11px] font-medium leading-relaxed ${colors.c_textSub}`}>
              {t('setUpdateDesc')}
            </span>
          </div>
          
          <button 
            onClick={onCheckUpdate}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer transition-all active:scale-[0.96] tracking-wider uppercase shrink-0"
          >
            {t('setUpdateBtn')}
          </button>
        </div>
      </div>

    </div>
  </div>
)