/**
 * useD3NoteDrag - D3 drag behavior for PianoRoll notes
 *
 * Handles note move and resize via d3-drag:
 * - Drag note body = move (single or multi-note)
 * - Drag left edge = resize start
 * - Drag right edge = resize end
 * - Shift+click = add/remove from selection
 */

import * as d3 from 'd3'
import { useEffect, useRef, useCallback } from 'react'
import type { MidiClip, MidiNote } from '@eddyc/chronicle-client'
import type { PianoRollScales } from '../hooks/usePianoRollScales'
import { createNoteId, DEFAULT_VELOCITY, snap } from '../utils/pianoRollHelpers'

// ============ Types ============

type DragType = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  type: DragType
  noteId: string
  startX: number
  startY: number
  originalNote: MidiNote
  /** For multi-note move: original positions of all selected notes */
  originalSelectedNotes: Map<string, { startBeat: number; pitch: number }>
  /** For multi-note resize: original dimensions of all selected notes */
  originalSelectedNotesForResize: Map<string, { startBeat: number; duration: number }>
}

export interface UseD3NoteDragOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  clip: MidiClip
  onClipChange: (clip: MidiClip) => void
  scales: PianoRollScales
  selection: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  snapToBeat: number
}

// ============ Constants ============

const EDGE_THRESHOLD = 6

// ============ Hook ============

