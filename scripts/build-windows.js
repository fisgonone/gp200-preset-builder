#!/usr/bin/env node
/**
 * build-windows.js
 *
 * Full build pipeline:
 * 1. prepare-python
 * 2. electron-vite build
 * 3. electron-builder --win
 */

const { execSync } = require('child_process')

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: require('path').resolve(__dirname, '..') })
}

console.log('=== GP-200 Preset Builder — Windows build ===\n')

run('node scripts/prepare-python.js')
run('npm run build')
run('npx electron-builder --win')

console.log('\n✓ Build complete. Check dist/ for the installer.\n')
