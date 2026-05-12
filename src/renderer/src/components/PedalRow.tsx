import React from 'react'
import { useStore } from '../store'
import { SLOT_HEX } from '../types'
import { PedalIcon } from './PedalIcon'

export function PedalRow() {
  const slots = useStore((s) => s.slots)

  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {slots.map((slot) => {
        const color = SLOT_HEX[slot.key]
        return (
          <div
            key={slot.key}
            className="flex-shrink-0 flex flex-col items-center rounded-lg overflow-hidden"
            style={{
              width: 80,
              minHeight: 110,
              background: '#2D3540',
              border: '1px solid #3D4550',
              opacity: slot.enabled ? 1 : 0.4,
            }}
          >
            {/* colored top bar */}
            <div style={{ height: 8, width: '100%', background: color }} />

            {/* slot label */}
            <span
              className="text-xs font-bold mt-1"
              style={{ color, letterSpacing: '0.08em' }}
            >
              {slot.key}
            </span>

            {/* knob */}
            <div className="flex-1 flex items-center justify-center py-1">
              <PedalIcon slotKey={slot.key} size={38} />
            </div>

            {/* effect name */}
            <div
              className="w-full text-center px-1 pb-2 text-xs truncate"
              style={{ color: slot.enabled ? '#E5E7EB' : '#6B7280' }}
              title={slot.effectName ?? ''}
            >
              {slot.effectName ?? '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
