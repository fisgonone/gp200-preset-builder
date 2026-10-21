import React, { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'

interface Props {
  onClick: () => void
}

/** The one amber control on the console. Its lamp flashes once when a file is written. */
export function CompileButton({ onClick }: Props) {
  const isCompiling = useStore((s) => s.isCompiling)
  const status = useStore((s) => s.status)
  const errors = useStore((s) => s.diagnostics.errors.length)
  const [flash, setFlash] = useState(false)
  const last = useRef(status)

  useEffect(() => {
    if (status !== last.current && (status.kind === 'success' || (status.kind === 'warning' && status.text.startsWith('✓')))) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 950)
      last.current = status
      return () => clearTimeout(t)
    }
    last.current = status
  }, [status])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCompiling}
      title={errors ? `Fix ${errors} problem${errors === 1 ? '' : 's'} first (Ctrl+B)` : 'Write the .prst file (Ctrl+B)'}
      className={`flex items-center gap-3 flex-shrink-0 font-semibold disabled:opacity-60 ${flash ? 'lamp-flash' : ''}`}
      style={{
        height: 44,
        padding: '0 18px',
        borderRadius: 8,
        fontSize: 17,
        color: '#2A1B05',
        background: isCompiling ? 'var(--vu-deep)' : 'linear-gradient(#F6B858, #E99A27)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.45)',
      }}
    >
      {isCompiling ? (
        <>
          <span className="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(42,27,5,0.25)', borderTopColor: '#2A1B05' }} />
          Compiling…
        </>
      ) : (
        <>
          Compile .prst
          <kbd className="font-sans text-xs font-medium" style={{ opacity: 0.6 }}>Ctrl+B</kbd>
        </>
      )}
    </button>
  )
}
