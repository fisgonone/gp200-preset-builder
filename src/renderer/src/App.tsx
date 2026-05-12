import React, { useEffect, useCallback, useRef } from 'react'
import { useStore } from './store'
import { parsePresetYaml, WELCOME_YAML } from './lib/yaml-parser'
import { SlotChain } from './components/SlotChain'
import { PedalRow } from './components/PedalRow'
import { YamlEditor } from './components/YamlEditor'
import { DropZone } from './components/DropZone'
import { PresetList } from './components/PresetList'
import { CompileButton } from './components/CompileButton'
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

const TEMPLATES: { label: string; yaml: string }[] = [
  {
    label: 'Clean',
    yaml: `name: Clean
slots:
  AMP:
    effect: Clean Combo
    Gain: 30
    Volume: 70
  CAB:
    effect: 1x12 Blackface
  RVB:
    effect: Room
    Decay: 35
    Mix: 25
`,
  },
  {
    label: 'Crunch',
    yaml: `name: Crunch
slots:
  DST:
    effect: Tube Screamer
    Drive: 50
    Tone: 55
    Level: 60
  AMP:
    effect: UK 800
    Gain: 50
    Volume: 65
  CAB:
    effect: 4x12 V30
`,
  },
  {
    label: 'Lead',
    yaml: WELCOME_YAML,
  },
  {
    label: 'Ambient Pad',
    yaml: `name: Ambient Pad
slots:
  AMP:
    effect: Fender Twin
    Gain: 20
    Volume: 60
  CAB:
    effect: 2x12 Blackface
  MOD:
    effect: Chorus
    Rate: 40
    Depth: 50
    Mix: 40
  DLY:
    effect: Analog Delay
    Time: 500
    Feedback: 50
    Mix: 35
  RVB:
    effect: Hall
    Decay: 70
    Mix: 45
`,
  },
]

export default function App() {
  const {
    yamlText, setYamlText,
    setParsedPreset,
    outputDir, setOutputDir,
    setPresets,
    setStatus,
    setCompiling,
    isCompiling,
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

  const handleYamlChange = useCallback(
    (text: string) => {
      setYamlText(text)
      window.store.set('lastYaml', text)
      debouncedParse(text)
    },
    [setYamlText, debouncedParse],
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
      setStatus({ kind: 'success', text: `✓ ${result.message}` })
      await refreshPresets()
    } else {
      setStatus({ kind: 'error', text: `Error: ${result.error}` })
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
    const blank = 'name: New Preset\n\nslots:\n  AMP:\n    effect: Clean Combo\n    Volume: 70\n'
    handleYamlChange(blank)
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

  // ── SlotChain click → scroll editor ──────────────────────────────────────
  function handleSlotClick(slotKey: string) {
    scrollToRef.current?.(slotKey)
  }

  function registerScrollTo(cb: (section: string) => void) {
    scrollToRef.current = cb
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 select-none"
        style={{
          height: 40,
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border)',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            GP-200 Preset Builder
          </span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>v1.0.0</span>
        </div>

        {/* Templates menu */}
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <select
            onChange={(e) => {
              const t = TEMPLATES.find((t) => t.label === e.target.value)
              if (t) handleYamlChange(t.yaml)
              e.target.value = ''
            }}
            defaultValue=""
            className="text-xs px-2 py-1 rounded"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-soft)',
              outline: 'none',
            }}
          >
            <option value="" disabled>New from template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.label} value={t.label}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: 1, background: 'var(--border)' }}>

        {/* Left panel */}
        <div
          className="flex flex-col flex-1 overflow-hidden gap-2 p-3"
          style={{ background: 'var(--bg-panel)', minWidth: 0 }}
        >
          {/* Slot chain */}
          <div
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}
          >
            <SlotChain onSlotClick={handleSlotClick} />
          </div>

          {/* Pedal row */}
          <div
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-soft)' }}
          >
            <PedalRow />
          </div>

          {/* YAML editor */}
          <DropZone onYamlDrop={handleYamlDrop} onPrstDrop={handlePrstDrop}>
            <div
              className="flex-1 rounded-lg overflow-hidden"
              style={{
                border: '1px solid var(--border-soft)',
                height: 'calc(100vh - 330px)',
                minHeight: 120,
              }}
            >
              <YamlEditor
                value={yamlText}
                onChange={handleYamlChange}
                onScrollTo={registerScrollTo}
              />
            </div>
          </DropZone>

          {/* Bottom bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="text-xs px-3 py-1.5 rounded-lg flex-1 text-center"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-soft)',
                color: 'var(--text-dim)',
              }}
            >
              Drop .yaml or .prst here
            </div>
            <CompileButton onClick={handleCompile} />
          </div>
        </div>

        {/* Right panel */}
        <div
          className="flex flex-col gap-3 p-3 overflow-hidden"
          style={{
            width: 220,
            background: 'var(--bg-panel)',
            flexShrink: 0,
          }}
        >
          <div
            className="text-xs font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Generated presets
          </div>

          <PresetList onDoubleClick={handlePresetDoubleClick} />

          <OutputDirPicker onPick={handlePickDir} onOpenFolder={handleOpenFolder} />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
