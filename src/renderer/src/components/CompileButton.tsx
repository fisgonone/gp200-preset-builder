import React from 'react'
import { useStore } from '../store'

interface Props {
  onClick: () => void
}

export function CompileButton({ onClick }: Props) {
  const isCompiling = useStore((s) => s.isCompiling)

  return (
    <button
      onClick={onClick}
      disabled={isCompiling}
      title="Compile (Ctrl+B)"
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
      style={{
        background: isCompiling ? '#1D4ED8' : 'var(--accent)',
        minWidth: 120,
      }}
      onMouseEnter={(e) => {
        if (!isCompiling) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isCompiling) (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'
      }}
    >
      {isCompiling ? (
        <>
          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Compiling…
        </>
      ) : (
        <>
          <span>⚡</span>
          Compile
        </>
      )}
    </button>
  )
}
