/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { db } from '../utils/firebase'; 
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit, serverTimestamp, deleteDoc, addDoc } from 'firebase/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const CORE_FEATURES = [
  { id: 'joiner', nameVi: '🧩 Gộp Video', nameEn: '🧩 Video Joiner' },
  { id: 'downloader', nameVi: '📥 Tải Video', nameEn: '📥 Video Downloader' },
  { id: 'publisher', nameVi: '🚀 Phát Video Tự Động', nameEn: '🚀 Auto Publisher' },
  { id: 'converter', nameVi: '🔀 Chuyển Định Dạng', nameEn: '🔀 Video Converter' },
  { id: 'tts', nameVi: '🗣️ Giọng Đọc AI', nameEn: '🗣️ Text To Speech' },
  { id: 'renamer', nameVi: '✏️ Đổi Tên Loạt', nameEn: '✏️ Batch Renamer' },
  { id: 'installer', nameVi: '💻 Cài Phần Mềm', nameEn: '💻 Software Installer' },
  { id: 'uninstaller', nameVi: '🧼 Gỡ Ứng Dụng Sạch', nameEn: '🧼 Clean Uninstaller' },
  { id: 'cleaner', nameVi: '🗑️ Dọn Rác Hệ Thống', nameEn: '🗑️ System Cleaner' },
  { id: 'chatbot', nameVi: '🤖 AI Copilot', nameEn: '🤖 AI Copilot' },
];

const adminLang = {
  vi: {
    pendingTitle: "🔔 TÀI KHOẢN CHỜ PHÊ DUYỆT",
    btnApprove: "DUYỆT TÀI KHOẢN",
    btnReject: "TỪ CHỐI",
    listTitle: "👥 DANH SÁCH THÀNH VIÊN CHÍNH THỨC",
    tipClick: "* Mẹo: Click chuột vào thẻ nhân viên để lọc riêng xem Log hoạt động của người đó.",
    searchPlace: "Tìm kiếm email...",
    viewLogBadge: "🎯 Đang Xem Log",
    lastActive: "Hoạt động:",
    btnDemote: "Hạ Cấp",
    btnPromote: "LÊN ADMIN",
    btnUnban: "Mở Khóa",
    btnBan: "KHÓA NICK",
    btnDelete: "❌ XÓA ACC",
    btnResetPwd: "🔑 RESET PWD",
    permissionTitle: "🔒 CẤP QUYỀN SỬ DỤNG TÍNH NĂNG:",
    logTitle: "📡 LUỒNG LOG HOẠT ĐỘNG",
    logSubAll: "🌍 Trạng thái: Xem tất cả hệ thống",
    logSubTarget: "🎯 Mục tiêu: ",
    btnViewAll: "Xem tất cả",
    noLog: "Không có dữ liệu nhật ký của tài khoản này...",
    noData: "Chưa có dữ liệu",
    justNow: "Vừa xong",
    minsAgo: "phút trước",
    hoursAgo: "giờ trước"
  },
  en: {
    pendingTitle: "🔔 ACCOUNTS PENDING APPROVAL",
    btnApprove: "APPROVE",
    btnReject: "REJECT",
    listTitle: "👥 OFFICIAL STAFF LIST",
    tipClick: "* Tip: Click on a staff card to filter and view their specific activity logs.",
    searchPlace: "Search email...",
    viewLogBadge: "🎯 Viewing Logs",
    lastActive: "Active:",
    btnDemote: "Demote",
    btnPromote: "PROMOTE",
    btnUnban: "Unblock",
    btnBan: "BAN ACCOUNT",
    btnDelete: "❌ DELETE ACC",
    btnResetPwd: "🔑 RESET PWD",
    permissionTitle: "🔒 GRANT FEATURE PERMISSIONS:",
    logTitle: "📡 ACTIVITY LOG STREAM",
    logSubAll: "🌍 Status: Global System Logs",
    logSubTarget: "🎯 Target: ",
    btnViewAll: "View All",
    noLog: "No log data available for this account...",
    noData: "No data",
    justNow: "Just now",
    minsAgo: "mins ago",
    hoursAgo: "hours ago"
  }
};

