/* eslint-disable */
export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_HUB_API_URL?: string
    readonly VITE_GEMINI_API_KEY?: string
    readonly VITE_GEMINI_MODEL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    electron: any
    api: any
  }
}
