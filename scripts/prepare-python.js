#!/usr/bin/env node
/**
 * prepare-python.js
 *
 * 1. Downloads python-3.11.x-embed-amd64.zip from python.org if not cached.
 * 2. Extracts it to resources/python/.
 * 3. Patches pythonXX._pth to include Lib\site-packages.
 * 4. Installs pip then PyYAML into resources/python/Lib/site-packages.
 * 5. Copies gp200-toolkit compiler files into resources/python/compiler/.
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { execSync, spawnSync } = require('child_process')
const { createWriteStream, existsSync } = require('fs')

const PYTHON_VERSION = '3.11.9'
const PYTHON_ZIP_NAME = `python-${PYTHON_VERSION}-embed-amd64.zip`
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/${PYTHON_ZIP_NAME}`
const GET_PIP_URL = 'https://bootstrap.pypa.io/get-pip.py'

const ROOT = path.resolve(__dirname, '..')
const RESOURCES_PYTHON = path.join(ROOT, 'resources', 'python')
const COMPILER_DST = path.join(RESOURCES_PYTHON, 'compiler')
const TOOLKIT_SRC = path.join(ROOT, '..', 'gp200-toolkit')
const CACHE_DIR = path.join(ROOT, '.cache')
const CACHED_ZIP = path.join(CACHE_DIR, PYTHON_ZIP_NAME)

async function download(url, dest) {
  console.log(`  Downloading ${url}`)
  await fsp.mkdir(path.dirname(dest), { recursive: true })
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest)
    const proto = url.startsWith('https') ? https : http
    function get(u) {
      proto.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()
          return get(res.headers.location)
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${u}`))
          return
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      }).on('error', reject)
    }
    get(url)
  })
}

async function extractZip(zipPath, destDir) {
  console.log(`  Extracting ${path.basename(zipPath)} → ${destDir}`)
  await fsp.mkdir(destDir, { recursive: true })

  // Use PowerShell on Windows (available without extra deps)
  const result = spawnSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Expand-Archive -Force -Path "${zipPath}" -DestinationPath "${destDir}"`,
  ], { stdio: 'inherit' })

  if (result.status !== 0) throw new Error('Extraction failed')
}

async function patchPthFile(pythonDir) {
  const pthFiles = (await fsp.readdir(pythonDir)).filter((f) => f.endsWith('._pth'))
  if (pthFiles.length === 0) {
    console.warn('  Warning: no ._pth file found — skipping patch')
    return
  }
  const pthPath = path.join(pythonDir, pthFiles[0])
  let content = await fsp.readFile(pthPath, 'utf8')
  if (!content.includes('Lib\\site-packages')) {
    content += '\nLib\\site-packages\n'
    await fsp.writeFile(pthPath, content, 'utf8')
    console.log(`  Patched ${pthFiles[0]}`)
  }
}

async function installPip(pythonExe, sitePackages) {
  const getPipPath = path.join(CACHE_DIR, 'get-pip.py')
  if (!existsSync(getPipPath)) {
    await download(GET_PIP_URL, getPipPath)
  }
  console.log('  Installing pip…')
  const r = spawnSync(pythonExe, [getPipPath, '--target', sitePackages, '--no-warn-script-location'], {
    stdio: 'inherit',
  })
  if (r.status !== 0) throw new Error('pip install failed')
}

async function installPyYaml(pythonExe, sitePackages) {
  console.log('  Installing PyYAML…')
  const r = spawnSync(pythonExe, [
    '-m', 'pip', 'install', 'pyyaml',
    '--target', sitePackages,
    '--no-warn-script-location',
    '--quiet',
  ], {
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: sitePackages },
  })
  if (r.status !== 0) throw new Error('PyYAML install failed')
}

async function copyToolkit() {
  console.log(`  Copying toolkit from ${TOOLKIT_SRC}`)
  await fsp.mkdir(COMPILER_DST, { recursive: true })
  const files = ['prst_compile.py', 'prst_decompile.py', 'gp200_catalog.json', 'template.prst']
  for (const f of files) {
    const src = path.join(TOOLKIT_SRC, f)
    if (!existsSync(src)) {
      console.warn(`  Warning: ${f} not found at ${src}`)
      continue
    }
    await fsp.copyFile(src, path.join(COMPILER_DST, f))
    console.log(`    Copied ${f}`)
  }
}

async function main() {
  console.log('\n=== prepare-python ===\n')

  // Step 1: Download embeddable Python
  if (!existsSync(CACHED_ZIP)) {
    console.log('[1/5] Downloading Python embeddable…')
    await download(PYTHON_URL, CACHED_ZIP)
  } else {
    console.log('[1/5] Python zip already cached — skipping download')
  }

  // Step 2: Extract
  console.log('[2/5] Extracting Python…')
  if (existsSync(RESOURCES_PYTHON)) {
    await fsp.rm(RESOURCES_PYTHON, { recursive: true, force: true })
  }
  await extractZip(CACHED_ZIP, RESOURCES_PYTHON)

  // Step 3: Patch ._pth
  console.log('[3/5] Patching ._pth…')
  await patchPthFile(RESOURCES_PYTHON)

  const pythonExe = path.join(RESOURCES_PYTHON, 'python.exe')
  const sitePackages = path.join(RESOURCES_PYTHON, 'Lib', 'site-packages')
  await fsp.mkdir(sitePackages, { recursive: true })

  // Step 4: pip + PyYAML
  console.log('[4/5] Installing pip and PyYAML…')
  await installPip(pythonExe, sitePackages)
  await installPyYaml(pythonExe, sitePackages)

  // Step 5: Copy toolkit
  console.log('[5/5] Copying toolkit…')
  await copyToolkit()

  console.log('\n✓ Python environment ready at resources/python/\n')
}

main().catch((err) => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
