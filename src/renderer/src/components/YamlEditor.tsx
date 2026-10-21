import React, { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { yaml } from '@codemirror/lang-yaml'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion, closeBrackets, completionKeymap } from '@codemirror/autocomplete'
import type { Catalog } from '@shared/ipc'
import { gp200Completions } from '../lib/completions'

interface Props {
  value: string
  onChange: (value: string) => void
  onScrollTo?: (cb: (section: string) => void) => void
  /** Effect catalog for autocompletion; null until loaded. */
  catalog?: Catalog | null
}

// Console colours: cream lettering on a recessed well, keys in faded blue
// silkscreen, comments dim, the cursor and selection in the amber backlight.
const EDITOR_THEME = EditorView.theme(
  {
    '&': { height: '100%', background: '#161C22', color: '#ECE5D3' },
    '.cm-content': { padding: '14px 0', caretColor: '#F2A93B', fontSize: '13.5px', lineHeight: '1.6' },
    '.cm-line': { padding: '0 20px' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#F2A93B', borderLeftWidth: '2px' },
    '.cm-selectionBackground': { background: '#2E3944 !important' },
    '&.cm-focused .cm-selectionBackground': { background: 'rgba(242,169,59,0.22) !important' },
    '.cm-activeLine': { background: 'rgba(255,255,255,0.025)' },
    '.cm-gutters': { display: 'none' },
    '.cm-placeholder': { color: '#6F7A82' },
    '.cm-tooltip': { background: '#26303A', border: '1px solid #3A4652', color: '#ECE5D3', borderRadius: '6px' },
    '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px !important' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { background: 'rgba(242,169,59,0.25)', color: '#ECE5D3' },
    '.cm-completionDetail': { color: '#A9B0B3', fontStyle: 'normal', marginLeft: '1.2em' },
    '.cm-completionMatchedText': { textDecoration: 'none', color: '#F2A93B' },
  },
  { dark: true },
)

const HIGHLIGHT = HighlightStyle.define([
  { tag: [tags.definition(tags.propertyName), tags.propertyName], color: '#8FB3C9' },
  { tag: [tags.content, tags.string], color: '#ECE5D3' },
  { tag: [tags.lineComment, tags.comment], color: '#6F7A82', fontStyle: 'italic' },
  { tag: [tags.separator, tags.punctuation, tags.squareBracket, tags.brace], color: '#6F7A82' },
  { tag: [tags.meta, tags.keyword, tags.labelName, tags.typeName], color: '#C9A66B' },
])

export function YamlEditor({ value, onChange, onScrollTo, catalog = null }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const valueRef = useRef(value)
  const catalogRef = useRef<Catalog | null>(catalog)
  catalogRef.current = catalog

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
      EDITOR_THEME,
      indentOnInput(),
      closeBrackets(),
      syntaxHighlighting(HIGHLIGHT),
      autocompletion({ override: [gp200Completions(() => catalogRef.current)], icons: false }),
      keymap.of([...completionKeymap, ...defaultKeymap, ...historyKeymap]),
      placeholder('Write a preset here, pick a template, or drop a .yaml or .prst file'),
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
      style={{ background: '#161C22' }}
    />
  )
}
