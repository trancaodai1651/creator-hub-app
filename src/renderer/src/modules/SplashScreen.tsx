/* eslint-disable */
import React from 'react'

interface SplashScreenProps {
  bootState: 'booting' | 'fading' | 'done';
  bootProgress: number;
  isDark: boolean;
  t: any;
  logo?: string; // Giữ lại prop để không lệch cấu hình App.tsx, nhưng ta sẽ dùng SVG Premium vẽ trực tiếp ở dưới
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  bootState,
  bootProgress,
  isDark,
  t
}) => {
  if (bootState === 'done') return null;

  // 🚀 BỘ LỌC CỦA TESTER: Chặn đứng 100% lỗi rò rỉ mã hệ thống ra ngoài giao diện
  const getCleanStatus = (): string => {
    const raw = t('dl_msg_sync_core');
    // Nếu i18n lỗi trả về tên key thô hoặc mã lỗi in hoa, lập tức kích hoạt fallback an toàn
    if (!raw || raw === 'dl_msg_sync_core' || raw === 'DL_MSG_SYNC_CORE' || raw.includes('dl_') || raw.includes('DL_')) {
      return 'ĐANG ĐỒNG BỘ LÕI HỆ THỐNG...';
    }
    return raw.toUpperCase(); // Giữ nguyên phong cách UPPERCASE sang trọng của sếp
  };

  return (
    <div 
    className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ease-out ${
        bootState === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
    } ${isDark ? 'bg-[#0B0B0F]' : 'bg-[#F5F5F7]'}`}
    >
      {/* 🚀 ĐỘC QUYỀN ENGINE STYLES SIÊU MƯỢT - KHÔNG HẠO NĂNG GPU */}
      <style>{`
        @keyframes trackingExpand {
          0% { letter-spacing: -0.1em; opacity: 0; transform: translate3d(0, 10px, 0); }
          100% { letter-spacing: 0.2em; opacity: 0.95; transform: translate3d(0, 0, 0); }
        }
        @keyframes sonarPulse {
          0% { transform: scale(0.8) translate3d(0,0,0); opacity: 0.5; }
          100% { transform: scale(1.6) translate3d(0,0,0); opacity: 0; }
        }
        @keyframes shineFlow {
          0% { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(100%, 0, 0); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -6px, 0); }
        }
        .animate-tracking-expand { animation: trackingExpand 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-sonar-1 { animation: sonarPulse 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite; }
        .animate-sonar-2 { animation: sonarPulse 3s cubic-bezier(0.215, 0.610, 0.355, 1) infinite; animation-delay: 1.5s; }
        .animate-logo-float { animation: logoFloat 4s ease-in-out infinite; }
        .will-animate { will-change: transform, opacity; }
      `}</style>

      {/* BACKGROUND NỀN CHIỀU SÂU SANG TRỌNG (HẠN CHẾ BLUR ĐỘNG) */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div 
          className="absolute inset-0 transition-opacity duration-500 opacity-30"
          style={{
            background: isDark 
              ? 'radial-gradient(circle at 50% 45%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)' 
              : 'radial-gradient(circle at 50% 45%, rgba(239, 68, 68, 0.08) 0%, transparent 65%)'
          }}
        />
      </div>

      {/* CORE FRAME LÀM VIỆC CHÍNH */}
      <div className="relative z-10 flex flex-col items-center select-none">
        
        {/* ========================================================== */}
        {/* 🚀 LOGO VECTOR ĐA TẦNG NATIVE CỰC KỲ ĐẲNG CẤP */}
        {/* ========================================================== */}
        <div className="w-28 h-28 mb-8 relative flex items-center justify-center animate-logo-float will-animate">
          {/* Sóng radar tỏa năng lượng ra ngoài (Sonar Ripple Effect) */}
          <div className="absolute w-20 h-20 rounded-full border border-red-500/30 animate-sonar-1 will-animate" />
          <div className="absolute w-20 h-20 rounded-full border border-orange-500/20 animate-sonar-2 will-animate" />
          
          {/* Khối bảo vệ trung tâm */}
          <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center relative border backdrop-blur-md ${
            isDark ? 'bg-zinc-900/40 border-zinc-800/80 shadow-2xl' : 'bg-white/60 border-white shadow-xl'
          }`}>
            <svg viewBox="0 0 100 100" className="w-11 h-11 filter drop-shadow-[0_4px_12px_rgba(239,68,68,0.35)]">
              <defs>
                <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              {/* Vòng tròn khuyết công nghệ */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#premiumGrad)" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="180 60" />
              {/* Tam giác Play cách điệu sắc nét góc bo nhẹ */}
              <path d="M42 34.5 C42 32.5 44.2 31.3 46 32.3 L67.5 45.3 C69.2 46.3 69.2 48.7 67.5 49.7 L46 62.7 C44.2 63.7 42 62.5 42 60.5 Z" fill="url(#premiumGrad)" />
              {/* Ngôi sao lấp lánh đỉnh cao */}
              <path d="M78 22 L80 26 L84 28 L80 30 L78 34 L76 30 L72 28 L76 26 Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        {/* ========================================================== */}
        {/* 🚀 TIÊU ĐỀ THƯƠNG HIỆU THEO PHONG CÁCH APPLE PREMIUM TEXT */}
        {/* ========================================================== */}
        <div className="h-14 flex items-center justify-center">
          <h1 className={`text-3xl font-[1000] tracking-widest pl-[0.2em] uppercase text-center select-none transform-gpu animate-tracking-expand will-animate ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}>
            CREATOR<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">HUB</span>
          </h1>
        </div>

        {/* PHỤ ĐỀ TRẠNG THÁI KHỞI CHẠY - ĐÃ ĐƯỢC BỌC ÁO GIÁP AN TOÀN TOÀN DIỆN */}
        <p className={`text-[10px] font-bold tracking-[0.25em] pl-[0.25em] uppercase mt-2 mb-10 opacity-40 select-none ${
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {getCleanStatus()}
        </p>

        {/* ========================================================== */}
        {/* 🚀 THANH TIẾN TRÌNH MINIMALIST NHẸ NHÀNG, KHÔNG LAG REPAINT */}
        {/* ========================================================== */}
        <div className={`w-48 h-[2px] rounded-full overflow-hidden relative ${
          isDark ? 'bg-zinc-900' : 'bg-zinc-200'
        }`}>
          {/* Thanh chạy mịn màng ép cứng CPU/GPU chạy mượt theo tuyến tính thời gian */}
          <div 
            className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full transition-all relative will-animate"
            style={{ 
              width: `${bootProgress}%`, 
              transitionDuration: '2200ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* Tia sáng quét (Shine Flow) lướt qua bề mặt thanh tiến trình cực kỳ tinh tế */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full transform -translate-x-full" style={{ animation: 'shineFlow 1.5s infinite ease-in-out' }} />
          </div>
        </div>

      </div>
    </div>
  )
}