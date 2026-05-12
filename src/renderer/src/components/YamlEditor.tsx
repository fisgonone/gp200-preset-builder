import React, { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { closeBrackets } from '@codemirror/autocomplete'

interface Props {
  value: string
  onChange: (value: string) => void
  onScrollTo?: (cb: (section: string) => void) => void
}

const EDITOR_THEME = EditorView.theme({
  '&': {
    height: '100%',
    background: '#161B22',
    color: '#E5E7EB',
  },
  '.cm-content': {
    padding: '12px 0',
    caretColor: '#3B82F6',
    fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
    fontSize: '13px',
  },
  '.cm-line': { padding: '0 16px' },
  '.cm-cursor': { borderLeftColor: '#3B82F6' },
  '.cm-selectionBackground': { background: '#2D3540 !important' },
  '&.cm-focused .cm-selectionBackground': { background: '#3B82F650 !important' },
  '.cm-activeLine': { background: '#1E2530' },
  '.cm-gutters': { display: 'none' },
  '.cm-placeholder': { color: '#6B7280' },
})

export function YamlEditor({ value, onChange, onScrollTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const valueRef = useRef(value)

  const handleChange = useCallback(
    (newValue: string) => {
      valueRef.current = newValue
      onChange(newValue)
    },
    [onChange],
  )

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handleChange(update.state.doc.toString())
      }
    })

    const extensions = [
      history(),
      yaml(),
      oneDark,
      EDITOR_THEME,
      indentOnInput(),
      closeBrackets(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      placeholder('# Paste or drop a .yaml file here…'),
      updateListener,
      EditorView.lineWrapping,
    ]

    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes into the editor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  // Register scroll-to helper
  useEffect(() => {
    if (!onScrollTo) return
    onScrollTo((section: string) => {
      const view = viewRef.current
      if (!view) return
      const doc = view.state.doc.toString()
      const idx = doc.indexOf(`  ${section}:`)
      if (idx < 0) return
      const pos = view.state.doc.lineAt(idx).from
      view.dispatch({ selection: { anchor: pos }, scrollIntoView: true })
      view.focus()
    })
  }, [onScrollTo])

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{ background: '#161B22' }}
    />
  )
}
