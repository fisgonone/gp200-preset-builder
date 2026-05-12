import { describe, it, expect, afterEach } from 'vitest'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const TOOLKIT_DIR = path.resolve(__dirname, '..', '..', 'gp200-toolkit')
const COMPILER = path.join(TOOLKIT_DIR, 'prst_compile.py')
const PYTHON = process.platform === 'win32' ? 'python' : 'python3'

const VALID_YAML = `name: Test Preset
slots:
  AMP:
    effect: Clean Combo
    Volume: 70
  CAB:
    effect: 1x12 Blackface
`

const INVALID_YAML = `name: Bad Preset
slots:
  AMP:
    effect: EFFECT_THAT_DOES_NOT_EXIST_XYZ
`

function spawnCompile(yamlText: string, outPath: string): Promise<{ code: number; stderr: string }> {
  return new Promise(async (resolve) => {
    const tmpYaml = path.join(os.tmpdir(), `gp200-test-${Date.now()}.yaml`)
    await fs.writeFile(tmpYaml, yamlText, 'utf8')
    const proc = spawn(PYTHON, [COMPILER, tmpYaml, '-o', outPath], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    })
    let stderr = ''
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()))
    proc.on('close', async (code) => {
      await fs.unlink(tmpYaml).catch(() => {})
      resolve({ code: code ?? 1, stderr })
    })
  })
}

const tmpFiles: string[] = []
afterEach(async () => {
  for (const f of tmpFiles) await fs.unlink(f).catch(() => {})
  tmpFiles.length = 0
})

describe('compiler bridge', () => {
  it('compiles valid YAML to a 1224-byte .prst with TSRP magic', async () => {
    const outPath = path.join(os.tmpdir(), `gp200-valid-${Date.now()}.prst`)
    tmpFiles.push(outPath)

    const { code } = await spawnCompile(VALID_YAML, outPath)
    expect(code).toBe(0)

    const buf = await fs.readFile(outPath)
    expect(buf.length).toBe(1224)
    expect(buf.slice(0, 4).toString('ascii')).toBe('TSRP')
  }, 30_000)

  it('returns non-zero exit and non-empty stderr for invalid YAML', async () => {
    const outPath = path.join(os.tmpdir(), `gp200-invalid-${Date.now()}.prst`)
    tmpFiles.push(outPath)

    const { code, stderr } = await spawnCompile(INVALID_YAML, outPath)
    expect(code).not.toBe(0)
    expect(stderr.trim().length).toBeGreaterThan(0)
  }, 30_000)
})
