import { spawn } from 'child_process'
import path from 'path'
import { app } from 'electron'
import fs from 'fs/promises'
import yaml from 'js-yaml'
import type { Catalog, CompileResult, DecompileResult, ValidateResult } from '@shared/ipc'

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
  return process.env['GP200_TOOLKIT'] ?? path.join(__dirname, '..', '..', '..', 'gp200-toolkit')
}

function script(name: string): string {
  return path.join(toolkitBase(), name)
}

interface RunResult {
  code: number | null
  stdout: string
  stderr: string
  spawnError?: string
}

/** Run a toolkit script, optionally feeding text on stdin. Never rejects. */
function runPython(args: string[], stdin?: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const proc = spawn(pythonPath(), args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString('utf8')))
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString('utf8')))
    proc.on('error', (err) => resolve({ code: null, stdout, stderr, spawnError: err.message }))
    proc.on('close', (code) => resolve({ code, stdout, stderr }))
    if (stdin !== undefined) proc.stdin.end(stdin, 'utf8')
  })
}

/** Split the toolkit's stderr into problem lines ("  - ...") and warnings ("warning: ..."). */
function parseDiagnostics(stderr: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  for (const raw of stderr.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('- ')) errors.push(line.slice(2))
    else if (line.startsWith('warning: ')) warnings.push(line.slice(9))
  }
  return { errors, warnings }
}

function parseNameFromYaml(yamlText: string): string | null {
  try {
    const obj = yaml.load(yamlText) as Record<string, unknown>
    if (obj && typeof obj.name === 'string' && obj.name.trim()) {
      return obj.name.trim().slice(0, 16)
    }
  } catch {
    // ignore parse errors
  }
  return null
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'preset'
}

export async function compileYaml(yamlText: string, outputDir: string): Promise<CompileResult> {
  const tmpOut = path.join(app.getPath('temp'), `gp200-${Date.now()}.prst`)
  await fs.mkdir(outputDir, { recursive: true })

  const r = await runPython([script('prst_compile.py'), '-', '-o', tmpOut], yamlText)
  if (r.spawnError) return { ok: false, error: `Failed to start Python: ${r.spawnError}` }
  if (r.code !== 0) {
    await fs.unlink(tmpOut).catch(() => {})
    return { ok: false, error: r.stderr.trim() || `Compiler exited with code ${r.code}` }
  }

  const { warnings } = parseDiagnostics(r.stderr)
  const safeName = sanitizeFilename(parseNameFromYaml(yamlText) ?? 'preset')
  const finalPath = path.join(outputDir, `${safeName}.prst`)
  try {
    await fs.copyFile(tmpOut, finalPath) // rename fails across drives (temp vs. OneDrive)
    await fs.unlink(tmpOut).catch(() => {})
    const stat = await fs.stat(finalPath)
    return {
      ok: true,
      outputPath: finalPath,
      sizeBytes: stat.size,
      message: `Compiled ${safeName}.prst (${stat.size} bytes)`,
      warnings,
    }
  } catch (err) {
    await fs.unlink(tmpOut).catch(() => {})
    return { ok: false, error: String(err) }
  }
}

export async function validateYaml(yamlText: string): Promise<ValidateResult> {
  const r = await runPython([script('prst_compile.py'), '-', '--check'], yamlText)
  if (r.spawnError) return { ok: false, errors: [`Failed to start Python: ${r.spawnError}`], warnings: [] }
  const { errors, warnings } = parseDiagnostics(r.stderr)
  if (r.code !== 0 && errors.length === 0) errors.push(r.stderr.trim() || `Compiler exited with code ${r.code}`)
  return { ok: r.code === 0, errors, warnings }
}

let catalogCache: Catalog | null = null

export async function getCatalog(): Promise<Catalog | null> {
  if (catalogCache) return catalogCache
  try {
    const text = await fs.readFile(path.join(toolkitBase(), 'gp200_catalog.json'), 'utf8')
    catalogCache = JSON.parse(text) as Catalog
    return catalogCache
  } catch {
    return null
  }
}

export async function decompilePrst(prstPath: string): Promise<DecompileResult> {
  const r = await runPython([script('prst_decompile.py'), prstPath])
  if (r.spawnError) return { ok: false, error: `Failed to start Python: ${r.spawnError}` }
  if (r.code !== 0) return { ok: false, error: r.stderr.trim() || `Decompiler exited with code ${r.code}` }
  return { ok: true, yamlText: r.stdout.replace(/\r\n/g, '\n') }
}
