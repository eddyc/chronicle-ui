/**
 * useD3Overlays - D3 overlay renderer for PianoRoll
 *
 * Renders the loop region background highlight only.
 * Vertical lines are rendered in TimelineRuler (they extend from ruler through grid).
 *
 * Note: Playhead rendering is handled by usePlayheadAnimation for better performance.
 */

import { useEffect, useRef } from 'react'
import type { ViewportState } from '../../../hooks'
import type { PianoRollScales } from '../hooks/usePianoRollScales'

// ============ Types ============

export interface UseD3OverlaysOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  scales: PianoRollScales
  viewport: ViewportState
  gridWidth: number
  gridHeight: number
  loopStart: number
  loopEnd: number
  theme: {
    accent: {
      primary: string
      primaryMuted: string
    }
  }
}

// ============ Hook ============

export function useD3Overlays(options: UseD3OverlaysOptions): void {
  const { svgRef, scales, viewport, gridWidth, gridHeight, loopStart, loopEnd, theme } = options
  const bgGroupRef = useRef<SVGGElement | null>(null)

  // Setup background group at the BEGINNING (behind everything)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    let bgGroup = svg.querySelector<SVGGElement>('g.loop-background')
    if (!bgGroup) {
      bgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      bgGroup.setAttribute('class', 'loop-background')
      bgGroup.setAttribute('pointer-events', 'none')
      svg.insertBefore(bgGroup, svg.firstChild)
    }
    bgGroupRef.current = bgGroup

    return () => {
      bgGroup?.remove()
    }
  }, [svgRef])

  // Update loop region background
  useEffect(() => {
    const bgGroup = bgGroupRef.current
    const svg = svgRef.current
    if (!bgGroup || !svg) return

    // Ensure background group is always first (behind everything)
    if (bgGroup !== svg.firstChild) {
      svg.insertBefore(bgGroup, svg.firstChild)
    }

    // Clear existing elements
    while (bgGroup.firstChild) bgGroup.removeChild(bgGroup.firstChild)

    // Calculate positions
    const startX = scales.beatToX(loopStart)
    const endX = scales.beatToX(loopEnd)

    // Check if loop region is visible
    const regionVisible = loopEnd > viewport.startBeat && loopStart < viewport.endBeat

    // === Loop region background ===
    if (regionVisible) {
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('x', String(Math.max(0, startX)))
      bgRect.setAttribute('y', '0')
      bgRect.setAttribute('width', String(Math.max(0, Math.min(gridWidth, endX) - Math.max(0, startX))))
      bgRect.setAttribute('height', String(gridHeight))
      bgRect.setAttribute('fill', theme.accent.primary)
      bgRect.setAttribute('opacity', '0.08')
      bgGroup.appendChild(bgRect)
    }
  }, [svgRef, scales, viewport, gridWidth, gridHeight, loopStart, loopEnd, theme.accent.primary])
}
