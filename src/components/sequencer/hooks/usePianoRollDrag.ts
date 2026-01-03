/**
 * usePianoRollDrag - Drag state machine for PianoRoll
 *
 * Manages the drag state for note interactions:
 * - Brush selection (empty area drag)
 * - Note move (drag note body)
 * - Note resize (drag note edges)
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import type { MidiClip, MidiNote } from '@eddyc/chronicle-client'
import {
  createNoteId,
  DEFAULT_VELOCITY,
  type CoordinateHelpers,
} from '../utils/pianoRollHelpers'

// ============ Types ============

export type DragType = 'none' | 'brush' | 'move' | 'resize-start' | 'resize-end'

export interface DragState {
  type: DragType
  noteId?: string
  startBeat: number
  startPitch: number
  startX: number
  startY: number
  originalNote?: MidiNote
  /** Original positions of all selected notes for multi-note move */
  originalSelectedNotes?: Map<string, { startBeat: number; pitch: number }>
  /** Original notes for multi-note resize */
  originalSelectedNotesForResize?: Map<string, { startBeat: number; duration: number }>
}

export interface BrushRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface UsePianoRollDragOptions {
  clip: MidiClip
  onClipChange: (clip: MidiClip) => void
  selection: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  snapToBeat: number
  noteHeight: number
  gridRef: React.RefObject<HTMLDivElement>
  coordinateHelpers: CoordinateHelpers
}

export interface UsePianoRollDragResult {
  dragState: DragState
  brushRect: BrushRect | null
  brushPreviewIds: Set<string>
  handleGridMouseDown: (e: React.MouseEvent) => void
  handleGridMouseMove: (e: React.MouseEvent) => void
  handleGridMouseUp: (e: React.MouseEvent) => void
  handleGridDoubleClick: (e: React.MouseEvent) => void
}

// ============ Initial State ============

const INITIAL_DRAG_STATE: DragState = {
  type: 'none',
  startBeat: 0,
  startPitch: 0,
  startX: 0,
  startY: 0,
}

// ============ Hook ============

