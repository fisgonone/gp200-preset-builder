import React from 'react'
import { useStore } from '../store'
import { SLOT_KEYS } from '../types'

interface Props {
  /** Jump the editor to a module when its problem is clicked. */
  onJump?: (slotKey: string) => void
}

function slotOf(message: string): string | null {
  const m = /^slots\.([A-Za-z]+)/.exec(message)
  const key = m ? m[1].toUpperCase() : null
  return key && (SLOT_KEYS as readonly string[]).includes(key) ? key : null
}

/** Errors and warnings the toolkit reported for the current YAML. Hidden when there are none. */
export function ProblemsPanel({ onJump }: Props) {
  const { errors, warnings } = useStore((s) => s.diagnostics)
  if (errors.length === 0 && warnings.length === 0) return null

  const rows = [
    ...errors.map((text) => ({ text, kind: 'error' as const })),
    ...warnings.map((text) => ({ text, kind: 'warning' as const })),
  ]
  const heading = errors.length
    ? `${errors.length} ${errors.length === 1 ? 'problem' : 'problems'} to fix before compiling`
    : `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}; the preset still compiles`

  return (
    <section
      className="flex-shrink-0 overflow-y-auto text-sm"
      style={{
        maxHeight: 132,
        background: 'var(--well)',
        borderTop: `2px solid ${errors.length ? 'var(--led-red)' : 'var(--vu)'}`,
      }}
      data-testid="problems-panel"
      aria-live="polite"
    >
      <h2 className="px-4 pt-2 pb-1 font-semibold" style={{ color: errors.length ? 'var(--led-red)' : 'var(--vu)' }}>
        {heading}
      </h2>
      <ul className="pb-2">
        {rows.map((row, i) => {
          const slot = slotOf(row.text)
          const dot = row.kind === 'error' ? 'var(--led-red)' : 'var(--vu)'
          const content = (
            <>
              <span aria-hidden className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, marginTop: 7, background: dot }} />
              <span className="text-silk-muted">{row.text}</span>
            </>
          )
          return (
            <li key={i}>
              {slot && onJump ? (
                <button type="button" onClick={() => onJump(slot)} className="w-full text-left flex gap-2.5 px-4 py-0.5 hover:bg-raised" title={`Go to ${slot}`}>
                  {content}
                </button>
              ) : (
                <div className="flex gap-2.5 px-4 py-0.5">{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
