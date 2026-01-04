/**
 * useD3PianoKeys - D3 piano keys renderer
 *
 * Renders piano keys as SVG rects using D3 data joins.
 * Uses the same rendering pipeline as the grid for perfect sync.
 *
 * When noteMap is provided, renders only the labeled notes with their names.
 */

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import type { PianoRollScales } from '../hooks/usePianoRollScales'
import { generatePitchRows, isBlackKey } from '../utils/pianoRollHelpers'

// ============ Types ============

/**
 * A labeled note for display
 */
export interface NoteLabel {
  note: number
  label: string
  color?: string
}

export interface UseD3PianoKeysOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  scales: PianoRollScales
  keyWidth: number
  hoveredPitch: number | null
  onHoverPitch: (pitch: number | null) => void
  onNotePreview?: (pitch: number, velocity: number) => void
  onNotePreviewEnd?: (pitch: number) => void
  /** When provided, render only these labeled notes instead of full piano */
  noteMap?: NoteLabel[]
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
const NOTE_PAD_COLOR = '#2C2C2C'
const NOTE_PAD_TEXT_COLOR = '#E0E0E0'
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
    noteMap,
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

    // Clear any existing labels group
    svg.select('g.note-labels').remove()

    // Note map mode: render only labeled notes
    if (noteMap && noteMap.length > 0) {
      // Sort by note descending for consistent rendering
      const sortedNotes = [...noteMap].sort((a, b) => b.note - a.note)
      const visibleNotes = sortedNotes.filter((n) => {
        const y = pitchToY(n.note)
        return y >= -noteHeight && y <= gridHeight
      })

      // Data join for note pads
      const keys = keysGroup
        .selectAll<SVGRectElement, NoteLabel>('rect.piano-key')
        .data(visibleNotes, (d) => d.note)

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
        .attr('y', (d) => pitchToY(d.note))
        .attr('width', keyWidth)
        .attr('height', noteHeight)
        .attr('fill', (d) => d.color || NOTE_PAD_COLOR)
        .attr('stroke', theme.border.subtle)
        .attr('stroke-width', 0.5)
        .on('mouseenter', (event, d) => {
          onHoverPitch(d.note)
        })
        .on('mouseleave', () => {
          onHoverPitch(null)
        })
        .on('mousedown', (event, d) => {
          playingPitchRef.current = d.note
          onNotePreview?.(d.note, DEFAULT_VELOCITY)
        })

      // Create labels group
      let labelsGroup = svg.select<SVGGElement>('g.note-labels')
      if (labelsGroup.empty()) {
        labelsGroup = svg.append('g').attr('class', 'note-labels')
      }

      // Data join for labels
      const labels = labelsGroup
        .selectAll<SVGTextElement, NoteLabel>('text.note-label')
        .data(visibleNotes, (d) => d.note)

      // EXIT
      labels.exit().remove()

      // ENTER
      const labelsEnter = labels
        .enter()
        .append('text')
        .attr('class', 'note-label')
        .style('pointer-events', 'none')
        .style('user-select', 'none')

      // ENTER + UPDATE
      labelsEnter
        .merge(labels)
        .attr('x', keyWidth / 2)
        .attr('y', (d) => pitchToY(d.note) + noteHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', NOTE_PAD_TEXT_COLOR)
        .attr('font-size', Math.min(10, noteHeight * 0.6))
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text((d) => d.label)
    } else {
      // Piano mode: render all 128 keys
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
    }

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
    noteMap,
    theme,
  ])

  // Update hover highlight separately (doesn't need full re-render)
  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const keysGroup = svg.select<SVGGElement>('g.piano-keys')

    if (noteMap && noteMap.length > 0) {
      // Note map mode: highlight by matching note
      keysGroup.selectAll<SVGRectElement, NoteLabel>('rect.piano-key').attr('fill', (d) => {
        if (d.note === hoveredPitch) {
          return theme.accent.primary
        }
        return d.color || NOTE_PAD_COLOR
      })
    } else {
      // Piano mode: black/white keys
      keysGroup.selectAll<SVGRectElement, number>('rect.piano-key').attr('fill', (d) => {
        if (d === hoveredPitch) {
          return theme.accent.primary
        }
        return isBlackKey(d) ? BLACK_KEY_COLOR : WHITE_KEY_COLOR
      })
    }
  }, [svgRef, hoveredPitch, noteMap, theme])
}
