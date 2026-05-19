import { ElectronAPI } from '@electron-toolkit/preload'
import { contextBridge, webUtils } from 'electron' // 1. Thêm webUtils vào đây
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 2. Thêm hàm getPath này vào để React có thể mượn dùng
  getPath: (file: File) => webUtils.getPathForFile(file)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
