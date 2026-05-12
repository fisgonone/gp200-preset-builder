import React from 'react'
import { useStore } from '../store'

export function StatusBar() {
  const status = useStore((s) => s.status)

  const colorMap = {
    idle: 'text-text-muted',
    compiling: 'text-warning',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
  }

  const dotMap = {
    idle: 'bg-text-dim',
    compiling: 'bg-warning animate-pulse',
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 text-xs border-t"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-panel)' }}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${dotMap[status.kind]}`} />
      <span className={colorMap[status.kind]}>{status.text}</span>
    </div>
  )
}
