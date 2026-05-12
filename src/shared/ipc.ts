export type CompileResult =
  | { ok: true; outputPath: string; sizeBytes: number; message: string }
  | { ok: false; error: string }

export type DecompileResult =
  | { ok: true; yamlText: string }
  | { ok: false; error: string }

export interface ListedPreset {
  fileName: string
  fullPath: string
  presetName: string | null
  modifiedTime: number
  sizeBytes: number
}

export interface API {
  compileYaml(yamlText: string, outputDir: string): Promise<CompileResult>
  decompilePrst(prstPath: string): Promise<DecompileResult>
  listPresets(dir: string): Promise<ListedPreset[]>
  openFolder(dir: string): Promise<void>
  pickOutputDir(): Promise<string | null>
  readYamlFile(filePath: string): Promise<string>
  getDefaultOutputDir(): Promise<string>
  saveAs(yamlText: string): Promise<string | null>
}
