import yaml from 'js-yaml'
import type { ParsedPreset, SlotKey } from '../types'
import { SLOT_KEYS } from '../types'

export function parsePresetYaml(text: string): { preset: ParsedPreset; error: null } | { preset: null; error: string } {
  if (!text.trim()) {
    return { preset: null, error: 'Empty document' }
  }

  let raw: unknown
  try {
    raw = yaml.load(text)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { preset: null, error: msg }
  }

  if (!raw || typeof raw !== 'object') {
    return { preset: null, error: 'Document must be a YAML mapping' }
  }

  const obj = raw as Record<string, unknown>

  const name = typeof obj.name === 'string' ? obj.name : 'Untitled'
  const author = typeof obj.author === 'string' ? obj.author : undefined

  const slotsRaw = obj.slots
  const slots: ParsedPreset['slots'] = {}

  if (slotsRaw && typeof slotsRaw === 'object') {
    const slotsObj = slotsRaw as Record<string, unknown>
    for (const key of SLOT_KEYS) {
      const slotVal = slotsObj[key]
      if (!slotVal || typeof slotVal !== 'object') continue
      const slotObj = slotVal as Record<string, unknown>
      const effect = typeof slotObj.effect === 'string' ? slotObj.effect : null
      if (!effect) continue
      const params: Record<string, number | string> = {}
      for (const [k, v] of Object.entries(slotObj)) {
        if (k === 'effect') continue
        if (typeof v === 'number' || typeof v === 'string') {
          params[k] = v
        }
      }
      slots[key as SlotKey] = { effect, params }
    }
  }

  return { preset: { name, author, slots }, error: null }
}

export const WELCOME_YAML = `name: Lead Shimmer
author: GP-200 Preset Builder

slots:
  DST:
    effect: Green OD
    Drive: 60
    Tone: 55
    Level: 70

  AMP:
    effect: UK 800
    Gain: 65
    Bass: 50
    Mid: 55
    Treble: 60
    Presence: 50
    Volume: 70

  CAB:
    effect: 4x12 V30

  EQ:
    effect: Parametric EQ
    Low Gain: 0
    Mid Freq: 800
    Mid Gain: 3
    High Gain: 2

  DLY:
    effect: Digital Delay
    Time: 380
    Feedback: 30
    Mix: 25

  RVB:
    effect: Hall
    Decay: 40
    Mix: 20
`
