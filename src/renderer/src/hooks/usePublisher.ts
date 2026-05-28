/* eslint-disable */
import { useState, useEffect } from 'react'
import { useVideoQueue } from './useVideoQueue'
import { tauriApi } from '../utils/tauriAdapter'

// 🚀 THÊM IMPORT FIREBASE ĐỂ LƯU PROFILE LÊN MÂY
import { auth, db } from '../utils/firebase'
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

export function usePublisher(setCustomModal: any) {
  const { videoQueue, selectedVideoId, setSelectedVideoId, addVideosFromNative, updateMetadata, updateStatus, removeVideo, resetAllStatuses } = useVideoQueue()
  
  const [isPublishing, setIsPublishing] = useState<boolean>(false)
  const [logs, setLogs] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<any>({ youtube: true, tiktok: false, facebook: false })
  const [publishMode, setPublishMode] = useState<'publish' | 'draft'>('publish')
  
  // 🚀 ĐÃ THÊM: Phương thức upload nhận thêm 'playwright'
  const [uploadMethod, setUploadMethod] = useState<'puppeteer' | 'playwright' | 'api'>('puppeteer')
  
  // 🚀 STATE LƯU TRỮ DANH SÁCH TỪ FIREBASE THAY VÀO ĐÂY
  const [profileName, setProfileName] = useState<string>('')
  const [savedProfiles, setSavedProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 🚀 LẮNG NGHE DANH SÁCH PROFILE REALTIME TỪ FIREBASE CLOUD
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const q = query(
      collection(db, "users", user.uid, "channel_profiles"),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }))
      setSavedProfiles(list)
      
      // Nếu chưa có chọn kênh nào, tự lấy kênh đầu tiên làm mặc định
      if (list.length > 0 && !profileName) {
        setProfileName(list[0].id)
      } else if (list.length === 0) {
        setProfileName('')
      }
    }, (err) => {
      console.error("Lỗi tải hồ sơ kênh:", err)
    })

    return () => unsub()
  }, [])

  // 🚀 HÀM TẠO PROFILE LÊN MÂY FIREBASE
  const handleAddProfile = async () => {
    const newName = prompt('Nhập tên Hồ sơ Kênh mới (Không dùng ký tự đặc biệt):');
    if (newName && newName.trim()) {
      const user = auth.currentUser
      if (!user) return
      const cleanName = newName.trim().replace(/[^a-zA-Z0-9_\u0600-\uFFFF ]/g, '_');
      
      setLoading(true)
      try {
        const newId = 'prof_' + Date.now()
        await setDoc(doc(db, "users", user.uid, "channel_profiles", newId), {
          name: cleanName,
          createdAt: serverTimestamp()
        })
        setProfileName(newId)
      } catch (e: any) {
        alert("❌ Lỗi tạo hồ sơ kênh: " + e.message)
      } finally {
        setLoading(false)
      }
    }
  };

  // 🚀 HÀM XÓA VĨNH VIỄN PROFILE KHỎI FIREBASE
  const handleDeleteProfile = async () => {
    if (!profileName) return;
    const target = savedProfiles.find(p => p.id === profileName)
    if (!target) return

    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ [${target.name}] không?`);
    if (confirm) {
      const user = auth.currentUser
      if (!user) return
      setLoading(true)
      try {
        await deleteDoc(doc(db, "users", user.uid, "channel_profiles", profileName))
        setProfileName('') 
      } catch (e: any) {
        alert("❌ Lỗi xóa hồ sơ: " + e.message)
      } finally {
        setLoading(false)
      }
    }
  };

  const togglePlatform = (id: string) => setPlatforms((prev: any) => ({ ...prev, [id]: !prev[id] }))

  useEffect(() => {
    let unlisten: any;
    const setupListener = async () => {
      try {
        unlisten = await tauriApi.on('publisher-log-reply', (msg: string) => setLogs(prev => [...prev, msg]));
      } catch (e) {}
    };
    setupListener();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const handleImportVideo = async () => {
    try {
      const result: any = await tauriApi.invoke('select_publisher_video_file')
      if (result && Array.isArray(result) && result.length > 0) {
        const rawFiles = result.map((file: any) => ({ name: file.name, path: file.path }));
        addVideosFromNative(rawFiles);
        setLogs(prev => [...prev, `✅ Đã nạp thành công ${result.length} video vào hàng chờ.`]);
      }
    } catch (err: any) { setCustomModal({ show: true, title: "LỖI NẠP VIDEO", message: String(err) }) }
  }

  const handleSetupAccount = async (platformId: string) => {
    try {
      // LẤY TÊN PROFILE THẬT SỰ TỪ DANH SÁCH ID
      const target = savedProfiles.find(p => p.id === profileName)
      const realName = target ? target.name : 'Default'
      // 🚀 Truyền uploadMethod xuống Tauri để phân biệt mở Puppeteer hay Playwright
      await tauriApi.invoke('setup_publisher_account', { platform: platformId, profileName: realName, uploadMethod }) 
    } catch (error: any) { setLogs(prev => [...prev, `❌ Lỗi: ${String(error)}`]) }
  }

  const handleResetStatuses = () => {
    resetAllStatuses();
    setLogs(['🔄 Đã làm mới toàn bộ trạng thái hàng chờ. Sẵn sàng đăng lại!']);
  };

  const handlePublishSingle = async (id: string, currentMode?: 'publish' | 'draft') => {
    if (isPublishing) return
    const task = videoQueue.find((v: any) => v.id === id)
    if (!task) return
    if (!task.metadata.title?.trim()) { setCustomModal({ show: true, title: "⚠️ THIẾU TIÊU ĐỀ", message: "Vui lòng điền tiêu đề cho video này!" }); return }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) { setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Vui lòng chọn ít nhất 1 nền tảng!" }); return }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    const target = savedProfiles.find(p => p.id === profileName)
    const realName = target ? target.name : 'Default'

    setLogs([`🚀 BẮT ĐẦU ĐĂNG LÊN KÊNH: [${realName}] QUA [${uploadMethod.toUpperCase()}]...`]); updateStatus(task.id, 'processing')

    try {
      const publishConfig = { 
        videoPath: task.filePath, metadata: task.metadata, platforms, publishMode: activeMode, uploadMethod,
        profileName: realName,
        youtubeClientId: localStorage.getItem('yt_client_id') || '', youtubeClientSecret: localStorage.getItem('yt_client_secret') || '',
        requireNewLogin: true 
      };
      
      const response: any = await tauriApi.invoke('trigger_puppeteer_publish', { config: publishConfig })
      
      if (response && response.success) { updateStatus(task.id, 'success'); setLogs(prev => [...prev, `🟢 ĐÃ ĐĂNG THÀNH CÔNG!`]) } 
      else { updateStatus(task.id, 'error'); setCustomModal({ show: true, title: "❌ THẤT BẠI", message: response.error || "Gặp sự cố hệ thống." }) }
    } catch (err: any) { updateStatus(task.id, 'error'); setLogs(prev => [...prev, `❌ Lỗi: ${String(err)}`]) } finally { setIsPublishing(false) }
  }

  const handlePublish = async (currentMode?: 'publish' | 'draft') => {
    const tasksToRun = videoQueue.filter((v: any) => v.status !== 'success')
    if (tasksToRun.length === 0) { setCustomModal({ show: true, title: "⚠️ HÀNG CHỜ TRỐNG", message: "Không có video nào cần đăng!" }); return }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) { setCustomModal({ show: true, title: "⚠️ CHƯA CHỌN NỀN TẢNG", message: "Vui lòng chọn ít nhất 1 nền tảng đích!" }); return }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    const target = savedProfiles.find(p => p.id === profileName)
    const realName = target ? target.name : 'Default'

    setLogs([`🚀 KHỞI ĐỘNG CHUỖI ĐĂNG TẢI LÊN KÊNH: [${realName}] QUA [${uploadMethod.toUpperCase()}]...`])
    let successCount = 0
    let isFirstVideo = true;

    for (const task of tasksToRun) {
      setLogs(prev => [...prev, `\n=========================================`, `🔄 ĐANG TỰ ĐỘNG ĐĂNG FILE: ${task.fileName}`])
      updateStatus(task.id, 'processing')
      if (!task.metadata.title?.trim()) { setLogs(prev => [...prev, `❌ Bỏ qua vì chưa nhập Tiêu đề!`]); updateStatus(task.id, 'error'); continue }

      try {
        const publishConfig = { 
          videoPath: task.filePath, metadata: task.metadata, platforms, publishMode: activeMode, uploadMethod,
          profileName: realName,
          youtubeClientId: localStorage.getItem('yt_client_id') || '', youtubeClientSecret: localStorage.getItem('yt_client_secret') || '',
          requireNewLogin: isFirstVideo 
        };
        
        isFirstVideo = false; 

        const response: any = await tauriApi.invoke('trigger_puppeteer_publish', { config: publishConfig })
        
        if (response && response.success) { successCount++; updateStatus(task.id, 'success'); setLogs(prev => [...prev, `✅ Thành công: ${task.fileName}`]) } 
        else { updateStatus(task.id, 'error'); setLogs(prev => [...prev, `❌ Thất bại: ${response.error}`]) }
      } catch (err: any) { updateStatus(task.id, 'error'); setLogs(prev => [...prev, `❌ Lỗi: ${String(err)}`]) }
      await new Promise(r => setTimeout(r, 2000))
    }
    
    setIsPublishing(false)
    setCustomModal({ show: true, title: "🎉 HOÀN TẤT!", message: `Đăng thành công: ${successCount} / ${tasksToRun.length} video.` })
  }

  return { 
    videoQueue, selectedVideoId, setSelectedVideoId, updateMetadata, removeVideo, 
    logs, isPublishing, loading, platforms, togglePlatform, 
    publishMode, setPublishMode, uploadMethod, setUploadMethod,
    profileName, setProfileName, savedProfiles, handleAddProfile, handleDeleteProfile,
    handleSetupAccount, handleImportVideo, handlePublish, handlePublishSingle, handleResetStatuses 
  }
}