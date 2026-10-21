import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { EditorState } from '@codemirror/state'
import { CompletionContext } from '@codemirror/autocomplete'
import type { Catalog } from '@shared/ipc'
import { gp200Completions } from '@renderer/lib/completions'

const CATALOG_PATH = path.resolve(
  process.env.GP200_TOOLKIT ?? path.resolve(__dirname, '..', '..', '..', 'gp200-toolkit'),
  'gp200_catalog.json',
)
const catalog: Catalog | null = fs.existsSync(CATALOG_PATH)
  ? JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
  : null

function complete(doc: string): string[] {
  const state = EditorState.create({ doc })
  const result = gp200Completions(() => catalog)(new CompletionContext(state, doc.length, false))
  return result ? result.options.map((o) => o.label) : []
}

describe.skipIf(!catalog)('YAML autocompletion', () => {
  it('offers the effects of the current module', () => {
    const labels = complete('name: T\nslots:\n  AMP:\n    effect: ')
    expect(labels).toContain('UK 800')
    expect(labels).not.toContain('Green OD')
    expect(complete('name: T\nslots:\n  CAB:\n    effect: ')).toContain('auto')
  })

  it("offers the parameters of the slot's effect", () => {
    expect(complete('name: T\nslots:\n  AMP:\n    effect: UK 800\n    ')).toEqual(
      expect.arrayContaining(['Gain', 'Presence', 'Middle', 'effect', 'enabled']),
    )
  })

  it('resolves CAB: auto to the cabinet matching the AMP', () => {
    const doc = 'name: T\nslots:\n  AMP:\n    effect: UK 800\n  CAB:\n    effect: auto\n    '
    expect(complete(doc)).toEqual(expect.arrayContaining(['Low Cut', 'High Cut']))
  })

  it('offers menu options and sync notes as values', () => {
    expect(complete('name: T\nslots:\n  DST:\n    effect: Force\n    Mode: ').sort()).toEqual(['HP', 'LP'])
    expect(complete('name: T\nslots:\n  DLY:\n    effect: Pure\n    Time: ')).toContain('1/8D')
  })

  it('offers module names under slots', () => {
    expect(complete('name: T\nslots:\n  ')).toEqual(expect.arrayContaining(['PRE', 'AMP', 'VOL']))
  })
})
