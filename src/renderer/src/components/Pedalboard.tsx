import React from 'react'
import { useStore } from '../store'
import { SLOT_ENAMEL, SLOT_TITLES, type SlotState } from '../types'
import { norm } from '../lib/completions'
import type { Catalog } from '@shared/ipc'

/** `CAB: auto` resolves to the cabinet matched to the amp, as the compiler does. */
function resolveAutoCab(slots: SlotState[], catalog: Catalog | null): string | null {
  const amp = slots.find((s) => s.key === 'AMP')?.effectName
  if (!catalog || !amp) return null
  const ampEffect = catalog.effects.find((e) => e.modules.includes('AMP') && norm(e.name) === norm(amp))
  return catalog.effects.find((e) => e.code === ampEffect?.cab_code)?.name ?? null
}

interface Props {
  onSelect: (slotKey: string) => void
}

/**
 * The signal chain drawn as a pedalboard: one stompbox per module, in playing
 * order, strung on a patch cable from the guitar input to the output.
 */
export function Pedalboard({ onSelect }: Props) {
  const slots = useStore((s) => s.slots)
  const catalog = useStore((s) => s.catalog)
  const autoCab = resolveAutoCab(slots, catalog)

  return (
    // Scrolls sideways when the window is too narrow for all eleven pedals.
    <div className="overflow-x-auto" aria-label="Signal chain">
    <div className="relative flex items-center gap-2 px-3 py-3" style={{ minWidth: 'max-content', width: '100%' }}>
      {/* the cable, behind the pedals */}
      <div
        aria-hidden
        className="absolute left-3 right-3 top-1/2"
        style={{ height: 4, marginTop: -2, borderRadius: 2, background: 'var(--cable)', boxShadow: '0 1px 0 rgba(255,255,255,0.04)' }}
      />
      <Jack label="In" />
      {slots.map((slot) => (
        <Stompbox
          key={slot.key}
          slot={slot}
          onSelect={onSelect}
          note={slot.key === 'CAB' && slot.effectName && norm(slot.effectName) === 'auto' ? autoCab : null}
        />
      ))}
      <Jack label="Out" />
    </div>
    </div>
  )
}

function Jack({ label }: { label: string }) {
  return (
    <div className="relative flex flex-col items-center flex-shrink-0" style={{ width: 30 }} aria-hidden>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #8E979E, #4A535B 70%)',
          boxShadow: 'inset 0 0 0 4px #2B333A, 0 1px 2px rgba(0,0,0,0.6)',
        }}
      />
      <span className="absolute text-xs text-silk-faint" style={{ top: 22 }}>{label}</span>
    </div>
  )
}

interface StompboxProps {
  slot: SlotState
  onSelect: (k: string) => void
  /** Resolved effect when the YAML says `auto`. */
  note?: string | null
}

function Stompbox({ slot, onSelect, note }: StompboxProps) {
  const { paint, ink } = SLOT_ENAMEL[slot.key]
  const title = SLOT_TITLES[slot.key]
  const effect = note ? `Auto: ${note}` : slot.effectName ?? 'Not used'
  const state = slot.enabled ? 'on' : 'bypassed'

  return (
    <button
      type="button"
      onClick={() => onSelect(slot.key)}
      title={`${title}: ${effect}${note ? ' (the cabinet matched to the amp)' : ''}, ${state}. Click to edit.`}
      aria-label={`${title}, ${effect}, ${state}`}
      className="relative flex-1 flex flex-col items-center text-left"
      style={{
        minWidth: 70,
        maxWidth: 124,
        height: 112,
        padding: '8px 6px 10px',
        borderRadius: 9,
        background: paint,
        color: ink,
        filter: slot.enabled ? 'none' : 'saturate(0.3) brightness(0.62)',
        boxShadow: slot.enabled
          ? 'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.22), 0 3px 6px rgba(0,0,0,0.45)'
          : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 3px rgba(0,0,0,0.4)',
      }}
    >
      <span className="led" data-on={slot.enabled} aria-hidden />
      <span className="font-bold leading-none" style={{ fontSize: 21, marginTop: 6, letterSpacing: '0.03em' }}>
        {slot.key}
      </span>
      <span
        className="w-full text-center truncate font-semibold"
        style={{ fontSize: 13, marginTop: 6, opacity: slot.effectName ? 0.92 : 0.6 }}
      >
        {effect}
      </span>
      {/* footswitch */}
      <span
        aria-hidden
        className="mt-auto"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 38% 32%, #F1F3F4, #A7AFB5 45%, #5F676D 100%)',
          boxShadow: '0 2px 2px rgba(0,0,0,0.45), inset 0 -1px 1px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  )
}
