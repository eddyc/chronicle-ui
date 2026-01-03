/**
 * useD3Brush - D3 brush selection for PianoRoll
 *
 * Handles rectangular brush selection using d3-brush:
 * - Brush on empty area to select notes
 * - Shift+brush to add to selection
 * - Preview highlighting during brush
 */

import * as d3 from 'd3'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { MidiClip, MidiNote } from '@eddyc/chronicle-client'
import type { PianoRollScales } from '../hooks/usePianoRollScales'

// ============ Types ============

export interface BrushRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface UseD3BrushOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  clip: MidiClip
  scales: PianoRollScales
  selection: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

export interface UseD3BrushResult {
  brushPreviewIds: Set<string>
}

// ============ Hook ============

export function useD3Brush(options: UseD3BrushOptions): UseD3BrushResult {
  const { svgRef, clip, scales, selection, onSelectionChange } = options

  const [brushPreviewIds, setBrushPreviewIds] = useState<Set<string>>(new Set())

  // Use refs for values that change frequently
  const clipRef = useRef(clip)
  const selectionRef = useRef(selection)
  const scalesRef = useRef(scales)
  clipRef.current = clip
  selectionRef.current = selection
  scalesRef.current = scales

  // Helper to find notes intersecting a rectangle
  const getNotesInRect = useCallback(
    (x1: number, y1: number, x2: number, y2: number): string[] => {
      const scales = scalesRef.current
      const { beatToX, pitchToY, noteHeight } = scales

      const rectLeft = Math.min(x1, x2)
      const rectRight = Math.max(x1, x2)
      const rectTop = Math.min(y1, y2)
      const rectBottom = Math.max(y1, y2)

      return clipRef.current.notes
        .filter((note) => {
          const noteX1 = beatToX(note.startBeat)
          const noteX2 = beatToX(note.startBeat + note.duration)
          const noteY1 = pitchToY(note.pitch)
          const noteY2 = noteY1 + noteHeight

          // Check for intersection
          return !(
            noteX2 < rectLeft ||
            noteX1 > rectRight ||
            noteY2 < rectTop ||
            noteY1 > rectBottom
          )
        })
        .map((n) => n.id)
    },
    []
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const svgSelection = d3.select(svg)
    const { gridWidth, gridHeight } = scalesRef.current

    // Get or create brush group
    let brushGroup = svgSelection.select<SVGGElement>('g.brush')
    if (brushGroup.empty()) {
      brushGroup = svgSelection.append('g').attr('class', 'brush')
    }

    // Track if we're actively brushing
    let isBrushing = false
    let shiftKeyHeld = false

    // Create brush behavior
    const brush = d3
      .brush()
      .extent([
        [0, 0],
        [gridWidth, gridHeight],
      ])
      .filter((event: MouseEvent) => {
        // Only start brush if not clicking on a note
        const target = event.target as Element
        return !target.closest('.note')
      })
      .on('start', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection) return
        isBrushing = true
        shiftKeyHeld = (event.sourceEvent as MouseEvent)?.shiftKey ?? false

        // Clear selection unless shift is held
        if (!shiftKeyHeld) {
          onSelectionChange(new Set())
        }
      })
      .on('brush', (event: d3.D3BrushEvent<unknown>) => {
        if (!event.selection || !isBrushing) return

        const [[x1, y1], [x2, y2]] = event.selection as [[number, number], [number, number]]
        const noteIds = getNotesInRect(x1, y1, x2, y2)
        setBrushPreviewIds(new Set(noteIds))
      })
      .on('end', (event: d3.D3BrushEvent<unknown>) => {
        if (!isBrushing) return
        isBrushing = false

        if (event.selection) {
          const [[x1, y1], [x2, y2]] = event.selection as [[number, number], [number, number]]
          const noteIds = getNotesInRect(x1, y1, x2, y2)

          if (shiftKeyHeld) {
            // Add to existing selection
            const newSelection = new Set(selectionRef.current)
            noteIds.forEach((id) => newSelection.add(id))
            onSelectionChange(newSelection)
          } else {
            onSelectionChange(new Set(noteIds))
          }
        }

        // Clear brush preview
        setBrushPreviewIds(new Set())

        // Clear the brush selection rectangle
        brushGroup.call(brush.move, null)
      })

    // Apply brush to group
    brushGroup.call(brush)

    // Style the brush selection rectangle
    brushGroup
      .select('.selection')
      .attr('fill', 'rgba(100, 150, 255, 0.2)')
      .attr('stroke', 'rgba(100, 150, 255, 0.8)')
      .attr('stroke-width', 1)

    // Hide the brush handles (we don't need resize handles)
    brushGroup.selectAll('.handle').attr('display', 'none')

    return () => {
      brushGroup.remove()
    }
  }, [svgRef, scales.gridWidth, scales.gridHeight, onSelectionChange, getNotesInRect])

  return { brushPreviewIds }
}
