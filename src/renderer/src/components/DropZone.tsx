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
      className="relative h-full w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-lg pointer-events-none"
          style={{
            background: 'rgba(59,130,246,0.08)',
            border: '2px dashed #3B82F6',
          }}
        >
          <div className="text-accent text-sm font-medium bg-bg-base/90 px-4 py-2 rounded-lg">
            Drop .yaml or .prst here
          </div>
        </div>
      )}
    </div>
  )
}
