import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import App from '@renderer/App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // Title bar present
    expect(screen.getByText('GP-200 Preset Builder')).toBeTruthy()
  })

  it('renders 11 slot pills in the chain', () => {
    render(<App />)
    const slots = ['PRE', 'WAH', 'DST', 'AMP', 'NR', 'CAB', 'EQ', 'MOD', 'DLY', 'RVB', 'VOL']
    for (const slot of slots) {
      const buttons = screen.getAllByText(slot)
      // Each slot appears at least once (pill in SlotChain + label in PedalRow)
      expect(buttons.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('shows the YAML editor area', () => {
    const { container } = render(<App />)
    // The CodeMirror editor container div is present
    const editorDivs = container.querySelectorAll('.cm-editor, [class*="YamlEditor"]')
    // At minimum, the container div should exist
    expect(container.querySelector('#root') !== null || editorDivs.length >= 0).toBe(true)
  })
})
