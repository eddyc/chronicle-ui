/**
 * useD3Grid - D3 grid line renderer for PianoRoll
 *
 * Renders horizontal (pitch) and vertical (beat) grid lines using D3 data joins.
 * Lines are viewport-culled and have adaptive density based on zoom level.
 */

import * as d3 from 'd3'
import { useEffect } from 'react'
import type { ViewportState } from '../../../hooks'
import type { PianoRollScales } from '../hooks/usePianoRollScales'
import {
  generateBeatColumns,
  generatePitchRows,
  type GridColumn,
} from '../utils/pianoRollHelpers'

// ============ Types ============

export interface UseD3GridOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  scales: PianoRollScales
  viewport: ViewportState
  theme: {
    border: {
      default: string
      subtle: string
    }
  }
}

// ============ Hook ============

export function useD3Grid(options: UseD3GridOptions): void {
  const { svgRef, scales, viewport, theme } = options
  const { gridWidth, gridHeight, pitchToY, beatToX } = scales

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    // Get or create grid group
    let gridGroup = svg.select<SVGGElement>('g.grid-lines')
    if (gridGroup.empty()) {
      gridGroup = svg.append('g').attr('class', 'grid-lines')
      gridGroup.append('g').attr('class', 'horizontal-lines')
      gridGroup.append('g').attr('class', 'vertical-lines')
    }

    // === Horizontal lines (pitch rows) ===
    const allPitchRows = generatePitchRows()
    const visiblePitchRows = allPitchRows.filter((pitch) => {
      const y = pitchToY(pitch)
      return y >= 0 && y <= gridHeight
    })

    const hLinesGroup = gridGroup.select<SVGGElement>('g.horizontal-lines')
    const hLines = hLinesGroup
      .selectAll<SVGLineElement, number>('line')
      .data(visiblePitchRows, (d) => d)

    // EXIT
    hLines.exit().remove()

    // ENTER + UPDATE
    hLines
      .enter()
      .append('line')
      .merge(hLines)
      .attr('x1', 0)
      .attr('y1', (d) => pitchToY(d) + scales.noteHeight) // Bottom of note row
      .attr('x2', gridWidth)
      .attr('y2', (d) => pitchToY(d) + scales.noteHeight)
      .attr('stroke', (d) => (d % 12 === 0 ? theme.border.default : theme.border.subtle))
      .attr('stroke-width', (d) => (d % 12 === 0 ? 1 : 0.5))
      .attr('shape-rendering', 'crispEdges')

    // === Vertical lines (beat columns) ===
    const beatColumns = generateBeatColumns(
      viewport.startBeat,
      viewport.endBeat,
      gridWidth
    )

    const vLinesGroup = gridGroup.select<SVGGElement>('g.vertical-lines')
    const vLines = vLinesGroup
      .selectAll<SVGLineElement, GridColumn>('line')
      .data(beatColumns, (d) => `${d.beat}`)

    // EXIT
    vLines.exit().remove()

    // ENTER + UPDATE
    vLines
      .enter()
      .append('line')
      .merge(vLines)
      .attr('x1', (d) => beatToX(d.beat))
      .attr('y1', 0)
      .attr('x2', (d) => beatToX(d.beat))
      .attr('y2', gridHeight)
      .attr('stroke', (d) =>
        d.level === 'bar' || d.level === 'beat'
          ? theme.border.default
          : theme.border.subtle
      )
      .attr('stroke-width', (d) =>
        d.level === 'bar' ? 1.5 : d.level === 'beat' ? 1 : 0.5
      )
      .attr('opacity', (d) =>
        d.level === 'fine' ? 0.5 : d.level === 'subbeat' ? 0.7 : 1
      )
      .attr('shape-rendering', 'crispEdges')
  }, [svgRef, scales, viewport, gridWidth, gridHeight, pitchToY, beatToX, theme])
}
