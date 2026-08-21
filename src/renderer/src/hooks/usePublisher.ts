/* eslint-disable */
import { useEffect, useState } from 'react'
import { useVideoQueue } from './useVideoQueue'
import { tauriApi } from '../utils/tauriAdapter'

const PROFILE_STORAGE_KEY = 'hub_publisher_profiles'

const loadProfiles = () => {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function usePublisher(setCustomModal: any) {
  const { videoQueue, selectedVideoId, setSelectedVideoId, addVideosFromNative, updateMetadata, updateStatus, removeVideo, resetAllStatuses } = useVideoQueue()
  const [isPublishing, setIsPublishing] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<any>({ youtube: true, tiktok: false, facebook: false })
  const [publishMode, setPublishMode] = useState<'publish' | 'draft'>('publish')
  const [uploadMethod, setUploadMethod] = useState<'puppeteer' | 'playwright' | 'api'>('puppeteer')
  const [profileName, setProfileName] = useState('')
  const [savedProfiles, setSavedProfiles] = useState<any[]>(loadProfiles)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfiles))
    if (savedProfiles.length === 0) {
      setProfileName('')
    } else if (!savedProfiles.some(profile => profile.id === profileName)) {
      setProfileName(savedProfiles[0].id)
    }
  }, [savedProfiles, profileName])

  useEffect(() => {
    let unlisten: (() => void) | undefined
    const setupListener = async () => {
      try {
        unlisten = await tauriApi.on('publisher-log-reply', (msg: string) => setLogs(prev => [...prev, msg]))
      } catch {
        // The preview browser does not expose Tauri events.
      }
    }
    setupListener()
    return () => unlisten?.()
  }, [])

  const togglePlatform = (id: string) => setPlatforms((prev: any) => ({ ...prev, [id]: !prev[id] }))

  const handleAddProfile = async () => {
    const newName = prompt('Enter a channel profile name:')
    if (!newName?.trim()) return
    setLoading(true)
    try {
      const profile = { id: `prof_${Date.now()}`, name: newName.trim().replace(/[^a-zA-Z0-9_\u0600-\uFFFF ]/g, '_') }
      setSavedProfiles(prev => [profile, ...prev])
      setProfileName(profile.id)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProfile = async () => {
    const target = savedProfiles.find(profile => profile.id === profileName)
    if (!target || !window.confirm(`Delete profile [${target.name}]?`)) return
    setLoading(true)
    try {
      setSavedProfiles(prev => prev.filter(profile => profile.id !== profileName))
    } finally {
      setLoading(false)
    }
  }

  const handleImportVideo = async () => {
    try {
      const result: any = await tauriApi.invoke('select_publisher_video_file')
      if (Array.isArray(result) && result.length > 0) {
        addVideosFromNative(result.map((file: any) => ({ name: file.name, path: file.path })))
        setLogs(prev => [...prev, `Loaded ${result.length} video(s) into the queue.`])
      }
    } catch (err: any) {
      setCustomModal({ show: true, title: 'IMPORT ERROR', message: String(err) })
    }
  }

  const getSelectedProfileName = () => savedProfiles.find(profile => profile.id === profileName)?.name || 'Default'

  const handleSetupAccount = async (platformId: string) => {
    try {
      await tauriApi.invoke('setup_publisher_account', { platform: platformId, profileName: getSelectedProfileName(), uploadMethod })
    } catch (error: any) {
      setLogs(prev => [...prev, `Error: ${String(error)}`])
    }
  }

  const handleResetStatuses = () => {
    resetAllStatuses()
    setLogs(['Queue statuses reset.'])
  }

  const handlePublishSingle = async (id: string, currentMode?: 'publish' | 'draft') => {
    if (isPublishing) return
    const task = videoQueue.find((video: any) => video.id === id)
    if (!task) return
    if (!task.metadata.title?.trim()) {
      setCustomModal({ show: true, title: 'MISSING TITLE', message: 'Enter a title before publishing this video.' })
      return
    }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) {
      setCustomModal({ show: true, title: 'NO PLATFORM SELECTED', message: 'Select at least one target platform.' })
      return
    }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    const realName = getSelectedProfileName()
    setLogs([`Publishing to [${realName}] via [${uploadMethod.toUpperCase()}]...`])
    updateStatus(task.id, 'processing')

    try {
      const response: any = await tauriApi.invoke('trigger_puppeteer_publish', {
        config: {
          videoPath: task.filePath,
          metadata: task.metadata,
          platforms,
          publishMode: activeMode,
          uploadMethod,
          profileName: realName,
          youtubeClientId: localStorage.getItem('yt_client_id') || '',
          youtubeClientSecret: localStorage.getItem('yt_client_secret') || '',
          requireNewLogin: true
        }
      })
      if (response?.success) {
        updateStatus(task.id, 'success')
        setLogs(prev => [...prev, 'Published successfully.'])
      } else {
        updateStatus(task.id, 'error')
        setCustomModal({ show: true, title: 'PUBLISH FAILED', message: response?.error || 'The publish operation failed.' })
      }
    } catch (err: any) {
      updateStatus(task.id, 'error')
      setLogs(prev => [...prev, `Error: ${String(err)}`])
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePublish = async (currentMode?: 'publish' | 'draft') => {
    const tasksToRun = videoQueue.filter((video: any) => video.status !== 'success')
    if (tasksToRun.length === 0) {
      setCustomModal({ show: true, title: 'QUEUE EMPTY', message: 'There are no videos to publish.' })
      return
    }
    if (!platforms.tiktok && !platforms.youtube && !platforms.facebook) {
      setCustomModal({ show: true, title: 'NO PLATFORM SELECTED', message: 'Select at least one target platform.' })
      return
    }

    setIsPublishing(true)
    const activeMode = currentMode || publishMode
    const realName = getSelectedProfileName()
    let successCount = 0
    let isFirstVideo = true
    setLogs([`Starting upload queue for [${realName}] via [${uploadMethod.toUpperCase()}]...`])

    for (const task of tasksToRun) {
      if (!task.metadata.title?.trim()) {
        updateStatus(task.id, 'error')
        setLogs(prev => [...prev, `Skipped ${task.fileName}: title is missing.`])
        continue
      }
      updateStatus(task.id, 'processing')
      try {
        const response: any = await tauriApi.invoke('trigger_puppeteer_publish', {
          config: {
            videoPath: task.filePath,
            metadata: task.metadata,
            platforms,
            publishMode: activeMode,
            uploadMethod,
            profileName: realName,
            youtubeClientId: localStorage.getItem('yt_client_id') || '',
            youtubeClientSecret: localStorage.getItem('yt_client_secret') || '',
            requireNewLogin: isFirstVideo
          }
        })
        isFirstVideo = false
        if (response?.success) {
          successCount++
          updateStatus(task.id, 'success')
          setLogs(prev => [...prev, `Success: ${task.fileName}`])
        } else {
          updateStatus(task.id, 'error')
          setLogs(prev => [...prev, `Failed: ${task.fileName}`])
        }
      } catch (err: any) {
        updateStatus(task.id, 'error')
        setLogs(prev => [...prev, `Error: ${String(err)}`])
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsPublishing(false)
    setCustomModal({ show: true, title: 'PUBLISH COMPLETE', message: `Published ${successCount} / ${tasksToRun.length} video(s).` })
  }

  return {
    videoQueue, selectedVideoId, setSelectedVideoId, updateMetadata, removeVideo,
    logs, isPublishing, loading, platforms, togglePlatform,
    publishMode, setPublishMode, uploadMethod, setUploadMethod,
    profileName, setProfileName, savedProfiles, handleAddProfile, handleDeleteProfile,
    handleSetupAccount, handleImportVideo, handlePublish, handlePublishSingle, handleResetStatuses
  }
}