export function usePianoRollDrag(
  options: UsePianoRollDragOptions
): UsePianoRollDragResult {
  const {
    clip,
    onClipChange,
    selection,
    onSelectionChange,
    snapToBeat,
    noteHeight,
    gridRef,
    coordinateHelpers,
  } = options

  const { pixelToBeat, pixelToPitch, beatToX, pitchToY } = coordinateHelpers

  // Drag state
  const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE)

  // Brush selection rectangle (in pixels)
  const [brushRect, setBrushRect] = useState<BrushRect | null>(null)

  // Ref for cleanup functions
  const cleanupRef = useRef<(() => void) | null>(null)

  // Note CRUD operations
  const addNote = useCallback(
    (note: MidiNote) => {
      onClipChange({
        ...clip,
        notes: [...clip.notes, note],
      })
    },
    [clip, onClipChange]
  )

  // Helper to check if note intersects a rectangle
  const noteIntersectsRect = useCallback(
    (note: MidiNote, rect: BrushRect): boolean => {
      const noteX1 = beatToX(note.startBeat)
      const noteX2 = beatToX(note.startBeat + note.duration)
      const noteY1 = pitchToY(note.pitch)
      const noteY2 = noteY1 + noteHeight

      const rectX1 = Math.min(rect.x1, rect.x2)
      const rectX2 = Math.max(rect.x1, rect.x2)
      const rectY1 = Math.min(rect.y1, rect.y2)
      const rectY2 = Math.max(rect.y1, rect.y2)

      return !(noteX2 < rectX1 || noteX1 > rectX2 || noteY2 < rectY1 || noteY1 > rectY2)
    },
    [beatToX, pitchToY, noteHeight]
  )

  // Compute preview selection during brush drag
  const brushPreviewIds = useMemo(() => {
    if (dragState.type !== 'brush' || !brushRect) return new Set<string>()
    return new Set(
      clip.notes.filter((note) => noteIntersectsRect(note, brushRect)).map((n) => n.id)
    )
  }, [dragState.type, brushRect, clip.notes, noteIntersectsRect])

  // Double-click to create note
  const handleGridDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x)
      const pitch = pixelToPitch(y)

      // Don't create if clicking on a note
      const clickedNote = clip.notes.find((note) => {
        const noteStartX = beatToX(note.startBeat)
        const noteEndX = beatToX(note.startBeat + note.duration)
        const noteY = pitchToY(note.pitch)
        return x >= noteStartX && x <= noteEndX && y >= noteY && y < noteY + noteHeight
      })

      if (!clickedNote) {
        const newNote: MidiNote = {
          id: createNoteId(),
          pitch,
          startBeat: beat,
          duration: snapToBeat,
          velocity: DEFAULT_VELOCITY,
        }
        addNote(newNote)
        onSelectionChange(new Set([newNote.id]))
      }
    },
    [
      clip.notes,
      pixelToBeat,
      pixelToPitch,
      beatToX,
      pitchToY,
      snapToBeat,
      addNote,
      onSelectionChange,
      noteHeight,
      gridRef,
    ]
  )

  // Mouse down handler
  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x)
      const pitch = pixelToPitch(y)

      // Check if clicking on an existing note
      const clickedNote = clip.notes.find((note) => {
        const noteStartX = beatToX(note.startBeat)
        const noteEndX = beatToX(note.startBeat + note.duration)
        const noteY = pitchToY(note.pitch)

        return (
          x >= noteStartX && x <= noteEndX && y >= noteY && y < noteY + noteHeight
        )
      })

      if (clickedNote) {
        // Check if clicking near edges for resize
        const noteStartX = beatToX(clickedNote.startBeat)
        const noteEndX = beatToX(clickedNote.startBeat + clickedNote.duration)
        const edgeThreshold = 8

        if (x - noteStartX < edgeThreshold) {
          // If clicked note is selected, resize all selected; otherwise just this note
          const notesToResize = selection.has(clickedNote.id)
            ? clip.notes.filter((n) => selection.has(n.id))
            : [clickedNote]
          const originalNotes = new Map<string, { startBeat: number; duration: number }>()
          for (const note of notesToResize) {
            originalNotes.set(note.id, { startBeat: note.startBeat, duration: note.duration })
          }
          setDragState({
            type: 'resize-start',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            startX: x,
            startY: y,
            originalNote: { ...clickedNote },
            originalSelectedNotesForResize: originalNotes,
          })
        } else if (noteEndX - x < edgeThreshold) {
          // If clicked note is selected, resize all selected; otherwise just this note
          const notesToResize = selection.has(clickedNote.id)
            ? clip.notes.filter((n) => selection.has(n.id))
            : [clickedNote]
          const originalNotes = new Map<string, { startBeat: number; duration: number }>()
          for (const note of notesToResize) {
            originalNotes.set(note.id, { startBeat: note.startBeat, duration: note.duration })
          }
          setDragState({
            type: 'resize-end',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            startX: x,
            startY: y,
            originalNote: { ...clickedNote },
            originalSelectedNotesForResize: originalNotes,
          })
        } else {
          // Move note(s)
          let activeSelection: Set<string>
          if (!e.shiftKey && !selection.has(clickedNote.id)) {
            activeSelection = new Set([clickedNote.id])
            onSelectionChange(activeSelection)
          } else if (e.shiftKey) {
            const newSelection = new Set(selection)
            if (newSelection.has(clickedNote.id)) {
              newSelection.delete(clickedNote.id)
            } else {
              newSelection.add(clickedNote.id)
            }
            activeSelection = newSelection
            onSelectionChange(newSelection)
          } else {
            activeSelection = selection
          }

          // Capture original positions for multi-note move
          const originalPositions = new Map<
            string,
            { startBeat: number; pitch: number }
          >()
          for (const noteId of activeSelection) {
            const note = clip.notes.find((n) => n.id === noteId)
            if (note) {
              originalPositions.set(noteId, {
                startBeat: note.startBeat,
                pitch: note.pitch,
              })
            }
          }

          setDragState({
            type: 'move',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            startX: x,
            startY: y,
            originalNote: { ...clickedNote },
            originalSelectedNotes: originalPositions,
          })
        }
      } else {
        // Start brush selection with document-level listeners
        onSelectionChange(new Set())
        setBrushRect({ x1: x, y1: y, x2: x, y2: y })
        setDragState({
          type: 'brush',
          startBeat: beat,
          startPitch: pitch,
          startX: x,
          startY: y,
        })

        const handleBrushMove = (moveEvent: MouseEvent) => {
          if (!gridRef.current) return
          const rect = gridRef.current.getBoundingClientRect()
          const currentX = moveEvent.clientX - rect.left
          const currentY = moveEvent.clientY - rect.top
          setBrushRect((prev) =>
            prev ? { ...prev, x2: currentX, y2: currentY } : null
          )
        }

        const handleBrushUp = (upEvent: MouseEvent) => {
          if (gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect()
            const finalX = upEvent.clientX - rect.left
            const finalY = upEvent.clientY - rect.top
            const finalRect = { x1: x, y1: y, x2: finalX, y2: finalY }

            const selectedIds = clip.notes
              .filter((note) => noteIntersectsRect(note, finalRect))
              .map((n) => n.id)

            if (upEvent.shiftKey) {
              const newSelection = new Set(selection)
              selectedIds.forEach((id) => newSelection.add(id))
              onSelectionChange(newSelection)
            } else {
              onSelectionChange(new Set(selectedIds))
            }
          }

          setBrushRect(null)
          setDragState(INITIAL_DRAG_STATE)
          document.removeEventListener('mousemove', handleBrushMove)
          document.removeEventListener('mouseup', handleBrushUp)
          cleanupRef.current = null
        }

        document.addEventListener('mousemove', handleBrushMove)
        document.addEventListener('mouseup', handleBrushUp)
        cleanupRef.current = () => {
          document.removeEventListener('mousemove', handleBrushMove)
          document.removeEventListener('mouseup', handleBrushUp)
        }
      }
    },
    [
      clip.notes,
      pixelToBeat,
      pixelToPitch,
      beatToX,
      pitchToY,
      selection,
      onSelectionChange,
      noteHeight,
      gridRef,
      noteIntersectsRect,
    ]
  )

  // Mouse move handler
  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.type === 'none' || !gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x)
      const pitch = pixelToPitch(y)

      switch (dragState.type) {
        case 'brush': {
          setBrushRect((prev) => (prev ? { ...prev, x2: x, y2: y } : null))
          break
        }
        case 'move': {
          if (!dragState.originalSelectedNotes || dragState.originalSelectedNotes.size === 0)
            break
          const deltaBeat = beat - dragState.startBeat
          const deltaPitch = pitch - dragState.startPitch

          onClipChange({
            ...clip,
            notes: clip.notes.map((n) => {
              const original = dragState.originalSelectedNotes!.get(n.id)
              if (original) {
                return {
                  ...n,
                  startBeat: Math.max(0, original.startBeat + deltaBeat),
                  pitch: Math.max(0, Math.min(127, original.pitch + deltaPitch)),
                }
              }
              return n
            }),
          })
          break
        }
        case 'resize-start': {
          if (!dragState.originalSelectedNotesForResize) break
          const deltaBeat = beat - dragState.startBeat

          onClipChange({
            ...clip,
            notes: clip.notes.map((n) => {
              const original = dragState.originalSelectedNotesForResize!.get(n.id)
              if (original) {
                const newStart = Math.max(0, original.startBeat + deltaBeat)
                const noteEnd = original.startBeat + original.duration
                const newDuration = noteEnd - newStart
                // Only apply if duration stays valid
                if (newDuration >= snapToBeat) {
                  return { ...n, startBeat: newStart, duration: newDuration }
                }
              }
              return n
            }),
          })
          break
        }
        case 'resize-end': {
          if (!dragState.originalSelectedNotesForResize) break
          const deltaBeat = beat - dragState.startBeat

          onClipChange({
            ...clip,
            notes: clip.notes.map((n) => {
              const original = dragState.originalSelectedNotesForResize!.get(n.id)
              if (original) {
                const newDuration = Math.max(snapToBeat, original.duration + deltaBeat)
                return { ...n, duration: newDuration }
              }
              return n
            }),
          })
          break
        }
      }
    },
    [
      dragState,
      pixelToBeat,
      pixelToPitch,
      snapToBeat,
      clip,
      onClipChange,
      gridRef,
    ]
  )

  // Mouse up handler
  const handleGridMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.type === 'none' || !gridRef.current) return

      if (dragState.type === 'brush' && brushRect) {
        const selectedIds = clip.notes
          .filter((note) => noteIntersectsRect(note, brushRect))
          .map((n) => n.id)

        if (e.shiftKey) {
          const newSelection = new Set(selection)
          selectedIds.forEach((id) => newSelection.add(id))
          onSelectionChange(newSelection)
        } else {
          onSelectionChange(new Set(selectedIds))
        }
        setBrushRect(null)
      }

      setDragState(INITIAL_DRAG_STATE)
    },
    [
      dragState,
      brushRect,
      clip.notes,
      noteIntersectsRect,
      selection,
      onSelectionChange,
      gridRef,
    ]
  )

  return {
    dragState,
    brushRect,
    brushPreviewIds,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
    handleGridDoubleClick,
  }
}