export function AdminTab({ isDark, language }: { isDark: boolean; language: 'vi' | 'en' }) {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const al = adminLang[language] || adminLang['vi'];

  const bgPanel = isDark ? 'bg-[#141414] border-zinc-800' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-zinc-200' : 'text-zinc-800';
  const textLabel = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const inputClass = isDark ? 'bg-[#1a1a1a] border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900';

  const formatTime = (timestamp: any) => {
    if (!timestamp) return al.noData;
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return al.justNow;
    if (diff < 3600) return `${Math.floor(diff / 60)} ${al.minsAgo}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${al.hoursAgo}`;
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const uList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(uList);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(150));
    const unsub = onSnapshot(q, (snapshot) => {
      const lList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(lList);
    });
    return () => unsub();
  }, []);

  // 🚀 LỆNH DUYỆT TÀI KHOẢN ĐĂNG KÝ MỚI
  const handleApproveUser = async (userId: string, email: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { status: "active" });
      await addDoc(collection(db, "activity_logs"), {
        uid: userId, email: email,
        action: `✅ Admin đã phê duyệt quyền truy cập hệ thống thành công.`,
        timestamp: serverTimestamp()
      });
      alert(language === 'vi' ? `Đã kích hoạt tài khoản cho: ${email}` : `Approved account for: ${email}`);
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // 🚀 LỆNH ĐỔI MẬT KHẨU (GỬI LINK SECURE TỚI EMAIL NGƯỜI DÙNG)
  const handleResetUserPassword = async (email: string) => {
    const confirmMsg = language === 'vi' 
      ? `Xác nhận gửi liên kết đặt lại mật khẩu đến hòm thư: ${email}?`
      : `Send secure password reset link to: ${email}?`;
    if (window.confirm(confirmMsg)) {
      try {
        const authInstance = getAuth();
        await sendPasswordResetEmail(authInstance, email);
        alert(language === 'vi' ? "🎉 Hệ thống đã gửi email reset mật khẩu thành công!" : "🎉 Password reset email sent!");
      } catch (err: any) {
        alert("❌ Lỗi: " + err.message);
      }
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(language === 'vi' ? `Đổi quyền thành [${newRole.toUpperCase()}]?` : `Change role to [${newRole.toUpperCase()}]?`)) {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    }
  };

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    if (window.confirm(newStatus === 'banned' ? 'KHÓA NICK này?' : 'MỞ KHÓA NICK?')) {
      await updateDoc(doc(db, "users", userId), { status: newStatus });
    }
  };

  const handleDeleteUserRecord = async (userId: string, email: string) => {
    if (window.confirm(`⚠️ Xóa vĩnh viễn hồ sơ [${email}]?`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
        if (selectedUid === userId) {
          setSelectedUid(null);
          setSelectedEmail(null);
        }
      } catch (e: any) {}
    }
  };

  const toggleFeaturePermission = async (userId: string, currentPermissions: any, featureId: string) => {
    const updatedPerms = { ...(currentPermissions || {}) };
    updatedPerms[featureId] = updatedPerms[featureId] === false ? true : false;
    await updateDoc(doc(db, "users", userId), { permissions: updatedPerms });
  };

  // Tách biệt danh sách: Chờ duyệt và Đã duyệt
  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status !== 'pending' && u.email?.toLowerCase().includes(search.toLowerCase()));

  const displayedLogs = selectedUid 
    ? logs.filter(log => log.uid === selectedUid || log.email?.toLowerCase() === selectedEmail?.toLowerCase())
    : logs;

  return (
    <div className="w-full h-full flex flex-col xl:flex-row gap-6 p-6 overflow-hidden animate-soft-up">
      
      {/* KHỐI TRÁI */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        
        {/* 🚀 DANH SÁCH CHỜ DUYỆT (CHỈ HIỆN KHI CÓ NGƯỜI ĐĂNG KÝ MỚI) */}
        {pendingUsers.length > 0 && (
          <div className={`p-4 rounded-3xl border border-amber-500/40 bg-amber-500/5 shadow-md shrink-0 flex flex-col gap-3 animate-pulse`}>
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">{al.pendingTitle} ({pendingUsers.length})</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {pendingUsers.map(pUser => (
                <div key={pUser.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zinc-800">
                  <span className="text-xs font-black text-zinc-200">{pUser.email}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleApproveUser(pUser.id, pUser.email)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[10px] font-black tracking-wider uppercase border-0 cursor-pointer shadow"
                    >
                      {al.btnApprove}
                    </button>
                    <button 
                      onClick={() => handleDeleteUserRecord(pUser.id, pUser.email)}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black tracking-wider uppercase border-0 cursor-pointer"
                    >
                      {al.btnReject}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DANH SÁCH THÀNH VIÊN CHÍNH THỨC */}
        <div className={`flex-1 flex flex-col gap-4 p-5 rounded-3xl border shadow-sm overflow-hidden ${bgPanel}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-500/10">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-widest ${textTitle}`}>{al.listTitle} ({activeUsers.length})</h3>
              <p className="text-[10px] text-zinc-500 font-bold mt-0.5">{al.tipClick}</p>
            </div>
            <input 
              type="text" 
              placeholder={al.searchPlace} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold border outline-none max-w-xs ${inputClass}`}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
            {activeUsers.map((user) => {
              const isSelectedForLog = selectedUid === user.uid;
              return (
                <div 
                  key={user.id} 
                  onClick={() => {
                    setSelectedUid(user.uid);
                    setSelectedEmail(user.email);
                  }}
                  className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all cursor-pointer relative ${
                    isSelectedForLog 
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/5' 
                      : user.status === 'banned' 
                        ? 'border-red-500/30 bg-red-500/5 opacity-60' 
                        : isDark ? 'border-zinc-800 bg-[#1a1a1a]/40 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50/40 hover:border-zinc-300'
                  }`}
                >
                  {isSelectedForLog && (
                    <span className="absolute top-2 right-2 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                      {al.viewLogBadge}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black truncate ${textTitle}`}>{user.email}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${user.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className={`text-[11px] font-medium mt-1 ${textLabel}`}>
                        {al.lastActive} <span className="font-bold text-red-500/80">{formatTime(user.lastActive)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* 🚀 NÚT ĐỔI MẬT KHẨU TỪNG USER CHUYÊN NGHIỆP */}
                      <button 
                        onClick={() => handleResetUserPassword(user.email)}
                        className="px-2.5 py-1.5 bg-purple-500/10 text-purple-500 border-0 hover:bg-purple-600 hover:text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer"
                        title="Gửi email cấp lại mật khẩu cho thành viên này"
                      >
                        {al.btnResetPwd}
                      </button>

                      <button 
                        onClick={() => toggleRole(user.id, user.role)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${user.role === 'admin' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500'}`}
                      >
                        {user.role === 'admin' ? al.btnDemote : al.btnPromote}
                      </button>
                      <button 
                        onClick={() => toggleStatus(user.id, user.status)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer border-0 ${user.status === 'banned' ? 'bg-green-600 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-600'}`}
                      >
                        {user.status === 'banned' ? al.btnUnban : al.btnBan}
                      </button>
                      <button 
                        onClick={() => handleDeleteUserRecord(user.id, user.email)}
                        className="px-2.5 py-1.5 bg-red-600/10 text-red-500 border-0 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer"
                      >
                        {al.btnDelete}
                      </button>
                    </div>
                  </div>

                  {user.role !== 'admin' && user.status !== 'banned' && (
                    <div className={`p-3 rounded-xl border border-dashed ${isDark ? 'bg-black/40 border-zinc-800' : 'bg-zinc-100/50 border-zinc-200'}`} onClick={e => e.stopPropagation()}>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{al.permissionTitle}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CORE_FEATURES.map((feat) => {
                          const isAllowed = user.permissions?.[feat.id] !== false;
                          const name = language === 'vi' ? feat.nameVi : feat.nameEn;
                          return (
                            <label key={feat.id} className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer select-none transition-all ${isAllowed ? 'border-green-500/30 bg-green-500/5 text-green-500' : 'border-red-500/20 bg-red-500/5 text-red-500/60 line-through'}`}>
                              <input 
                                type="checkbox"
                                checked={isAllowed}
                                onChange={() => toggleFeaturePermission(user.id, user.permissions, feat.id)}
                                className="w-3.5 h-3.5 accent-green-600 rounded cursor-pointer"
                              />
                              <span className="truncate">{name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI */}
      <div className="w-full xl:w-[420px] flex flex-col gap-4 p-5 rounded-3xl border shadow-sm overflow-hidden bg-[#070708] border-zinc-800 shrink-0">
        <div className="flex justify-between items-start border-b border-zinc-900 pb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">{al.logTitle}</h3>
            <p className="text-[11px] font-semibold mt-1 text-emerald-400 truncate whitespace-nowrap">
              {selectedUid ? `${al.logSubTarget} ${selectedEmail}` : al.logSubAll}
            </p>
          </div>
          {selectedUid && (
            <button 
              onClick={() => { setSelectedUid(null); setSelectedEmail(null); }}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-black tracking-wider uppercase transition-all cursor-pointer border-0 shrink-0 ml-2"
            >
              {al.btnViewAll}
            </button>
          )}
        </div>
        
        <div className="flex-1 rounded-2xl p-4 font-mono text-[11px] leading-relaxed overflow-y-auto custom-scrollbar bg-black border border-zinc-800/60 text-zinc-400 space-y-2">
          {displayedLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center opacity-40 text-center text-xs">{al.noLog}</div>
          ) : (
            displayedLogs.map((log) => (
              <div key={log.id} className="border-b border-zinc-900/60 pb-1.5 last:border-0 animate-fade-in-up">
                <div className="flex justify-between items-center text-[10px] text-zinc-600 mb-0.5">
                  <span className="font-bold text-red-500/60 truncate max-w-[200px]">{log.email}</span>
                  <span>{log.timestamp ? new Date(log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleTimeString('vi-VN') : 'Now'}</span>
                </div>
                <div className={`font-semibold ${log.action?.includes('❌') || log.action?.includes('🛑') || log.action?.includes('⚠️') ? 'text-red-400' : log.action?.includes('🔑') || log.action?.includes('✅') ? 'text-green-400' : 'text-zinc-300'}`}>
                  {log.action}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}