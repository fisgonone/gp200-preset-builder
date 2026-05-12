import React from 'react'
import type { SlotKey } from '../types'
import { SLOT_HEX } from '../types'

interface Props {
  slotKey: SlotKey
  size?: number
}

export function PedalIcon({ slotKey, size = 36 }: Props) {
  const color = SLOT_HEX[slotKey]
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" stroke={color} strokeWidth="2" fill="none" opacity="0.3" />
      <circle cx="18" cy="18" r="10" fill={color} opacity="0.6" />
      <circle cx="18" cy="18" r="4" fill={color} />
      <line x1="18" y1="2" x2="18" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
