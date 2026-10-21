import yaml from 'js-yaml'
import type { ParsedPreset, SlotKey } from '../types'
import { SLOT_KEYS } from '../types'
import { LEAD_YAML } from './templates'

// Keys inside a slot that are not effect parameters.
const SLOT_META_KEYS = new Set(['effect', 'enabled', 'params', 'hidden_params'])

function isEnabled(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'boolean') return value
  return ['on', 'true', 'yes', '1'].includes(String(value).trim().toLowerCase())
}

/**
 * Light, forgiving parse for the live diagram. Real validation (effect names,
 * ranges) is done by the Python toolkit; see window.api.validateYaml.
 */
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
    for (const [rawKey, slotVal] of Object.entries(slotsObj)) {
      const key = rawKey.trim().toUpperCase() as SlotKey
      if (!SLOT_KEYS.includes(key)) continue
      const slotObj = (typeof slotVal === 'string' ? { effect: slotVal } : slotVal) as Record<string, unknown> | null
      if (!slotObj || typeof slotObj !== 'object') continue
      const effect = slotObj.effect != null ? String(slotObj.effect) : null
      if (!effect) continue
      const params: Record<string, number | string> = {}
      for (const [k, v] of Object.entries(slotObj)) {
        if (SLOT_META_KEYS.has(k)) continue
        if (typeof v === 'number' || typeof v === 'string') params[k] = v
        else if (typeof v === 'boolean') params[k] = v ? 'ON' : 'OFF'
      }
      slots[key] = { effect, params, enabled: isEnabled(slotObj.enabled) }
    }
  }

  const chain = parseChain(obj.chain)
  const tempo = typeof obj.tempo === 'number' ? obj.tempo : typeof obj.bpm === 'number' ? obj.bpm : undefined
  const volume = typeof obj.volume === 'number' ? obj.volume : undefined
  const slot = obj.slot != null ? String(obj.slot).toUpperCase() : undefined

  return { preset: { name, author, slot, tempo, volume, chain, slots }, error: null }
}

/** The `chain:` list if it names every module once; otherwise the default order. */
function parseChain(value: unknown): SlotKey[] {
  if (!Array.isArray(value)) return [...SLOT_KEYS]
  const keys = value.map((v) => String(v).trim().toUpperCase())
  const valid = keys.length === SLOT_KEYS.length && SLOT_KEYS.every((k) => keys.includes(k))
  return valid ? (keys as SlotKey[]) : [...SLOT_KEYS]
}

export const WELCOME_YAML = LEAD_YAML
