import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import type { CompileResult, DecompileResult } from '@shared/ipc'

function pythonPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'python.exe')
  }
  return process.platform === 'win32' ? 'python' : 'python3'
}

function toolkitBase(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'python', 'compiler')
  }
  return path.join(__dirname, '..', '..', '..', 'gp200-toolkit')
}

function compilerScript(): string {
  return path.join(toolkitBase(), 'prst_compile.py')
}

function decompilerScript(): string {
  return path.join(toolkitBase(), 'prst_decompile.py')
}

function parseNameFromYaml(yamlText: string): string | null {
  try {
    const obj = yaml.load(yamlText) as Record<string, unknown>
    if (obj && typeof obj.name === 'string' && obj.name.trim()) {
      return obj.name.trim()
    }
  } catch {
    // ignore parse errors
  }
  return null
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'preset'
}

export async function compileYaml(
  yamlText: string,
  outputDir: string,
): Promise<CompileResult> {
  const ts = Date.now()
  const tmp = path.join(app.getPath('temp'), `gp200-${ts}.yaml`)
  const tmpOut = path.join(app.getPath('temp'), `gp200-${ts}.prst`)

  await fs.writeFile(tmp, yamlText, 'utf8')

  await fs.mkdir(outputDir, { recursive: true })

  return new Promise((resolve) => {
    const proc = spawn(pythonPath(), [compilerScript(), tmp, '-o', tmpOut], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    let stderr = ''
    let stdout = ''
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))

    proc.on('close', async (code) => {
      await fs.unlink(tmp).catch(() => {})
      if (code !== 0) {
        await fs.unlink(tmpOut).catch(() => {})
        return resolve({ ok: false, error: stderr.trim() || `Compiler exited with code ${code}` })
      }

      const presetName = parseNameFromYaml(yamlText) ?? 'preset'
      const safeName = sanitizeFilename(presetName)
      const finalPath = path.join(outputDir, `${safeName}.prst`)

      try {
        await fs.rename(tmpOut, finalPath)
        const stat = await fs.stat(finalPath)
        resolve({
          ok: true,
          outputPath: finalPath,
          sizeBytes: stat.size,
          message: stdout.trim() || `Compiled ${safeName}.prst (${stat.size} bytes)`,
        })
      } catch (err) {
        await fs.unlink(tmpOut).catch(() => {})
        resolve({ ok: false, error: String(err) })
      }
    })

    proc.on('error', (err) => {
      resolve({ ok: false, error: `Failed to start Python: ${err.message}` })
    })
  })
}

export async function decompilePrst(prstPath: string): Promise<DecompileResult> {
  const tmpOut = path.join(app.getPath('temp'), `gp200-decompile-${Date.now()}.yaml`)

  return new Promise((resolve) => {
    const proc = spawn(pythonPath(), [decompilerScript(), prstPath, '-o', tmpOut], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    let stderr = ''
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))

    proc.on('close', async (code) => {
      if (code !== 0) {
        await fs.unlink(tmpOut).catch(() => {})
        return resolve({ ok: false, error: stderr.trim() || `Decompiler exited with code ${code}` })
      }
      try {
        const yamlText = await fs.readFile(tmpOut, 'utf8')
        await fs.unlink(tmpOut).catch(() => {})
        resolve({ ok: true, yamlText })
      } catch (err) {
        resolve({ ok: false, error: String(err) })
      }
    })

    proc.on('error', (err) => {
      resolve({ ok: false, error: `Failed to start Python: ${err.message}` })
    })
  })
}