export function useD3NoteDrag(options: UseD3NoteDragOptions): void {
  const {
    svgRef,
    clip,
    onClipChange,
    scales,
    selection,
    onSelectionChange,
    snapToBeat,
  } = options

  // Use refs for values that change frequently but shouldn't trigger effect re-runs
  const clipRef = useRef(clip)
  const selectionRef = useRef(selection)
  const scalesRef = useRef(scales)
  clipRef.current = clip
  selectionRef.current = selection
  scalesRef.current = scales

  // Double-click to create note
  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      const svg = svgRef.current
      if (!svg) return

      // Check if clicking on a note
      const target = event.target as Element
      if (target.closest('.note')) return

      const rect = svg.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const { xToBeat, yToPitch, noteHeight } = scalesRef.current
      const beat = xToBeat(x)
      const pitch = yToPitch(y)

      const newNote: MidiNote = {
        id: createNoteId(),
        pitch,
        startBeat: beat,
        duration: snapToBeat,
        velocity: DEFAULT_VELOCITY,
      }

      onClipChange({
        ...clipRef.current,
        notes: [...clipRef.current.notes, newNote],
      })
      onSelectionChange(new Set([newNote.id]))
    },
    [svgRef, snapToBeat, onClipChange, onSelectionChange]
  )

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Add double-click handler
    svg.addEventListener('dblclick', handleDoubleClick)

    const svgSelection = d3.select(svg)
    const { noteHeight } = scalesRef.current

    // State for current drag operation
    let dragState: DragState | null = null

    // Create drag behavior
    const drag = d3
      .drag<SVGGElement, unknown>()
      .on('start', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
        const noteGroup = d3.select(this)
        const noteId = noteGroup.attr('data-note-id')
        if (!noteId) return

        const clip = clipRef.current
        const selection = selectionRef.current
        const scales = scalesRef.current

        const note = clip.notes.find((n) => n.id === noteId)
        if (!note) return

        // Determine drag type based on click position within the note
        const noteBodyRect = (this.querySelector('.note-body') as SVGRectElement)?.getBoundingClientRect()
        const groupRect = this.getBoundingClientRect()

        // Click position relative to note
        const localX = event.sourceEvent.clientX - groupRect.left

        let type: DragType = 'move'
        if (localX < EDGE_THRESHOLD) {
          type = 'resize-start'
        } else if (localX > groupRect.width - EDGE_THRESHOLD) {
          type = 'resize-end'
        }

        // Handle selection on click
        if (type === 'move') {
          const shiftKey = (event.sourceEvent as MouseEvent).shiftKey
          if (!shiftKey && !selection.has(noteId)) {
            // Click without shift on unselected note: select only this note
            onSelectionChange(new Set([noteId]))
          } else if (shiftKey) {
            // Shift+click: toggle selection
            const newSelection = new Set(selection)
            if (newSelection.has(noteId)) {
              newSelection.delete(noteId)
            } else {
              newSelection.add(noteId)
            }
            onSelectionChange(newSelection)
          }
        }

        // Get the current selection (may have just been updated)
        const currentSelection = type === 'move' && !selection.has(noteId) && !(event.sourceEvent as MouseEvent).shiftKey
          ? new Set([noteId])
          : selectionRef.current

        // Capture original positions for multi-note operations
        const originalSelectedNotes = new Map<string, { startBeat: number; pitch: number }>()
        const originalSelectedNotesForResize = new Map<string, { startBeat: number; duration: number }>()

        if (type === 'move') {
          for (const id of currentSelection) {
            const n = clip.notes.find((note) => note.id === id)
            if (n) {
              originalSelectedNotes.set(id, { startBeat: n.startBeat, pitch: n.pitch })
            }
          }
        } else {
          // For resize, if the dragged note is selected, resize all selected notes
          // Otherwise, just resize this one note
          const notesToResize = currentSelection.has(noteId)
            ? clip.notes.filter((n) => currentSelection.has(n.id))
            : [note]
          for (const n of notesToResize) {
            originalSelectedNotesForResize.set(n.id, { startBeat: n.startBeat, duration: n.duration })
          }
        }

        dragState = {
          type,
          noteId,
          startX: event.x,
          startY: event.y,
          originalNote: { ...note },
          originalSelectedNotes,
          originalSelectedNotesForResize,
        }

        // Change cursor during drag
        d3.select(this).style('cursor', type === 'move' ? 'grabbing' : 'ew-resize')
      })
      .on('drag', function (event: d3.D3DragEvent<SVGGElement, unknown, unknown>) {
        if (!dragState) return

        const clip = clipRef.current
        const scales = scalesRef.current
        const { xToBeat, yToPitch, beatToX } = scales

        // Calculate delta in beats and pitch
        const currentBeat = xToBeat(event.x)
        const startBeat = xToBeat(dragState.startX)
        const deltaBeat = snap(currentBeat - startBeat, snapToBeat)

        const currentPitch = yToPitch(event.y)
        const startPitch = yToPitch(dragState.startY)
        const deltaPitch = currentPitch - startPitch

        let updatedNotes: MidiNote[]

        switch (dragState.type) {
          case 'move': {
            updatedNotes = clip.notes.map((n) => {
              const original = dragState!.originalSelectedNotes.get(n.id)
              if (original) {
                return {
                  ...n,
                  startBeat: Math.max(0, original.startBeat + deltaBeat),
                  pitch: Math.max(0, Math.min(127, original.pitch + deltaPitch)),
                }
              }
              return n
            })
            break
          }
          case 'resize-start': {
            updatedNotes = clip.notes.map((n) => {
              const original = dragState!.originalSelectedNotesForResize.get(n.id)
              if (original) {
                const newStart = Math.max(0, original.startBeat + deltaBeat)
                const noteEnd = original.startBeat + original.duration
                const newDuration = noteEnd - newStart
                if (newDuration >= snapToBeat) {
                  return { ...n, startBeat: newStart, duration: newDuration }
                }
              }
              return n
            })
            break
          }
          case 'resize-end': {
            updatedNotes = clip.notes.map((n) => {
              const original = dragState!.originalSelectedNotesForResize.get(n.id)
              if (original) {
                const newDuration = Math.max(snapToBeat, original.duration + deltaBeat)
                return { ...n, duration: newDuration }
              }
              return n
            })
            break
          }
          default:
            updatedNotes = clip.notes
        }

        onClipChange({ ...clip, notes: updatedNotes })
      })
      .on('end', function () {
        if (!dragState) return

        // Reset cursor
        d3.select(this).style('cursor', 'grab')
        dragState = null
      })

    // Apply drag behavior to notes group
    // We need to apply it whenever notes change, so we do it here
    svgSelection.selectAll<SVGGElement, unknown>('g.note').call(drag)

    // Set up a MutationObserver to apply drag to new notes
    const observer = new MutationObserver(() => {
      svgSelection.selectAll<SVGGElement, unknown>('g.note').call(drag)
    })

    const notesGroup = svg.querySelector('g.notes')
    if (notesGroup) {
      observer.observe(notesGroup, { childList: true })
    }

    return () => {
      svg.removeEventListener('dblclick', handleDoubleClick)
      observer.disconnect()
    }
  }, [svgRef, snapToBeat, onClipChange, onSelectionChange, handleDoubleClick])
}
