import { contextBridge, ipcRenderer } from 'electron'
import type { API } from '@shared/ipc'

const api: API = {
  compileYaml: (yamlText, outputDir) =>
    ipcRenderer.invoke('compile-yaml', yamlText, outputDir),

  validateYaml: (yamlText) =>
    ipcRenderer.invoke('validate-yaml', yamlText),

  getCatalog: () =>
    ipcRenderer.invoke('get-catalog'),

  decompilePrst: (prstPath) =>
    ipcRenderer.invoke('decompile-prst', prstPath),

  listPresets: (dir) =>
    ipcRenderer.invoke('list-presets', dir),

  openFolder: (dir) =>
    ipcRenderer.invoke('open-folder', dir),

  pickOutputDir: () =>
    ipcRenderer.invoke('pick-output-dir'),

  readYamlFile: (filePath) =>
    ipcRenderer.invoke('read-yaml-file', filePath),

  getDefaultOutputDir: () =>
    ipcRenderer.invoke('get-default-output-dir'),

  saveAs: (yamlText) =>
    ipcRenderer.invoke('save-as', yamlText),
}

contextBridge.exposeInMainWorld('api', api)

// Expose store helpers
contextBridge.exposeInMainWorld('store', {
  get: (key: string) => ipcRenderer.invoke('store-get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
})
