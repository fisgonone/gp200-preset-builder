import React from 'react'
import { useStore } from '../store'
import type { ListedPreset } from '@shared/ipc'

interface Props {
  onOpen: (preset: ListedPreset) => void
}

export function formatAge(ms: number, now = Date.now()): string {
  const minutes = Math.round((now - ms) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const d = new Date(ms)
  const days = Math.round(hours / 24)
  if (days === 1) return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' })
}

/** Presets already compiled into the output folder. Double-click or Enter opens one. */
export function PresetList({ onOpen }: Props) {
  const presets = useStore((s) => s.presets)

  if (presets.length === 0) {
    return (
      <div className="flex-1 px-4 py-3 text-sm text-silk-faint leading-snug">
        Presets you compile land here. Pick one later to load it back into the editor.
      </div>
    )
  }

  return (
    <ul className="flex-1 overflow-y-auto py-1" aria-label="Compiled presets">
      {presets.map((preset) => (
        <li key={preset.fullPath}>
          <button
            type="button"
            onDoubleClick={() => onOpen(preset)}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(preset) }}
            title={`${preset.fileName}: double-click to open`}
            className="w-full text-left px-4 py-2 hover:bg-raised focus-visible:bg-raised"
          >
            <span className="block truncate font-medium text-silk" style={{ fontSize: 15 }}>
              {preset.presetName ?? preset.fileName.replace(/\.prst$/i, '')}
            </span>
            <span className="block text-xs text-silk-faint">{formatAge(preset.modifiedTime)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
