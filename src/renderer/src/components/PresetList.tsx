import React from 'react'
import { useStore } from '../store'
import type { ListedPreset } from '@shared/ipc'

interface Props {
  onDoubleClick: (preset: ListedPreset) => void
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PresetList({ onDoubleClick }: Props) {
  const presets = useStore((s) => s.presets)

  if (presets.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-xs"
        style={{ color: 'var(--text-dim)' }}
      >
        No presets compiled yet
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-1">
      {presets.map((preset) => (
        <div
          key={preset.fullPath}
          onDoubleClick={() => onDoubleClick(preset)}
          className="flex flex-col px-3 py-2 rounded cursor-pointer transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-soft)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-soft)')}
          title="Double-click to reload YAML"
        >
          <span
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--text)' }}
          >
            {preset.presetName ?? preset.fileName.replace(/\.prst$/i, '')}
          </span>
          <div className="flex justify-between mt-0.5">
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {formatTime(preset.modifiedTime)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              {preset.sizeBytes}B
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
