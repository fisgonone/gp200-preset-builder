import '@testing-library/jest-dom'

// Mock window.api and window.store for renderer tests
Object.defineProperty(window, 'api', {
  value: {
    compileYaml: vi.fn().mockResolvedValue({ ok: true, outputPath: '/tmp/test.prst', sizeBytes: 1224, message: 'ok' }),
    decompilePrst: vi.fn().mockResolvedValue({ ok: true, yamlText: '' }),
    listPresets: vi.fn().mockResolvedValue([]),
    openFolder: vi.fn().mockResolvedValue(undefined),
    pickOutputDir: vi.fn().mockResolvedValue(null),
    readYamlFile: vi.fn().mockResolvedValue(''),
    getDefaultOutputDir: vi.fn().mockResolvedValue('/tmp/GP-200 Presets'),
    saveAs: vi.fn().mockResolvedValue(null),
  },
  writable: true,
})

Object.defineProperty(window, 'store', {
  value: {
    get: vi.fn().mockResolvedValue(''),
    set: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
})
