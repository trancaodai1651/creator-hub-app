import React, { useState } from 'react'

export function GuideTab({ t, colors, isDark }: any) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0)

  // Giao phó toàn bộ nội dung cho hệ thống i18n quản lý
  const guides = [
    { title: t('guideJoinerTitle'), content: t('guideJoinerContent') },
    { title: t('guideDownloaderTitle'), content: t('guideDownloaderContent') },
    { title: t('guideConverterTitle'), content: t('guideConverterContent') },
    { title: t('guideTtsTitle'), content: t('guideTtsContent') },
    { title: t('guideRenamerTitle'), content: t('guideRenamerContent') },
    {
      title: t('guideUninstallerTitle'),
      content: t('guideUninstallerContent'),
    },
    { title: t('guideCleanerTitle'), content: t('guideCleanerContent') },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full animate-fade-in select-none">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-red-500 tracking-wide uppercase flex items-center gap-3">
          <span>📚</span> {t('tabGuide')}
        </h2>
        <p className={`mt-2 text-sm ${colors.c_textSub}`}>{t('descGuide')}</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10">
        {guides.map((item, index) => {
          const isOpen = activeFaq === index
          return (
            <div
              key={index}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isDark ? 'border-zinc-800 bg-[#171717]' : 'border-zinc-200 bg-white'}`}
            >
              <button
                onClick={() => setActiveFaq(isOpen ? null : index)}
                className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-red-500/10' : `hover:${isDark ? 'bg-zinc-800' : 'bg-zinc-50'}`}`}
              >
                <h3
                  className={`font-bold text-lg ${isOpen ? 'text-red-500' : isDark ? 'text-gray-200' : 'text-zinc-800'}`}
                >
                  {item.title}
                </h3>
                <span
                  className={`text-xl transition-transform duration-300 ${isOpen ? 'rotate-180 text-red-500' : 'text-gray-500'}`}
                >
                  ▼
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out px-5 overflow-hidden ${isOpen ? 'max-h-[500px] py-4 opacity-100' : 'max-h-0 py-0 opacity-0'}`}
              >
                <p
                  className={`text-sm leading-relaxed whitespace-pre-line ${colors.c_textSub}`}
                >
                  {item.content}
                </p>
              </div>
            </div>
          )
        })}

        {/* Khung Hỗ trợ kỹ thuật động theo ngôn ngữ */}
        <div
          className={`mt-8 p-6 rounded-2xl border-dashed border-2 flex items-center justify-between ${isDark ? 'border-zinc-800 bg-[#1a1a1a]' : 'border-zinc-300 bg-zinc-50'}`}
        >
          <div>
            <h4 className="font-bold text-lg mb-1 text-red-500">
              {t('guideHelpTitle')}
            </h4>
            <p className={`text-sm ${colors.c_textSub}`}>
              {t('guideHelpDesc')}
            </p>
          </div>
          <button
            onClick={() =>
              window.open(
                'https://github.com/trancaodai1651/creator-hub-app/issues',
                '_blank',
              )
            }
            className="bg-red-600 text-white hover:bg-red-500 px-6 py-3 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-md flex items-center gap-2"
          >
            <span>💬</span> {t('guideFeedbackBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
