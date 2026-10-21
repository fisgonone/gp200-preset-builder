import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'
import type { Catalog, CatalogEffect, CatalogParam } from '@shared/ipc'
import { SLOT_KEYS } from '../types'

const TOP_KEYS = ['name', 'author', 'note', 'slot', 'tempo', 'volume', 'pan', 'chain', 'fx_loop', 'slots', 'exp', 'ctrl']
const SYNC_NOTES = ['1/1', '1/2', '1/2D', '1/2T', '1/4', '1/4D', '1/4T', '1/8', '1/8D', '1/8T', '1/16']

/** Same normalisation as the toolkit: case, spaces and most punctuation ignored. */
export function norm(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#%/]/g, '')
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(+n.toFixed(2))
}

export function describeParam(p: CatalogParam): string {
  if (p.options && p.options.length) return p.options.map((o) => o.name).join(' | ')
  let text = `${fmt(p.min)}..${fmt(p.max)}${p.unit ? ' ' + p.unit : ''}`
  if (p.min_is_off) text += ', or OFF'
  if (p.value_type === 1 && p.bind !== undefined) text += ', or 1/8D… with Sync ON'
  return text
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length
}

interface Context {
  topKey: string | null
  module: string | null
  effectName: string | null
}

/** Work out which section / slot / effect the cursor line belongs to. */
function locate(lines: string[], row: number): Context {
  let topKey: string | null = null
  let module: string | null = null
  let moduleRow = -1
  for (let i = row - 1; i >= 0; i--) {
    const line = lines[i]
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const ind = indentOf(line)
    const key = line.trim().split(':')[0].trim()
    if (ind === 0) {
      topKey = key
      break
    }
    if (ind === 2 && module === null && indentOf(lines[row]) > 2) {
      module = key.toUpperCase()
      moduleRow = i
    }
  }
  let effectName: string | null = null
  if (module !== null) {
    for (let i = moduleRow + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim() && indentOf(line) <= 2) break
      const m = /^\s+effect:\s*(.+?)\s*(#.*)?$/.exec(line)
      if (m) {
        effectName = m[1].replace(/^['"]|['"]$/g, '')
        break
      }
    }
  }
  return { topKey, module, effectName }
}

function findEffect(catalog: Catalog, module: string, name: string): CatalogEffect | undefined {
  const key = norm(name)
  return catalog.effects.find((e) => e.modules.includes(module) && norm(e.name) === key)
}

function effectFor(catalog: Catalog, ctx: Context, lines: string[]): CatalogEffect | undefined {
  if (!ctx.module || !ctx.effectName) return undefined
  if (norm(ctx.effectName) === 'auto' && ctx.module === 'CAB') {
    // CAB: auto follows the AMP; find the AMP's effect to resolve its cabinet.
    const ampRow = lines.findIndex((l) => /^ {2}AMP:\s*$/i.test(l))
    if (ampRow < 0) return undefined
    const amp = locate(lines, ampRow + 1)
    const ampEffect = amp.effectName ? findEffect(catalog, 'AMP', amp.effectName) : undefined
    return catalog.effects.find((e) => e.code === ampEffect?.cab_code)
  }
  return findEffect(catalog, ctx.module, ctx.effectName)
}

export function gp200Completions(getCatalog: () => Catalog | null) {
  return (context: CompletionContext): CompletionResult | null => {
    const catalog = getCatalog()
    const doc = context.state.doc
    const line = doc.lineAt(context.pos)
    const before = line.text.slice(0, context.pos - line.from)
    if (before.trimStart().startsWith('#')) return null
    const lines = doc.toString().split('\n')
    const row = line.number - 1
    const ind = indentOf(before)
    const ctx = locate(lines, row)

    // top-level keys
    if (ind === 0 && /^[\w]*$/.test(before)) {
      if (!context.explicit && before.length === 0) return null
      return { from: line.from, options: TOP_KEYS.map((k) => ({ label: k, apply: `${k}: `, type: 'keyword' })) }
    }

    if (ctx.topKey !== 'slots' || !catalog) return null

    // module names under slots:
    if (ind === 2 && /^\s*\w*$/.test(before)) {
      const from = line.from + ind
      return {
        from,
        options: SLOT_KEYS.map((m) => ({ label: m, apply: `${m}:\n    effect: `, type: 'class' })),
      }
    }
    if (!ctx.module || ind < 4) return null

    // effect: <name>
    const effectMatch = /^(\s+effect:\s*)(.*)$/.exec(before)
    if (effectMatch) {
      const from = line.from + effectMatch[1].length
      const options: Completion[] = catalog.effects
        .filter((e) => e.modules.includes(ctx.module!))
        .map((e) => ({ label: e.name, type: 'function', detail: e.params.map((p) => p.name).join(', ') }))
      if (ctx.module === 'CAB') options.unshift({ label: 'auto', type: 'keyword', detail: 'cabinet matching the AMP' })
      return { from, options, validFor: /^[\w .+\-/']*$/ }
    }

    const effect = effectFor(catalog, ctx, lines)

    // parameter value
    const valueMatch = /^(\s+([^:#]+):\s*)(\S*)$/.exec(before)
    if (valueMatch) {
      const key = valueMatch[2].trim()
      const from = line.from + valueMatch[1].length
      if (key === 'enabled') {
        return { from, options: ['true', 'false'].map((v) => ({ label: v, type: 'keyword' })) }
      }
      const param = effect?.params.find((p) => norm(p.name) === norm(key))
      if (!param) return null
      if (param.options?.length) {
        return { from, options: param.options.map((o) => ({ label: o.name, type: 'enum' })) }
      }
      const options: Completion[] = [{ label: fmt(param.default), detail: `default · ${describeParam(param)}`, type: 'constant' }]
      if (param.min_is_off) options.push({ label: 'OFF', type: 'keyword' })
      if (param.value_type === 1 && param.bind !== undefined) {
        SYNC_NOTES.forEach((n) => options.push({ label: n, detail: 'with Sync ON', type: 'enum' }))
      }
      return { from, options }
    }

    // parameter names inside a slot
    if (/^\s+[^:#]*$/.test(before)) {
      const from = line.from + ind
      const options: Completion[] = [
        { label: 'effect', apply: 'effect: ', type: 'keyword' },
        { label: 'enabled', apply: 'enabled: ', type: 'keyword' },
      ]
      for (const p of effect?.params ?? []) {
        options.push({ label: p.name, apply: `${p.name}: `, detail: describeParam(p), type: 'property' })
      }
      return { from, options, validFor: /^[\w .%+&/-]*$/ }
    }
    return null
  }
}
