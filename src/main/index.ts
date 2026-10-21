import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs/promises'
import { compileYaml, decompilePrst, getCatalog, validateYaml } from './compiler'
import { listPresets, openFolder, pickOutputDir, readYamlFile, getDefaultOutputDir, saveAs } from './files'

interface StoreSchema {
  outputDir: string
  lastYaml: string
  windowBounds: { x: number; y: number; width: number; height: number }
}

const store = new Store<StoreSchema>({
  defaults: {
    outputDir: '',
    lastYaml: '',
    windowBounds: { x: 0, y: 0, width: 1280, height: 800 },
  },
})

function createWindow(): void {
  const bounds = store.get('windowBounds')

  const win = new BrowserWindow({
    x: bounds.x || undefined,
    y: bounds.y || undefined,
    width: bounds.width,
    height: bounds.height,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1C232A',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1C232A',
      symbolColor: '#ECE5D3',
      height: 38,
    },
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.on('close', () => {
    const b = win.getBounds()
    store.set('windowBounds', { x: b.x, y: b.y, width: b.width, height: b.height })
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const defaultDir = getDefaultOutputDir()
  if (!store.get('outputDir')) {
    store.set('outputDir', defaultDir)
  }
  await fs.mkdir(store.get('outputDir'), { recursive: true }).catch(() => {})
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('compile-yaml', async (_e, yamlText: string, outputDir: string) => {
  return compileYaml(yamlText, outputDir)
})

ipcMain.handle('validate-yaml', async (_e, yamlText: string) => {
  return validateYaml(yamlText)
})

ipcMain.handle('get-catalog', async () => {
  return getCatalog()
})

ipcMain.handle('decompile-prst', async (_e, prstPath: string) => {
  return decompilePrst(prstPath)
})

ipcMain.handle('list-presets', async (_e, dir: string) => {
  return listPresets(dir)
})

ipcMain.handle('open-folder', async (_e, dir: string) => {
  return openFolder(dir)
})

ipcMain.handle('pick-output-dir', async () => {
  return pickOutputDir()
})

ipcMain.handle('read-yaml-file', async (_e, filePath: string) => {
  return readYamlFile(filePath)
})

ipcMain.handle('get-default-output-dir', () => {
  return getDefaultOutputDir()
})

ipcMain.handle('save-as', async (_e, yamlText: string) => {
  return saveAs(yamlText)
})

ipcMain.handle('store-get', (_e, key: string) => {
  return store.get(key as keyof StoreSchema)
})

ipcMain.handle('store-set', (_e, key: string, value: unknown) => {
  store.set(key as keyof StoreSchema, value as StoreSchema[keyof StoreSchema])
})

ipcMain.handle('open-external', (_e, url: string) => {
  shell.openExternal(url)
})
