/* eslint-disable */
export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_HUB_API_URL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    electron: any
    api: any
  }
}
