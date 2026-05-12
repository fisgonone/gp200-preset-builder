import React from 'react'
import { useStore } from '../store'

interface Props {
  onPick: () => void
  onOpenFolder: () => void
}

export function OutputDirPicker({ onPick, onOpenFolder }: Props) {
  const outputDir = useStore((s) => s.outputDir)

  const display = outputDir
    ? outputDir.length > 38
      ? '…' + outputDir.slice(-36)
      : outputDir
    : 'Not set'

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        Output directory
      </div>
      <div
        className="text-xs px-2 py-1.5 rounded truncate"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}
        title={outputDir}
      >
        {display}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onPick}
          className="flex-1 px-2 py-1 rounded text-xs font-medium transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            border: '1px solid var(--border-soft)',
          }}
        >
          Browse…
        </button>
        <button
          onClick={onOpenFolder}
          disabled={!outputDir}
          className="flex-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            border: '1px solid var(--border-soft)',
          }}
        >
          Open folder
        </button>
      </div>
    </div>
  )
}
