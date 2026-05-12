import React from 'react'
import { useStore } from '../store'
import { SLOT_COLORS } from '../types'

interface Props {
  onSlotClick?: (slotKey: string) => void
}

export function SlotChain({ onSlotClick }: Props) {
  const slots = useStore((s) => s.slots)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {slots.map((slot) => (
        <button
          key={slot.key}
          onClick={() => onSlotClick?.(slot.key)}
          title={slot.effectName ?? `${slot.key} (bypass)`}
          className={[
            'px-3 py-1 rounded-full text-xs font-semibold text-white transition-all',
            'border border-white/10 hover:border-white/30',
            SLOT_COLORS[slot.key],
            slot.enabled ? 'opacity-100' : 'opacity-30',
          ].join(' ')}
        >
          {slot.key}
        </button>
      ))}
    </div>
  )
}
