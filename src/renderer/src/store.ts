import { create } from 'zustand'
import type { SlotState, StatusMessage, ParsedPreset } from './types'
import type { Catalog, ListedPreset } from '@shared/ipc'
import { SLOT_KEYS } from './types'

interface AppState {
  yamlText: string
  parsedPreset: ParsedPreset | null
  parseError: string | null
  slots: SlotState[]
  outputDir: string
  presets: ListedPreset[]
  status: StatusMessage
  isCompiling: boolean
  /** Problems the toolkit found in the current YAML (empty when valid). */
  diagnostics: { errors: string[]; warnings: string[] }
  catalog: Catalog | null

  setYamlText: (text: string) => void
  setParsedPreset: (preset: ParsedPreset | null, error: string | null) => void
  setOutputDir: (dir: string) => void
  setPresets: (presets: ListedPreset[]) => void
  setStatus: (status: StatusMessage) => void
  setCompiling: (v: boolean) => void
  setDiagnostics: (d: { errors: string[]; warnings: string[] }) => void
  setCatalog: (c: Catalog | null) => void
}

function slotsFromPreset(preset: ParsedPreset | null): SlotState[] {
  return (preset?.chain ?? SLOT_KEYS).map((key) => {
    const slotData = preset?.slots[key]
    // Unlisted modules keep the pedal's init patch, where only VOL is on.
    if (preset && !slotData && key === 'VOL') {
      return { key, effectName: 'Volume', enabled: true }
    }
    return {
      key,
      effectName: slotData?.effect ?? null,
      enabled: !!slotData && slotData.enabled,
    }
  })
}

export const useStore = create<AppState>((set) => ({
  yamlText: '',
  parsedPreset: null,
  parseError: null,
  slots: SLOT_KEYS.map((key) => ({ key, effectName: null, enabled: false })),
  outputDir: '',
  presets: [],
  status: { kind: 'idle', text: 'Ready' },
  isCompiling: false,
  diagnostics: { errors: [], warnings: [] },
  catalog: null,

  setYamlText: (text) => set({ yamlText: text }),

  setParsedPreset: (preset, error) =>
    set({
      parsedPreset: preset,
      parseError: error,
      slots: slotsFromPreset(preset),
    }),

  setOutputDir: (dir) => set({ outputDir: dir }),
  setPresets: (presets) => set({ presets }),
  setStatus: (status) => set({ status }),
  setCompiling: (v) => set({ isCompiling: v }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setCatalog: (catalog) => set({ catalog }),
}))
