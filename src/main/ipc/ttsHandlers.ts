/* eslint-disable */
import { ipcMain, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { spawnSync } from 'child_process'

const modelId = 'k2-fsa/OmniVoice'

const getScriptPath = () => {
  const packaged = path.join(process.resourcesPath, 'scripts', 'omnivoice_adapter.py')
  if (fs.existsSync(packaged)) return packaged
  return path.join(app.getAppPath(), 'src-tauri', 'scripts', 'omnivoice_adapter.py')
}

const getBundledVoiceDirectory = () => {
  const packaged = path.join(process.resourcesPath, 'voices')
  if (fs.existsSync(packaged)) return packaged
  return path.join(app.getAppPath(), 'src-tauri', 'resources', 'voices')
}

const runAdapter = (action: string, args: string[] = []) => {
  const script = getScriptPath()
  const command = process.platform === 'win32' ? 'py' : 'python3'
  const commandArgs = process.platform === 'win32' ? ['-3', script, ...args, action] : [script, ...args, action]
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 * 8 })
  const stdout = String(result.stdout || '').trim()
  const stderr = String(result.stderr || '').trim()
  let payload: any = {}
  try { payload = stdout ? JSON.parse(stdout) : {} } catch { payload = { message: stdout } }
  if (result.error) throw result.error
  if (result.status !== 0 || payload.success === false) throw new Error(payload.message || stderr || 'OmniVoice không thể xử lý yêu cầu.')
  return payload
}

export function registerTtsHandlers() {
  ipcMain.handle('omnivoice-status', () => runAdapter('status'))

  ipcMain.handle('list-bundled-omnivoice-voices', () => {
    const directory = getBundledVoiceDirectory()
    if (!fs.existsSync(directory)) return []
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.pt')
      .map(entry => {
        const stem = path.basename(entry.name, path.extname(entry.name))
        return {
          id: `bundled-${stem}`,
          name: stem.replace(/[_-]+/g, ' '),
          mode: 'clone',
          source: 'bundled',
          promptPath: path.join(directory, entry.name)
        }
      })
      .sort((left, right) => left.name.localeCompare(right.name))
  })

  ipcMain.handle('install-omnivoice-runtime', () => {
    const command = process.platform === 'win32' ? 'py' : 'python3'
    const args = process.platform === 'win32' ? ['-3', '-m', 'pip', 'install', '--upgrade', 'git+https://github.com/k2-fsa/OmniVoice.git'] : ['-m', 'pip', 'install', '--upgrade', 'git+https://github.com/k2-fsa/OmniVoice.git']
    const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true, maxBuffer: 1024 * 1024 * 8 })
    if (result.status !== 0) throw new Error(String(result.stderr || 'Cài lõi OmniVoice thất bại.').trim())
    return { success: true, message: 'Đã cài lõi OmniVoice. Có thể cần tải model ở lần tạo giọng đầu tiên.' }
  })

  ipcMain.handle('clone-omnivoice-voice', (_event, input: any) => {
    const root = input.projectDir || path.join(app.getPath('userData'), 'creator-hub', 'project-default')
    const promptPath = path.join(root, 'voices', `${String(input.name || 'voice').replace(/[^a-z0-9_-]/gi, '_')}_${Date.now()}.pt`)
    fs.mkdirSync(path.dirname(promptPath), { recursive: true })
    const result = runAdapter('clone', ['--ref-audio', input.referenceAudio, '--ref-text', input.referenceText, '--prompt-path', promptPath, '--device', input.device || 'auto', '--model', input.modelId || modelId])
    return { ...result, voiceId: path.basename(promptPath, '.pt'), promptPath, projectDir: root }
  })

  ipcMain.handle('generate-omnivoice-voice', (_event, input: any) => {
    const root = input.projectDir || path.join(app.getPath('userData'), 'creator-hub', 'project-default')
    const outputDir = input.outputDir || path.join(root, 'audio')
    fs.mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, `${String(input.voiceId || 'omnivoice').replace(/[^a-z0-9_-]/gi, '_')}_${Date.now()}.wav`)
    const args = ['--text', input.text, '--language', input.language || 'auto', '--output', outputPath, '--device', input.device || 'auto', '--model', input.modelId || modelId]
    if (input.promptPath) args.push('--prompt-path', input.promptPath)
    if (input.referenceAudio) args.push('--ref-audio', input.referenceAudio)
    if (input.referenceText) args.push('--ref-text', input.referenceText)
    if (input.voiceInstruction) args.push('--instruct', input.voiceInstruction)
    return { ...runAdapter('generate', args), outputPath, projectDir: root }
  })
}
