/* eslint-disable */
import React, { useState } from 'react';
import { auth, db } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'; // 🔥 ĐÃ VÁ: Import collection xịn từ thư viện chính thức

export function AuthScreen({ isDark }: { isDark: boolean }) {
  const [isRegister, setIsRegister] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // 🚀 TIẾN HÀNH ĐĂNG KÝ TÀI KHOẢN MỚI
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        
        // Cấu hình Firestore mặc định hồ sơ là status = "pending" (Chờ duyệt)
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          email: email.trim().toLowerCase(),
          role: "user",
          status: "pending", 
          permissions: {},
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });

        // Bắn dòng log realtime lên hệ thống
        await addDoc(collection(db, "activity_logs"), {
          uid: res.user.uid,
          email: email.trim().toLowerCase(),
          action: `🆕 Đăng ký tài khoản hệ thống mới thành công (Đang chờ duyệt).`,
          timestamp: serverTimestamp()
        });

        alert("🎉 Đăng ký thành công! Tài khoản đã được gửi lên Trạm Admin. Vui lòng chờ sếp phê duyệt để kích hoạt sử dụng!");
        setEmail('');
        setPassword('');
        setIsRegister(false); 
        await signOut(auth);
      } else {
        // LỆNH ĐĂNG NHẬP THÔNG THƯỜNG
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') alert("❌ Lỗi: Email này đã được người khác sử dụng rồi!");
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') alert("❌ Sai tài khoản hoặc mật khẩu sếp ơi!");
      else alert("❌ Thất bại: " + err.message);
    } finally {
      styleLoginHack();
      setLoading(false);
    }
  };

  // Hàm phụ trợ dọn dẹp giao diện
  const styleLoginHack = () => {
    try {
      localStorage.removeItem('firebase:authUser:' + ':[DEFAULT]');
    } catch(e){}
  };

  return (
    <div className={`h-screen w-full flex items-center justify-center p-4 select-none ${isDark ? 'bg-[#0f0f12]' : 'bg-zinc-100'}`}>
      <div className={`w-[400px] p-8 rounded-[32px] border shadow-2xl flex flex-col gap-6 ${isDark ? 'bg-[#141414]/90 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white ml-0.5"><path d="M8 5v14l11-7z" /></svg>
          </div>
          <h2 className={`text-xl font-black tracking-tight mt-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            {isRegister ? 'ĐĂNG KÝ HỆ THỐNG' : 'CREATOR HUB LOGIN'}
          </h2>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            {isRegister ? 'Tạo hồ sơ nhân viên chờ phê duyệt' : 'Xác thực quyền truy cập thiết bị PC'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase px-1">Tài khoản Email</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-xs font-bold outline-none focus:border-red-500 transition-all ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase px-1">Mật khẩu bảo mật</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-xs font-bold outline-none focus:border-red-500 transition-all ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black py-3.5 rounded-xl text-xs tracking-widest uppercase shadow-md transition-transform active:scale-[0.98] cursor-pointer border-0"
          >
            {loading ? '⏳ LOADING...' : isRegister ? 'GỬI HỒ SƠ ĐĂNG KÝ' : 'ĐĂNG NHẬP NGAY'}
          </button>
        </form>

        <div className="text-center border-t border-zinc-500/10 pt-4">
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); }}
            className="text-xs font-black text-red-500 hover:text-red-400 uppercase tracking-wider cursor-pointer border-0 bg-transparent"
          >
            {isRegister ? '← Đã có tài khoản? Đăng nhập' : '🆕 Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>

      </div>
    </div>
  );
}