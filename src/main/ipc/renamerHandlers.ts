/* eslint-disable */
import { ipcMain } from 'electron'
import * as fs from 'fs'

export function registerRenamerHandlers() {
  ipcMain.handle('execute-batch-rename', async (_event, { fileRules }: any) => {
    if (!fileRules || fileRules.length === 0) return { success: false, message: "Không có file nào để đổi tên!" }
    try { let successCount = 0; for (const rule of fileRules) { if (fs.existsSync(rule.oldPath)) { fs.renameSync(rule.oldPath, rule.newPath); successCount++ } }; return { success: true, message: `Đã đổi tên hàng loạt thành công ${successCount}/${fileRules.length} tập tin.` } } 
    catch (err: any) { return { success: false, message: `Lỗi hệ thống file: ${err.message}` } }
  })
}