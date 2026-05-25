/* eslint-disable */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  // 🚀 CHỐT CHẶN CỐT LÕI: Ép Vite coi thư mục src/renderer làm cửa ngõ chứa index.html
  root: resolve(__dirname, 'src/renderer'),

  plugins: [
    react(),
    tailwindcss() // Luôn sáng và kích hoạt mượt mà cho Tailwind v4
  ],

  resolve: {
    alias: {
      // Giữ nguyên đường dẫn alias thuận tiện cho việc import trong dự án của bạn
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },

  build: {
    // 🚀 ĐÃ ĐƯA VÀO ĐÚNG VỊ TRÍ: Nơi xuất bản file tĩnh sau khi biên dịch
    outDir: resolve(__dirname, 'src/renderer/dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  },

  // Cấu hình cổng kết nối và môi trường tối ưu riêng cho Tauri v2
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    watch: {
      // 🚀 BẢO VỆ TIẾN TRÌNH: Bỏ qua thư mục Rust để tránh việc lưu code Rust làm Vite bị reload ảo
      ignored: ['**/src-tauri/**']
    }
  }
})