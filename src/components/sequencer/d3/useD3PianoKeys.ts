/**
 * useD3PianoKeys - D3 piano keys renderer
 *
 * Renders piano keys as SVG rects using D3 data joins.
 * Uses the same rendering pipeline as the grid for perfect sync.
 */

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import type { PianoRollScales } from '../hooks/usePianoRollScales'
import { generatePitchRows, isBlackKey } from '../utils/pianoRollHelpers'

// ============ Types ============

export interface UseD3PianoKeysOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  scales: PianoRollScales
  keyWidth: number
  hoveredPitch: number | null
  onHoverPitch: (pitch: number | null) => void
  onNotePreview?: (pitch: number, velocity: number) => void
  onNotePreviewEnd?: (pitch: number) => void
  theme: {
    border: {
      subtle: string
    }
    accent: {
      primary: string
    }
  }
}

// ============ Constants ============

const WHITE_KEY_COLOR = '#F5F5F0'
const BLACK_KEY_COLOR = '#1A1A1A'
const DEFAULT_VELOCITY = 0.8

// ============ Hook ============

export function useD3PianoKeys(options: UseD3PianoKeysOptions): void {
  const {
    svgRef,
    scales,
    keyWidth,
    hoveredPitch,
    onHoverPitch,
    onNotePreview,
    onNotePreviewEnd,
    theme,
  } = options
  const { gridHeight, noteHeight, pitchToY } = scales

  // Track currently playing pitch for mouseup
  const playingPitchRef = useRef<number | null>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    // Get or create piano keys group
    let keysGroup = svg.select<SVGGElement>('g.piano-keys')
    if (keysGroup.empty()) {
      keysGroup = svg.append('g').attr('class', 'piano-keys')
    }

    // Generate visible pitch rows
    const allPitchRows = generatePitchRows()
    const visiblePitchRows = allPitchRows.filter((pitch) => {
      const y = pitchToY(pitch)
      return y >= -noteHeight && y <= gridHeight
    })

    // Data join for piano keys
    const keys = keysGroup
      .selectAll<SVGRectElement, number>('rect.piano-key')
      .data(visiblePitchRows, (d) => d)

    // EXIT
    keys.exit().remove()

    // ENTER
    const keysEnter = keys
      .enter()
      .append('rect')
      .attr('class', 'piano-key')
      .style('cursor', 'pointer')

    // ENTER + UPDATE
    keysEnter
      .merge(keys)
      .attr('x', 0)
      .attr('y', (d) => pitchToY(d))
      .attr('width', keyWidth)
      .attr('height', noteHeight)
      .attr('fill', (d) => (isBlackKey(d) ? BLACK_KEY_COLOR : WHITE_KEY_COLOR))
      .attr('stroke', theme.border.subtle)
      .attr('stroke-width', 0.5)
      .on('mouseenter', (event, d) => {
        onHoverPitch(d)
      })
      .on('mouseleave', () => {
        onHoverPitch(null)
      })
      .on('mousedown', (event, d) => {
        playingPitchRef.current = d
        onNotePreview?.(d, DEFAULT_VELOCITY)
      })

    // Global mouseup to end note preview
    const handleMouseUp = () => {
      if (playingPitchRef.current !== null) {
        onNotePreviewEnd?.(playingPitchRef.current)
        playingPitchRef.current = null
      }
    }

    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [
    svgRef,
    scales,
    keyWidth,
    gridHeight,
    noteHeight,
    pitchToY,
    onHoverPitch,
    onNotePreview,
    onNotePreviewEnd,
    theme,
  ])

  // Update hover highlight separately (doesn't need full re-render)
  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const keysGroup = svg.select<SVGGElement>('g.piano-keys')

    keysGroup.selectAll<SVGRectElement, number>('rect.piano-key').attr('fill', (d) => {
      if (d === hoveredPitch) {
        return theme.accent.primary
      }
      return isBlackKey(d) ? BLACK_KEY_COLOR : WHITE_KEY_COLOR
    })
  }, [svgRef, hoveredPitch, theme])
}
