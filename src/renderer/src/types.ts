export const SLOT_KEYS = ['PRE', 'WAH', 'DST', 'AMP', 'NR', 'CAB', 'EQ', 'MOD', 'DLY', 'RVB', 'VOL'] as const
export type SlotKey = (typeof SLOT_KEYS)[number]

/** Plain-language name for each module, shown under its code. */
export const SLOT_TITLES: Record<SlotKey, string> = {
  PRE: 'Pre effects',
  WAH: 'Wah',
  DST: 'Drive',
  AMP: 'Amp',
  NR: 'Noise gate',
  CAB: 'Cabinet',
  EQ: 'EQ',
  MOD: 'Modulation',
  DLY: 'Delay',
  RVB: 'Reverb',
  VOL: 'Volume',
}

/**
 * Pedal enamel for each module, picked from the stompboxes each one stands in
 * for: compressor blue, drive orange, tweed amp, speaker-cloth brown, chorus
 * teal, echo green… `ink` is the lettering colour that reads on that enamel.
 */
export const SLOT_ENAMEL: Record<SlotKey, { paint: string; ink: string }> = {
  PRE: { paint: '#4F7CAC', ink: '#F4EFE2' },
  WAH: { paint: '#6B5B95', ink: '#F4EFE2' },
  DST: { paint: '#E07B39', ink: '#2A1A10' },
  AMP: { paint: '#C9A66B', ink: '#2B2114' },
  NR: { paint: '#7E8C7A', ink: '#1B2119' },
  CAB: { paint: '#8B5E3C', ink: '#F4EFE2' },
  EQ: { paint: '#AEB5BB', ink: '#1E2328' },
  MOD: { paint: '#3FA7A3', ink: '#0F2524' },
  DLY: { paint: '#5E9E4E', ink: '#13230F' },
  RVB: { paint: '#C2566A', ink: '#F7EDEE' },
  VOL: { paint: '#474B53', ink: '#ECE5D3' },
}

export interface SlotState {
  key: SlotKey
  effectName: string | null
  enabled: boolean
}

export interface ParsedPreset {
  name: string
  author?: string
  slot?: string
  tempo?: number
  volume?: number
  /** Playing order; the default chain when the YAML has none. */
  chain: SlotKey[]
  slots: Partial<Record<SlotKey, { effect: string; params: Record<string, number | string>; enabled: boolean }>>
}

export type StatusKind = 'idle' | 'compiling' | 'success' | 'error' | 'warning'

export interface StatusMessage {
  kind: StatusKind
  text: string
}
