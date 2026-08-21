import { invoke } from '@tauri-apps/api/core'
import { listen, Event } from '@tauri-apps/api/event'

const hasTauriRuntime = () => typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__)
const hasElectronRuntime = () => typeof window !== 'undefined' && Boolean((window as any).electron?.ipcRenderer?.invoke)

export const tauriApi = {
  invoke: async <T>(cmd: string, args?: any): Promise<T> => {
    if (hasTauriRuntime()) {
      const rustCmd = cmd.replace(/-/g, '_')
      return invoke<T>(rustCmd, args)
    }
    if (hasElectronRuntime()) return (window as any).electron.ipcRenderer.invoke(cmd, args) as Promise<T>
    return undefined as T
  },

  on: async (eventName: string, callback: (data: any) => void) => {
    if (!hasTauriRuntime()) return () => {}
    const unlisten = await listen(eventName, (event: Event<any>) => callback(event.payload))
    return unlisten
  }
}
