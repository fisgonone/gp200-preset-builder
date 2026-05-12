export const SLOT_KEYS = ['PRE', 'WAH', 'DST', 'AMP', 'NR', 'CAB', 'EQ', 'MOD', 'DLY', 'RVB', 'VOL'] as const
export type SlotKey = (typeof SLOT_KEYS)[number]

export const SLOT_COLORS: Record<SlotKey, string> = {
  PRE: 'bg-blue-500',
  WAH: 'bg-violet-500',
  DST: 'bg-amber-500',
  AMP: 'bg-red-500',
  NR:  'bg-emerald-500',
  CAB: 'bg-cyan-500',
  EQ:  'bg-teal-500',
  MOD: 'bg-purple-500',
  DLY: 'bg-pink-500',
  RVB: 'bg-orange-500',
  VOL: 'bg-indigo-500',
}

export const SLOT_HEX: Record<SlotKey, string> = {
  PRE: '#3B82F6',
  WAH: '#8B5CF6',
  DST: '#F59E0B',
  AMP: '#EF4444',
  NR:  '#10B981',
  CAB: '#06B6D4',
  EQ:  '#14B8A6',
  MOD: '#A855F7',
  DLY: '#EC4899',
  RVB: '#F97316',
  VOL: '#6366F1',
}

export interface SlotState {
  key: SlotKey
  effectName: string | null
  enabled: boolean
}

export interface ParsedPreset {
  name: string
  author?: string
  slots: Partial<Record<SlotKey, { effect: string; params: Record<string, number | string> }>>
}

export type StatusKind = 'idle' | 'compiling' | 'success' | 'error' | 'warning'

export interface StatusMessage {
  kind: StatusKind
  text: string
}
