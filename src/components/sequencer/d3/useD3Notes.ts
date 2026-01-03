/**
 * useD3Notes - D3 notes renderer for PianoRoll
 *
 * Renders MIDI notes as SVG rectangles using D3 data joins.
 * Supports selection highlighting, loop dimming, and resize handles.
 */

import * as d3 from 'd3'
import { useEffect } from 'react'
import type { MidiNote } from '@eddyc/chronicle-client'
import type { ViewportState } from '../../../hooks'
import type { PianoRollScales } from '../hooks/usePianoRollScales'

// ============ Types ============

export interface D3NoteData extends MidiNote {
  x: number
  y: number
  width: number
  height: number
  isSelected: boolean
  isInBrushPreview: boolean
  isOutsideLoop: boolean
}

export interface UseD3NotesOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  notes: MidiNote[]
  scales: PianoRollScales
  viewport: ViewportState
  selection: Set<string>
  brushPreviewIds: Set<string>
  loopStart: number
  loopEnd: number
  theme: {
    accent: {
      primary: string
      primaryHover: string
      primaryPressed: string
    }
  }
}

// ============ Hook ============

export function useD3Notes(options: UseD3NotesOptions): void {
  const {
    svgRef,
    notes,
    scales,
    viewport,
    selection,
    brushPreviewIds,
    loopStart,
    loopEnd,
    theme,
  } = options
  const { gridWidth, gridHeight, noteHeight, beatToX, pitchToY } = scales

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)

    // Get or create notes group
    let notesGroup = svg.select<SVGGElement>('g.notes')
    if (notesGroup.empty()) {
      notesGroup = svg.append('g').attr('class', 'notes')
    }

    // Filter to visible notes and transform to D3NoteData
    const visibleNotes = notes.filter((note) => {
      const noteEnd = note.startBeat + note.duration
      const inTimeRange =
        noteEnd >= viewport.startBeat && note.startBeat <= viewport.endBeat
      const inPitchRange =
        note.pitch > viewport.lowNote - 1 && note.pitch < viewport.highNote + 1
      return inTimeRange && inPitchRange
    })

    const noteData: D3NoteData[] = visibleNotes.map((note) => {
      const x = beatToX(note.startBeat)
      const y = pitchToY(note.pitch)
      const noteEndX = beatToX(note.startBeat + note.duration)
      const width = Math.max(8, noteEndX - x - 1)
      const noteEnd = note.startBeat + note.duration

      return {
        ...note,
        x,
        y,
        width,
        height: noteHeight - 1,
        isSelected: selection.has(note.id),
        isInBrushPreview: brushPreviewIds.has(note.id),
        isOutsideLoop: note.startBeat >= loopEnd || noteEnd <= loopStart,
      }
    })

    // D3 data join for note groups
    const noteGroups = notesGroup
      .selectAll<SVGGElement, D3NoteData>('g.note')
      .data(noteData, (d) => d.id)

    // EXIT
    noteGroups.exit().remove()

    // ENTER - create new note groups
    const enterGroups = noteGroups.enter().append('g').attr('class', 'note')

    // Note body rectangle
    enterGroups
      .append('rect')
      .attr('class', 'note-body')
      .attr('rx', 2)
      .attr('ry', 2)

    // Left resize handle
    enterGroups
      .append('rect')
      .attr('class', 'resize-handle-left')
      .attr('x', 0)
      .attr('width', 6)
      .attr('fill', 'transparent')
      .style('cursor', 'ew-resize')

    // Right resize handle
    enterGroups
      .append('rect')
      .attr('class', 'resize-handle-right')
      .attr('width', 6)
      .attr('fill', 'transparent')
      .style('cursor', 'ew-resize')

    // UPDATE + ENTER - update all notes
    const allNotes = enterGroups.merge(noteGroups)

    // Position the group
    allNotes
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .attr('data-note-id', (d) => d.id)
      .style('cursor', 'grab')

    // Update note body
    allNotes
      .select<SVGRectElement>('.note-body')
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('fill', (d) =>
        d.isSelected || d.isInBrushPreview
          ? theme.accent.primary
          : theme.accent.primaryPressed
      )
      .attr('stroke', (d) =>
        d.isSelected || d.isInBrushPreview
          ? theme.accent.primaryHover
          : theme.accent.primaryPressed
      )
      .attr('stroke-width', 1)
      .attr('opacity', (d) => (d.isOutsideLoop ? 0.4 : 1))

    // Update resize handles
    allNotes
      .select<SVGRectElement>('.resize-handle-left')
      .attr('height', (d) => d.height)

    allNotes
      .select<SVGRectElement>('.resize-handle-right')
      .attr('x', (d) => d.width - 6)
      .attr('height', (d) => d.height)
  }, [
    svgRef,
    notes,
    scales,
    viewport,
    selection,
    brushPreviewIds,
    loopStart,
    loopEnd,
    gridWidth,
    gridHeight,
    noteHeight,
    beatToX,
    pitchToY,
    theme,
  ])
}
