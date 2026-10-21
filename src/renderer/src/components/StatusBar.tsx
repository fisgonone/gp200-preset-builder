import React from 'react'
import { useStore } from '../store'

const LED: Record<string, string> = {
  idle: '#4C5862',
  compiling: 'var(--vu)',
  success: 'var(--led-green)',
  error: 'var(--led-red)',
  warning: 'var(--vu)',
}

export function StatusBar() {
  const status = useStore((s) => s.status)
  const lit = status.kind !== 'idle'

  return (
    <div
      className="flex items-center gap-2.5 px-4 text-sm flex-shrink-0"
      style={{ height: 28, background: 'var(--rack)', borderTop: '1px solid var(--seam)' }}
      role="status"
    >
      <span
        aria-hidden
        className={status.kind === 'compiling' ? 'animate-pulse' : ''}
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: LED[status.kind],
          boxShadow: lit ? `0 0 6px ${LED[status.kind]}` : 'none',
        }}
      />
      <span className={`truncate ${status.kind === 'error' ? 'text-led-red' : 'text-silk-muted'}`}>{status.text}</span>
      <span className="ml-auto text-silk-faint truncate">Drop a .yaml or .prst file on the editor to open it</span>
    </div>
  )
}
