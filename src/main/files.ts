import fs from 'fs/promises'
import path from 'path'
import { shell, dialog, app } from 'electron'
import type { ListedPreset } from '@shared/ipc'

function readPresetName(buffer: Buffer): string | null {
  // Preset name at offset 0x44, max 16 bytes, null-terminated ASCII
  const OFFSET_PATCH_NAME = 0x44
  const PATCH_NAME_MAX = 16
  const slice = buffer.slice(OFFSET_PATCH_NAME, OFFSET_PATCH_NAME + PATCH_NAME_MAX)
  const nullIdx = slice.indexOf(0)
  const raw = nullIdx >= 0 ? slice.slice(0, nullIdx) : slice
  const name = raw.toString('ascii').trim()
  return name || null
}

export async function listPresets(dir: string): Promise<ListedPreset[]> {
  try {
    await fs.mkdir(dir, { recursive: true })
    const entries = await fs.readdir(dir)
    const results: ListedPreset[] = []

    for (const entry of entries) {
      if (!entry.toLowerCase().endsWith('.prst')) continue
      const fullPath = path.join(dir, entry)
      try {
        const stat = await fs.stat(fullPath)
        let presetName: string | null = null
        try {
          const buf = await fs.readFile(fullPath)
          presetName = readPresetName(buf)
        } catch {
          // ignore read errors
        }
        results.push({
          fileName: entry,
          fullPath,
          presetName,
          modifiedTime: stat.mtimeMs,
          sizeBytes: stat.size,
        })
      } catch {
        // skip inaccessible files
      }
    }

    return results.sort((a, b) => b.modifiedTime - a.modifiedTime)
  } catch {
    return []
  }
}

export async function openFolder(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true }).catch(() => {})
  await shell.openPath(dir)
}

export async function pickOutputDir(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Select output directory for presets',
    properties: ['openDirectory', 'createDirectory'],
  })
  return result.canceled ? null : result.filePaths[0] ?? null
}

export async function readYamlFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8')
}

export function getDefaultOutputDir(): string {
  return path.join(app.getPath('documents'), 'GP-200 Presets')
}

export async function saveAs(yamlText: string): Promise<string | null> {
  const result = await dialog.showSaveDialog({
    title: 'Save preset YAML',
    defaultPath: 'preset.yaml',
    filters: [{ name: 'YAML', extensions: ['yaml', 'yml'] }],
  })
  if (result.canceled || !result.filePath) return null
  await fs.writeFile(result.filePath, yamlText, 'utf8')
  return result.filePath
}
