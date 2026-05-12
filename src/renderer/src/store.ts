import { create } from 'zustand'
import type { SlotState, StatusMessage, ParsedPreset } from './types'
import type { ListedPreset } from '@shared/ipc'
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

  setYamlText: (text: string) => void
  setParsedPreset: (preset: ParsedPreset | null, error: string | null) => void
  setOutputDir: (dir: string) => void
  setPresets: (presets: ListedPreset[]) => void
  setStatus: (status: StatusMessage) => void
  setCompiling: (v: boolean) => void
}

function slotsFromPreset(preset: ParsedPreset | null): SlotState[] {
  return SLOT_KEYS.map((key) => {
    const slotData = preset?.slots[key]
    return {
      key,
      effectName: slotData?.effect ?? null,
      enabled: !!slotData,
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
}))
