import React from 'react'
import { useStore } from '../store'

interface Props {
  onPick: () => void
  onOpenFolder: () => void
}

export function OutputDirPicker({ onPick, onOpenFolder }: Props) {
  const outputDir = useStore((s) => s.outputDir)
  const parts = outputDir.split(/[\\/]/).filter(Boolean)
  const folder = parts[parts.length - 1] ?? 'No folder set'
  const parent = parts.slice(0, -1).join('\\')

  return (
    <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--seam)' }}>
      <div title={outputDir || undefined}>
        <div className="text-sm text-silk-faint">Saving to</div>
        <div className="truncate font-medium text-silk">{folder}</div>
        {parent && <div className="truncate text-xs text-silk-faint" style={{ direction: 'rtl', textAlign: 'left' }}>{parent}</div>}
      </div>
      <div className="flex gap-2">
        <SmallButton onClick={onPick}>Change folder</SmallButton>
        <SmallButton onClick={onOpenFolder} disabled={!outputDir}>Show in Explorer</SmallButton>
      </div>
    </div>
  )
}

export function SmallButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex-1 px-2 py-1.5 rounded-md text-sm font-medium text-silk hover:brightness-125 disabled:opacity-40"
      style={{ background: 'var(--panel-raised)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
    >
      {children}
    </button>
  )
}
