import React, { useEffect, useCallback, useRef } from 'react'
import { useStore } from './store'
import { parsePresetYaml, WELCOME_YAML } from './lib/yaml-parser'
import { BLANK_YAML, TEMPLATES } from './lib/templates'
import { ProblemsPanel } from './components/ProblemsPanel'
import { Pedalboard } from './components/Pedalboard'
import { PatchHeader } from './components/PatchHeader'
import { YamlEditor } from './components/YamlEditor'
import { DropZone } from './components/DropZone'
import { PresetList } from './components/PresetList'
import { OutputDirPicker } from './components/OutputDirPicker'
import { StatusBar } from './components/StatusBar'
import type { ListedPreset } from '@shared/ipc'

declare global {
  interface Window {
    api: import('@shared/ipc').API
    store: { get: (k: string) => Promise<unknown>; set: (k: string, v: unknown) => Promise<void> }
  }
}

// debounce helper
function useDebouncedCallback<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback(
    (...args: T) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  )
}

export default function App() {
  const {
    yamlText, setYamlText,
    setParsedPreset,
    outputDir, setOutputDir,
    setPresets,
    setStatus,
    setCompiling,
    isCompiling,
    setDiagnostics,
    setCatalog,
    catalog,
  } = useStore()

  const scrollToRef = useRef<((section: string) => void) | null>(null)

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const savedYaml = (await window.store.get('lastYaml')) as string | undefined
      const savedDir = (await window.store.get('outputDir')) as string | undefined

      const initialYaml = savedYaml && savedYaml.trim() ? savedYaml : WELCOME_YAML
      setYamlText(initialYaml)
      syncParse(initialYaml)
      validate(initialYaml)
      window.api.getCatalog().then(setCatalog).catch(() => setCatalog(null))

      const dir = savedDir || (await window.api.getDefaultOutputDir())
      setOutputDir(dir)
      await refreshPresets(dir)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Parse YAML (debounced) ────────────────────────────────────────────────
  const syncParse = useCallback(
    (text: string) => {
      const result = parsePresetYaml(text)
      if (result.error) {
        setParsedPreset(null, result.error)
        setStatus({ kind: 'warning', text: `YAML error: ${result.error}` })
      } else {
        setParsedPreset(result.preset, null)
        setStatus({ kind: 'idle', text: 'Ready' })
      }
    },
    [setParsedPreset, setStatus],
  )

  const debouncedParse = useDebouncedCallback(syncParse, 300)

  // ── Validate with the toolkit (debounced; stale answers are dropped) ─────
  const validateSeq = useRef(0)
  const validate = useCallback(
    async (text: string) => {
      const seq = ++validateSeq.current
      try {
        const result = await window.api.validateYaml(text)
        if (seq === validateSeq.current) setDiagnostics({ errors: result.errors, warnings: result.warnings })
      } catch {
        // the toolkit is unavailable; compiling will report it
      }
    },
    [setDiagnostics],
  )
  const debouncedValidate = useDebouncedCallback(validate, 700)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleYamlChange = useCallback(
    (text: string) => {
      setYamlText(text)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => window.store.set('lastYaml', text), 500)
      debouncedParse(text)
      debouncedValidate(text)
    },
    [setYamlText, debouncedParse, debouncedValidate],
  )

  // ── Refresh preset list ───────────────────────────────────────────────────
  async function refreshPresets(dir?: string) {
    const d = dir ?? outputDir
    if (!d) return
    const list = await window.api.listPresets(d)
    setPresets(list)
  }

  // ── Compile ───────────────────────────────────────────────────────────────
  async function handleCompile() {
    if (isCompiling || !outputDir) return
    setCompiling(true)
    setStatus({ kind: 'compiling', text: 'Compiling…' })
    const result = await window.api.compileYaml(yamlText, outputDir)
    setCompiling(false)
    if (result.ok) {
      const n = result.warnings.length
      const suffix = n ? ` — ${n} warning${n === 1 ? '' : 's'}` : ''
      setStatus({ kind: n ? 'warning' : 'success', text: `✓ ${result.message}${suffix}` })
      setDiagnostics({ errors: [], warnings: result.warnings })
      await refreshPresets()
    } else {
      const lines = result.error.split(/\r?\n/).map((l) => l.trim())
      const problems = lines.filter((l) => l.startsWith('- ')).map((l) => l.slice(2))
      setStatus({ kind: 'error', text: problems.length ? `Not compiled: ${lines[0]}` : `Error: ${result.error}` })
      if (problems.length) setDiagnostics({ errors: problems, warnings: [] })
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'b') { e.preventDefault(); handleCompile() }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSaveAs() }
      if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleOpen() }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNewBlank() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // runs every render intentionally to capture latest closures

  // ── File operations ───────────────────────────────────────────────────────
  async function handleSaveAs() {
    await window.api.saveAs(yamlText)
  }

  async function handleOpen() {
    const result = await window.api.pickOutputDir()
    if (result) {
      setOutputDir(result)
      await window.store.set('outputDir', result)
      await refreshPresets(result)
    }
  }

  function handleNewBlank() {
    handleYamlChange(BLANK_YAML)
  }

  async function handlePickDir() {
    const dir = await window.api.pickOutputDir()
    if (dir) {
      setOutputDir(dir)
      await window.store.set('outputDir', dir)
      await refreshPresets(dir)
    }
  }

  function handleOpenFolder() {
    if (outputDir) window.api.openFolder(outputDir)
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function handleYamlDrop(text: string) {
    handleYamlChange(text)
  }

  async function handlePrstDrop(path: string) {
    setStatus({ kind: 'compiling', text: 'Decompiling…' })
    const result = await window.api.decompilePrst(path)
    if (result.ok) {
      handleYamlChange(result.yamlText)
      setStatus({ kind: 'idle', text: 'Ready' })
    } else {
      setStatus({ kind: 'error', text: `Decompile error: ${result.error}` })
    }
  }

  // ── Preset list double-click ──────────────────────────────────────────────
  async function handlePresetDoubleClick(preset: ListedPreset) {
    setStatus({ kind: 'compiling', text: 'Decompiling…' })
    const result = await window.api.decompilePrst(preset.fullPath)
    if (result.ok) {
      handleYamlChange(result.yamlText)
      setStatus({ kind: 'idle', text: `Loaded ${preset.fileName}` })
    } else {
      setStatus({ kind: 'error', text: `Decompile error: ${result.error}` })
    }
  }

  // ── Pedal or problem click → scroll editor ──────────────────────────────────────────────────────────────────────
  function handleSlotClick(slotKey: string) {
    scrollToRef.current?.(slotKey)
  }

  function registerScrollTo(cb: (section: string) => void) {
    scrollToRef.current = cb
  }

  const noDrag = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

  return (
    <div className="flex flex-col h-screen bg-rack">
      {/* Title bar: draggable; the window buttons are drawn by Windows on the right. */}
      <header
        className="flex items-center gap-4 pl-4 select-none flex-shrink-0"
        style={{ height: 38, paddingRight: 150, WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="font-semibold text-silk-muted" style={{ fontSize: 14 }}>GP-200 Preset Builder</span>
        <div className="flex items-center gap-2" style={noDrag}>
          <label className="sr-only" htmlFor="template">Start from a template</label>
          <select
            id="template"
            onChange={(e) => {
              const t = TEMPLATES.find((t) => t.label === e.target.value)
              if (t) handleYamlChange(t.yaml)
              e.target.value = ''
            }}
            defaultValue=""
            className="text-sm rounded-md px-2 py-1 text-silk"
            style={{ background: 'var(--panel-raised)', border: 'none' }}
          >
            <option value="" disabled>Start from a template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.label} value={t.label}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSaveAs}
            className="text-sm rounded-md px-2.5 py-1 text-silk hover:brightness-125"
            style={{ background: 'var(--panel-raised)' }}
            title="Save the YAML text (Ctrl+S)"
          >
            Save YAML…
          </button>
        </div>
      </header>

      <main className="flex flex-1 min-h-0" style={{ borderTop: '1px solid var(--seam)' }}>
        {/* Console: patch, pedalboard, editor */}
        <div className="flex flex-col flex-1 min-w-0 bg-panel">
          <PatchHeader onCompile={handleCompile} />
          <div className="min-w-0" style={{ background: 'var(--rack)', borderTop: '1px solid var(--seam)', borderBottom: '1px solid var(--seam)' }}>
            <Pedalboard onSelect={handleSlotClick} />
          </div>

          <DropZone onYamlDrop={handleYamlDrop} onPrstDrop={handlePrstDrop}>
            <div className="h-full overflow-hidden">
              <YamlEditor
                value={yamlText}
                onChange={handleYamlChange}
                onScrollTo={registerScrollTo}
                catalog={catalog}
              />
            </div>
          </DropZone>

          <ProblemsPanel onJump={handleSlotClick} />
        </div>

        {/* Library */}
        <aside
          className="flex flex-col flex-shrink-0 bg-panel w-[210px] lg:w-[250px]"
          style={{ borderLeft: '1px solid var(--seam)' }}
          aria-label="Preset library"
        >
          <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
            <h2 className="font-semibold text-silk" style={{ fontSize: 16 }}>Compiled presets</h2>
            <button type="button" onClick={() => refreshPresets()} className="text-sm text-silk-faint hover:text-silk" title="Read the folder again">
              Refresh
            </button>
          </div>
          <PresetList onOpen={handlePresetDoubleClick} />
          <OutputDirPicker onPick={handlePickDir} onOpenFolder={handleOpenFolder} />
        </aside>
      </main>

      <StatusBar />
    </div>
  )
}
