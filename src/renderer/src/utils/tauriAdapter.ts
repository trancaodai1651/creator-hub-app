import { invoke } from '@tauri-apps/api/core';
import { listen, Event } from '@tauri-apps/api/event';

export const tauriApi = {
  // Thay thế cho: window.electron.ipcRenderer.invoke
  invoke: async <T>(cmd: string, args?: any): Promise<T> => {
    try {
      // Đổi tên lệnh từ kebab-case (VD: ask-groq-chatbot) sang snake_case (ask_groq_chatbot) để chuẩn chuẩn Rust
      const rustCmd = cmd.replace(/-/g, '_');
      return await invoke<T>(rustCmd, args);
    } catch (error) {
      console.error(`Lỗi Tauri Invoke [${cmd}]:`, error);
      throw error;
    }
  },

  // Thay thế cho: window.electron.ipcRenderer.on
  on: async (eventName: string, callback: (data: any) => void) => {
    const unlisten = await listen(eventName, (event: Event<any>) => {
      // Tauri bọc dữ liệu trong payload, ta trích xuất nó ra để giống hệt Electron
      callback(event.payload);
    });
    return unlisten; // Trả về hàm hủy lắng nghe
  }
};