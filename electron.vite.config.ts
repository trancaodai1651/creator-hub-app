import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Dòng này sẽ sáng lên!

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    // LÝ DO DÒNG TRÊN BỊ MỜ LÀ VÌ BẠN ĐÃ QUÊN THÊM CHỮ tailwindcss() VÀO DÒNG DƯỚI NÀY:
    plugins: [react(), tailwindcss()] 
  }
})