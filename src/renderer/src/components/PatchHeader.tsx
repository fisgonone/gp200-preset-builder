import React from 'react'
import { useStore } from '../store'
import { CompileButton } from './CompileButton'

interface Props {
  onCompile: () => void
}

/** What the pedal's screen would show for this patch, plus the button that builds it. */
export function PatchHeader({ onCompile }: Props) {
  const preset = useStore((s) => s.parsedPreset)
  const name = preset?.name ?? 'Untitled'

  return (
    <div className="flex items-end gap-5 px-5 pt-4 pb-3">
      <div
        className="flex items-center justify-center flex-shrink-0 font-semibold"
        style={{
          minWidth: 64,
          height: 44,
          padding: '0 10px',
          borderRadius: 6,
          background: 'var(--well)',
          color: 'var(--vu)',
          fontSize: 22,
          letterSpacing: '0.04em',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          textShadow: '0 0 8px rgba(242,169,59,0.35)',
        }}
        title={preset?.slot ? `Target patch slot ${preset.slot}` : 'No target slot set (add slot: 05-B)'}
      >
        {preset?.slot ?? '--'}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold leading-none" style={{ fontSize: 32, letterSpacing: '0.005em' }}>
          {name}
        </h1>
        <dl className="flex gap-5 mt-2 text-sm">
          <Meta label="Tempo" value={preset?.tempo !== undefined ? `${preset.tempo} bpm` : '120 bpm'} />
          <Meta label="Volume" value={String(preset?.volume ?? 50)} />
          {preset?.author && <Meta label="Author" value={preset.author} />}
        </dl>
      </div>

      <CompileButton onClick={onCompile} />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-silk-faint">{label}</dt>
      <dd className="text-silk-muted font-medium">{value}</dd>
    </div>
  )
}
