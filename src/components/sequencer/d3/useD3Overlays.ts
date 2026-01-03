/**
 * useD3Overlays - D3 overlay renderer for PianoRoll
 *
 * Renders non-interactive overlays:
 * - Playhead position indicator
 */

import * as d3 from 'd3'
import { useEffect } from 'react'
import type { ViewportState } from '../../../hooks'
import type { PianoRollScales } from '../hooks/usePianoRollScales'

// ============ Types ============

export interface UseD3OverlaysOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  playheadBeat: number
  scales: PianoRollScales
  viewport: ViewportState
  theme: {
    semantic: {
      error: string
    }
  }
}

// ============ Hook ============

export function useD3Overlays(options: UseD3OverlaysOptions): void {
  const { svgRef, playheadBeat, scales, viewport, theme } = options
  const { gridHeight, beatToX } = scales

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    // Get or create playhead line
    let playhead = svg.select<SVGLineElement>('line.playhead')
    if (playhead.empty()) {
      playhead = svg
        .append('line')
        .attr('class', 'playhead')
        .attr('pointer-events', 'none')
    }

    // Check if playhead is in visible range
    const isVisible =
      playheadBeat >= viewport.startBeat && playheadBeat <= viewport.endBeat

    const x = beatToX(playheadBeat)

    playhead
      .attr('x1', x)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', gridHeight)
      .attr('stroke', theme.semantic.error)
      .attr('stroke-width', 2)
      .attr('visibility', isVisible ? 'visible' : 'hidden')
  }, [svgRef, playheadBeat, scales, viewport, gridHeight, beatToX, theme])
}
