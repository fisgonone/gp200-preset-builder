import React, { useState, useRef } from 'react'

interface Props {
  onYamlDrop: (yamlText: string) => void
  onPrstDrop: (prstPath: string) => void
  children: React.ReactNode
}

export function DropZone({ onYamlDrop, onPrstDrop, children }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current++
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (!file) return

    const lower = file.name.toLowerCase()

    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
      const text = await file.text()
      onYamlDrop(text)
    } else if (lower.endsWith('.prst')) {
      // Pass the file path via Electron's path property
      const path = (file as { path?: string }).path
      if (path) {
        onPrstDrop(path)
      }
    }
  }

  return (
    <div
      className="relative flex-1 min-h-0 w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(22,28,34,0.82)', border: '2px dashed var(--vu)' }}
        >
          <div className="text-vu font-semibold" style={{ fontSize: 18 }}>
            Drop to open this preset
          </div>
        </div>
      )}
    </div>
  )
}
