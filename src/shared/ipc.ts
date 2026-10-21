export type CompileResult =
  | { ok: true; outputPath: string; sizeBytes: number; message: string; warnings: string[] }
  | { ok: false; error: string }

export type DecompileResult =
  | { ok: true; yamlText: string }
  | { ok: false; error: string }

/** Result of checking YAML against the toolkit without writing a file. */
export interface ValidateResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface CatalogParam {
  name: string
  kind: 'knob' | 'slider' | 'switch' | 'combo'
  id: number
  default: number
  min: number
  max: number
  unit?: string
  options?: { name: string; value: number }[]
  min_is_off?: boolean
  value_type?: number
  bind?: number
}

export interface CatalogEffect {
  code: number
  name: string
  modules: string[]
  cab_code?: number
  params: CatalogParam[]
}

export interface Catalog {
  modules: string[]
  effects: CatalogEffect[]
}

export interface ListedPreset {
  fileName: string
  fullPath: string
  presetName: string | null
  modifiedTime: number
  sizeBytes: number
}

export interface API {
  compileYaml(yamlText: string, outputDir: string): Promise<CompileResult>
  validateYaml(yamlText: string): Promise<ValidateResult>
  getCatalog(): Promise<Catalog | null>
  decompilePrst(prstPath: string): Promise<DecompileResult>
  listPresets(dir: string): Promise<ListedPreset[]>
  openFolder(dir: string): Promise<void>
  pickOutputDir(): Promise<string | null>
  readYamlFile(filePath: string): Promise<string>
  getDefaultOutputDir(): Promise<string>
  saveAs(yamlText: string): Promise<string | null>
}
