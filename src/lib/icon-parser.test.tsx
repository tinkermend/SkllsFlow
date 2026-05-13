import { describe, expect, it } from 'vitest'
import { ChartColumn, Package } from 'lucide-react'
import { getSupportedIconNames, parseIcon } from './icon-parser'

describe('icon-parser', () => {
  it('normalizes supported lucide icon names without importing the whole library dynamically', () => {
    expect(parseIcon('ChartColumn')).toBe(ChartColumn)
    expect(parseIcon('chart-column')).toBe(ChartColumn)
    expect(parseIcon('lucide:chart-column')).toBe(ChartColumn)
  })

  it('falls back to Package for unknown icon names', () => {
    expect(parseIcon('UnknownIcon')).toBe(Package)
    expect(parseIcon(null)).toBe(Package)
  })

  it('exposes the supported icon allowlist for picker and validation use', () => {
    expect(getSupportedIconNames()).toContain('ChartColumn')
    expect(getSupportedIconNames()).not.toContain('UnknownIcon')
  })
})
