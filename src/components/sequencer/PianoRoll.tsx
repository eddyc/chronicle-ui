/**
 * PianoRoll - MIDI note editor component
 *
 * A piano roll interface for creating and editing MIDI clips.
 * Supports:
 * - Click/drag to create notes
 * - Drag to move notes
 * - Drag edges to resize notes
 * - Click piano keys to preview notes
 * - Selection for multi-note operations
 *
 * @example
 * ```tsx
 * <PianoRoll
 *   clip={clip}
 *   onClipChange={setClip}
 *   playheadBeat={playheadBeat}
 *   onNotePreview={(pitch, vel) => noteOn(pitch, vel)}
 *   onNotePreviewEnd={(pitch) => noteOff(pitch)}
 * />
 * ```
 */

import { Box } from '@mui/material'
import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useChronicleTheme, usePianoRollViewport } from '../../hooks'
import { TimelineRuler } from './TimelineRuler'
import type { MidiClip, MidiNote } from '@eddyc/chronicle-client'

// ============ Constants ============

const DEFAULT_VISIBLE_BEATS = 8
const DEFAULT_SNAP_TO_BEAT = 0.25 // 1/16th note
const KEY_WIDTH = 40
const DEFAULT_LOW_NOTE = 36 // C2
const DEFAULT_HIGH_NOTE = 84 // C6
const DEFAULT_VELOCITY = 0.8

// ============ Types ============

export interface PianoRollProps {
  /** The clip being edited */
  clip: MidiClip
  /** Callback when clip changes */
  onClipChange: (clip: MidiClip) => void
  /** Current playhead position in beats */
  playheadBeat?: number
  /** Number of beats visible in the viewport */
  visibleBeats?: number
  /** Snap grid size in beats (e.g., 0.25 = 1/16th note) */
  snapToBeat?: number
  /** Lowest MIDI note to display */
  lowNote?: number
  /** Highest MIDI note to display */
  highNote?: number
  /** Called when a note should be previewed (clicked on piano key) */
  onNotePreview?: (pitch: number, velocity: number) => void
  /** Called when a note preview should end */
  onNotePreviewEnd?: (pitch: number) => void
  /** Currently selected note IDs */
  selectedNoteIds?: Set<string>
  /** Callback when selection changes */
  onSelectionChange?: (ids: Set<string>) => void
  /** Height of the component */
  height?: number
}

interface DragState {
  type: 'none' | 'brush' | 'move' | 'resize-start' | 'resize-end'
  noteId?: string
  startBeat: number
  startPitch: number
  startX: number
  startY: number
  originalNote?: MidiNote
  /** Original positions of all selected notes for multi-note move */
  originalSelectedNotes?: Map<string, { startBeat: number; pitch: number }>
}

// ============ Helpers ============

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const note = NOTE_NAMES[midi % 12]
  return `${note}${octave}`
}

function isBlackKey(midi: number): boolean {
  const note = midi % 12
  return [1, 3, 6, 8, 10].includes(note)
}

function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

function createNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ============ Component ============

export function PianoRoll({
  clip,
  onClipChange,
  playheadBeat = 0,
  visibleBeats = DEFAULT_VISIBLE_BEATS,
  snapToBeat = DEFAULT_SNAP_TO_BEAT,
  lowNote = DEFAULT_LOW_NOTE,
  highNote = DEFAULT_HIGH_NOTE,
  onNotePreview,
  onNotePreviewEnd,
  selectedNoteIds,
  onSelectionChange,
  height = 300,
}: PianoRollProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Viewport state for pan/zoom
  const { viewport, panZoomTime, panZoomPitch, createWheelHandler } =
    usePianoRollViewport({
      clipLength: clip.length,
      initialBeats: visibleBeats,
      initialLowNote: lowNote,
      initialHighNote: highNote,
    })

  // Controlled or uncontrolled selection
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set())
  const selection = selectedNoteIds ?? internalSelection
  const setSelection = onSelectionChange ?? setInternalSelection

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    type: 'none',
    startBeat: 0,
    startPitch: 0,
    startX: 0,
    startY: 0,
  })

  // Brush selection rectangle (in pixels)
  const [brushRect, setBrushRect] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)

  // Preview state for piano keys
  const [previewPitch, setPreviewPitch] = useState<number | null>(null)

  // Grid dimensions from container
  const [gridWidth, setGridWidth] = useState(400)

  // Grid container height (from actual rendered size)
  const [gridContainerHeight, setGridContainerHeight] = useState(300)

  // Measure grid width and height on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setGridWidth(containerRef.current.clientWidth - KEY_WIDTH)
      }
      if (gridRef.current) {
        setGridContainerHeight(gridRef.current.clientHeight)
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Calculate dimensions using viewport
  const noteRange = viewport.highNote - viewport.lowNote + 1
  const beatsVisible = viewport.endBeat - viewport.startBeat

  // Use container height for rendering, with noteHeight calculated dynamically
  // This ensures grid lines and piano keys fill the available space
  const gridHeight = gridContainerHeight
  const noteHeight = gridHeight / noteRange

  // Convert pixel coordinates to beat/pitch (using viewport)
  const pixelToBeat = useCallback(
    (x: number): number => {
      const gridX = x - KEY_WIDTH
      const beat = viewport.startBeat + (gridX / gridWidth) * beatsVisible
      return snap(beat, snapToBeat)
    },
    [viewport.startBeat, gridWidth, beatsVisible, snapToBeat]
  )

  const pixelToPitch = useCallback(
    (y: number): number => {
      const row = Math.floor(y / noteHeight)
      return viewport.highNote - row
    },
    [viewport.highNote, noteHeight]
  )

  // Convert beat/pitch to pixel (using viewport)
  const beatToX = useCallback(
    (beat: number): number => {
      return ((beat - viewport.startBeat) / beatsVisible) * gridWidth
    },
    [viewport.startBeat, beatsVisible, gridWidth]
  )

  const pitchToY = useCallback(
    (pitch: number): number => {
      return (viewport.highNote - pitch) * noteHeight
    },
    [viewport.highNote, noteHeight]
  )

  // Attach wheel handler for panning
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const wheelHandler = createWheelHandler(gridWidth, gridHeight)
    grid.addEventListener('wheel', wheelHandler, { passive: false })
    return () => grid.removeEventListener('wheel', wheelHandler)
  }, [createWheelHandler, gridWidth, gridHeight])

  // Note: Timeline ruler now handles its own pan/zoom with anchor-based behavior.
  // It calls panZoomTime directly with the anchor beat captured on mousedown.

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

  const updateNote = useCallback(
    (noteId: string, updates: Partial<MidiNote>) => {
      onClipChange({
        ...clip,
        notes: clip.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
      })
    },
    [clip, onClipChange]
  )

  const deleteSelectedNotes = useCallback(() => {
    onClipChange({
      ...clip,
      notes: clip.notes.filter((n) => !selection.has(n.id)),
    })
    setSelection(new Set())
  }, [clip, onClipChange, selection, setSelection])

  const handleClipLengthChange = useCallback(
    (newLength: number) => {
      onClipChange({
        ...clip,
        length: newLength,
      })
    },
    [clip, onClipChange]
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNotes()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteSelectedNotes])

  // Double-click to create note
  const handleGridDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x + KEY_WIDTH)
      const pitch = pixelToPitch(y)

      // Don't create if clicking on a note
      const clickedNote = clip.notes.find((note) => {
        const noteStartX = beatToX(note.startBeat)
        const noteEndX = beatToX(note.startBeat + note.duration)
        const noteY = pitchToY(note.pitch)
        return x >= noteStartX && x <= noteEndX && y >= noteY && y < noteY + noteHeight
      })

      if (!clickedNote) {
        // Create new note with default duration
        const newNote: MidiNote = {
          id: createNoteId(),
          pitch,
          startBeat: beat,
          duration: snapToBeat, // Default to one grid unit
          velocity: DEFAULT_VELOCITY,
        }
        addNote(newNote)
        setSelection(new Set([newNote.id]))
      }
    },
    [clip.notes, pixelToBeat, pixelToPitch, beatToX, pitchToY, snapToBeat, addNote, setSelection, noteHeight]
  )

  // Mouse handlers for grid
  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x + KEY_WIDTH)
      const pitch = pixelToPitch(y)

      // Check if clicking on an existing note
      const clickedNote = clip.notes.find((note) => {
        const noteStartX = beatToX(note.startBeat)
        const noteEndX = beatToX(note.startBeat + note.duration)
        const noteY = pitchToY(note.pitch)

        return (
          x >= noteStartX &&
          x <= noteEndX &&
          y >= noteY &&
          y < noteY + noteHeight
        )
      })

      if (clickedNote) {
        // Check if clicking near edges for resize
        const noteStartX = beatToX(clickedNote.startBeat)
        const noteEndX = beatToX(clickedNote.startBeat + clickedNote.duration)
        const edgeThreshold = 8

        if (x - noteStartX < edgeThreshold) {
          setDragState({
            type: 'resize-start',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            startX: x,
            startY: y,
            originalNote: { ...clickedNote },
          })
        } else if (noteEndX - x < edgeThreshold) {
          setDragState({
            type: 'resize-end',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            startX: x,
            startY: y,
            originalNote: { ...clickedNote },
          })
        } else {
          // Move note(s)
          // Determine the active selection for this move
          let activeSelection: Set<string>
          if (!e.shiftKey && !selection.has(clickedNote.id)) {
            // Clicking non-selected note without shift: select only this note
            activeSelection = new Set([clickedNote.id])
            setSelection(activeSelection)
          } else if (e.shiftKey) {
            // Shift-click: toggle in selection
            const newSelection = new Set(selection)
            if (newSelection.has(clickedNote.id)) {
              newSelection.delete(clickedNote.id)
            } else {
              newSelection.add(clickedNote.id)
            }
            activeSelection = newSelection
            setSelection(newSelection)
          } else {
            // Clicking already-selected note: use existing selection
            activeSelection = selection
          }

          // Capture original positions of all selected notes for multi-note move
          const originalPositions = new Map<string, { startBeat: number; pitch: number }>()
          for (const noteId of activeSelection) {
            const note = clip.notes.find(n => n.id === noteId)
            if (note) {
              originalPositions.set(noteId, { startBeat: note.startBeat, pitch: note.pitch })
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
        setSelection(new Set())
        setBrushRect({ x1: x, y1: y, x2: x, y2: y })
        setDragState({
          type: 'brush',
          startBeat: beat,
          startPitch: pitch,
          startX: x,
          startY: y,
        })

        // Use document-level listeners so brush continues when cursor leaves grid
        const handleBrushMove = (moveEvent: MouseEvent) => {
          if (!gridRef.current) return
          const rect = gridRef.current.getBoundingClientRect()
          // Allow coordinates to extend outside grid bounds
          const currentX = moveEvent.clientX - rect.left
          const currentY = moveEvent.clientY - rect.top
          setBrushRect((prev) => prev ? { ...prev, x2: currentX, y2: currentY } : null)
        }

        const handleBrushUp = (upEvent: MouseEvent) => {
          // Selection is already computed via brushPreviewIds and will be
          // applied through the normal flow. Just clean up.
          // Get final selection from current brush rect
          if (gridRef.current) {
            const rect = gridRef.current.getBoundingClientRect()
            const finalX = upEvent.clientX - rect.left
            const finalY = upEvent.clientY - rect.top
            const finalRect = { x1: x, y1: y, x2: finalX, y2: finalY }

            const selectedIds = clip.notes
              .filter((note) => {
                const noteX1 = beatToX(note.startBeat)
                const noteX2 = beatToX(note.startBeat + note.duration)
                const noteY1 = pitchToY(note.pitch)
                const noteY2 = noteY1 + noteHeight
                const rectX1 = Math.min(finalRect.x1, finalRect.x2)
                const rectX2 = Math.max(finalRect.x1, finalRect.x2)
                const rectY1 = Math.min(finalRect.y1, finalRect.y2)
                const rectY2 = Math.max(finalRect.y1, finalRect.y2)
                return !(noteX2 < rectX1 || noteX1 > rectX2 || noteY2 < rectY1 || noteY1 > rectY2)
              })
              .map((n) => n.id)

            if (upEvent.shiftKey) {
              const newSelection = new Set(selection)
              selectedIds.forEach((id) => newSelection.add(id))
              setSelection(newSelection)
            } else {
              setSelection(new Set(selectedIds))
            }
          }

          setBrushRect(null)
          setDragState({ type: 'none', startBeat: 0, startPitch: 0, startX: 0, startY: 0 })
          document.removeEventListener('mousemove', handleBrushMove)
          document.removeEventListener('mouseup', handleBrushUp)
        }

        document.addEventListener('mousemove', handleBrushMove)
        document.addEventListener('mouseup', handleBrushUp)
      }
    },
    [clip.notes, pixelToBeat, pixelToPitch, beatToX, pitchToY, selection, setSelection, noteHeight]
  )

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.type === 'none' || !gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const beat = pixelToBeat(x + KEY_WIDTH)
      const pitch = pixelToPitch(y)

      switch (dragState.type) {
        case 'brush': {
          // Update brush rectangle
          setBrushRect((prev) => (prev ? { ...prev, x2: x, y2: y } : null))
          break
        }
        case 'move': {
          if (!dragState.originalSelectedNotes || dragState.originalSelectedNotes.size === 0) break
          const deltaBeat = beat - dragState.startBeat
          const deltaPitch = pitch - dragState.startPitch

          // Update all selected notes at once
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
          if (!dragState.originalNote) break
          const deltaBeat = beat - dragState.startBeat
          const newStart = Math.max(0, dragState.originalNote.startBeat + deltaBeat)
          const newDuration = dragState.originalNote.startBeat + dragState.originalNote.duration - newStart
          if (newDuration > snapToBeat) {
            updateNote(dragState.noteId!, {
              startBeat: newStart,
              duration: newDuration,
            })
          }
          break
        }
        case 'resize-end': {
          if (!dragState.originalNote) break
          const deltaBeat = beat - dragState.startBeat
          const newDuration = Math.max(snapToBeat, dragState.originalNote.duration + deltaBeat)
          updateNote(dragState.noteId!, {
            duration: newDuration,
          })
          break
        }
      }
    },
    [dragState, pixelToBeat, pixelToPitch, updateNote, snapToBeat, clip, onClipChange]
  )

  // Helper to check if note intersects a rectangle
  const noteIntersectsRect = useCallback(
    (
      note: MidiNote,
      rect: { x1: number; y1: number; x2: number; y2: number }
    ): boolean => {
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

  // Compute preview selection during brush drag (for real-time highlighting)
  const brushPreviewIds = useMemo(() => {
    if (dragState.type !== 'brush' || !brushRect) return new Set<string>()
    return new Set(
      clip.notes
        .filter((note) => noteIntersectsRect(note, brushRect))
        .map((n) => n.id)
    )
  }, [dragState.type, brushRect, clip.notes, noteIntersectsRect])

  const handleGridMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.type === 'none' || !gridRef.current) return

      if (dragState.type === 'brush' && brushRect) {
        // Select notes that intersect the brush rectangle
        const selectedIds = clip.notes
          .filter((note) => noteIntersectsRect(note, brushRect))
          .map((n) => n.id)

        if (e.shiftKey) {
          // Add to existing selection
          const newSelection = new Set(selection)
          selectedIds.forEach((id) => newSelection.add(id))
          setSelection(newSelection)
        } else {
          setSelection(new Set(selectedIds))
        }
        setBrushRect(null)
      }

      setDragState({ type: 'none', startBeat: 0, startPitch: 0, startX: 0, startY: 0 })
    },
    [dragState, brushRect, clip.notes, noteIntersectsRect, selection, setSelection]
  )

  // Piano key handlers
  const handleKeyMouseDown = useCallback(
    (pitch: number) => {
      setPreviewPitch(pitch)
      onNotePreview?.(pitch, DEFAULT_VELOCITY)
    },
    [onNotePreview]
  )

  const handleKeyMouseUp = useCallback(() => {
    if (previewPitch !== null) {
      onNotePreviewEnd?.(previewPitch)
      setPreviewPitch(null)
    }
  }, [previewPitch, onNotePreviewEnd])

  // Generate ALL pitch rows (0-127) - viewport clipping handles visibility
  // This ensures grid lines and piano keys scroll properly with the viewport
  const allPitchRows = useMemo(() => {
    const rows = []
    for (let pitch = 127; pitch >= 0; pitch--) {
      rows.push(pitch)
    }
    return rows
  }, [])

  // Generate beat columns using viewport with adaptive grid density
  const beatColumns = useMemo(() => {
    const cols: Array<{ beat: number; level: 'bar' | 'beat' | 'subbeat' | 'fine' }> = []
    const pixelsPerBeat = gridWidth / beatsVisible

    // Determine grid step based on zoom level (minimum ~15px between lines)
    // More zoomed in = smaller step, more zoomed out = larger step
    let gridStep: number
    if (pixelsPerBeat >= 120) {
      gridStep = 0.125  // 1/32nd notes when very zoomed in
    } else if (pixelsPerBeat >= 60) {
      gridStep = 0.25   // 1/16th notes
    } else if (pixelsPerBeat >= 30) {
      gridStep = 0.5    // 1/8th notes
    } else if (pixelsPerBeat >= 15) {
      gridStep = 1      // quarter notes (beats)
    } else {
      gridStep = 4      // bars only when very zoomed out
    }

    const firstBeat = Math.floor(viewport.startBeat / gridStep) * gridStep
    for (let beat = firstBeat; beat <= viewport.endBeat; beat += gridStep) {
      if (beat >= viewport.startBeat) {
        // Classify the beat for visual hierarchy
        const isBar = Math.abs(beat - Math.round(beat / 4) * 4) < 0.001
        const isBeat = Math.abs(beat - Math.round(beat)) < 0.001
        const isSubbeat = Math.abs(beat * 4 - Math.round(beat * 4)) < 0.001

        const level = isBar ? 'bar' : isBeat ? 'beat' : isSubbeat ? 'subbeat' : 'fine'
        cols.push({ beat, level })
      }
    }
    return cols
  }, [viewport.startBeat, viewport.endBeat, gridWidth, beatsVisible])

  // Piano keys drag state - anchor-based pan/zoom
  const keysContainerRef = useRef<HTMLDivElement>(null)
  const keysDragAnchorRef = useRef<{ anchorPitch: number } | null>(null)
  const keysLastXRef = useRef<number>(0)

  const handleKeysMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!keysContainerRef.current) return

      const rect = keysContainerRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const ratio = y / gridHeight

      // Calculate the pitch under the cursor at drag start
      // Y=0 is top (high notes), Y=gridHeight is bottom (low notes)
      const anchorPitch = viewport.highNote - ratio * noteRange

      keysDragAnchorRef.current = { anchorPitch }
      keysLastXRef.current = e.clientX

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!keysDragAnchorRef.current || !keysContainerRef.current) return

        const rect = keysContainerRef.current.getBoundingClientRect()
        const currentY = moveEvent.clientY - rect.top
        const currentRatio = Math.max(0, Math.min(1, currentY / gridHeight))

        // Calculate zoom from horizontal drag (deltaX since last frame)
        const deltaX = moveEvent.clientX - keysLastXRef.current
        keysLastXRef.current = moveEvent.clientX

        // Drag right = zoom in (smaller range), drag left = zoom out
        const zoomDelta = 1 - deltaX * 0.01

        // Call panZoomPitch with anchor pitch, current cursor ratio, and zoom
        panZoomPitch(keysDragAnchorRef.current.anchorPitch, currentRatio, zoomDelta)
      }

      const cleanup = () => {
        keysDragAnchorRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
        document.removeEventListener('mouseleave', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
      document.addEventListener('mouseleave', cleanup)
    },
    [viewport.highNote, noteRange, gridHeight, panZoomPitch]
  )

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height,
        overflow: 'hidden',
        backgroundColor: semantic.background.surface,
        borderRadius: 1,
        border: `1px solid ${semantic.border.default}`,
        userSelect: 'none',
      }}
    >
      {/* Timeline ruler row */}
      <Box sx={{ display: 'flex' }}>
        {/* Empty corner above piano keys */}
        <Box
          sx={{
            width: KEY_WIDTH,
            height: 24,
            flexShrink: 0,
            backgroundColor: semantic.background.elevated,
            borderRight: `1px solid ${semantic.border.default}`,
            borderBottom: `1px solid ${semantic.border.default}`,
          }}
        />
        {/* Timeline ruler */}
        <TimelineRuler
          startBeat={viewport.startBeat}
          endBeat={viewport.endBeat}
          width={gridWidth}
          onPanZoom={panZoomTime}
          clipLength={clip.length}
          onClipLengthChange={handleClipLengthChange}
        />
      </Box>

      {/* Main content row */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Piano keyboard */}
        <Box
          ref={keysContainerRef}
          sx={{
            width: KEY_WIDTH,
            flexShrink: 0,
            borderRight: `1px solid ${semantic.border.default}`,
            overflow: 'hidden',
            cursor: 'ns-resize',
            position: 'relative',
          }}
          onMouseDown={handleKeysMouseDown}
          onMouseUp={handleKeyMouseUp}
          onMouseLeave={handleKeyMouseUp}
        >
        {allPitchRows.map((pitch) => {
          const y = pitchToY(pitch)
          // Skip rendering if outside visible area (with some buffer)
          if (y < -noteHeight || y > gridHeight + noteHeight) return null

          const isBlack = isBlackKey(pitch)
          const isC = pitch % 12 === 0
          return (
            <Box
              key={pitch}
              onMouseDown={() => handleKeyMouseDown(pitch)}
              sx={{
                position: 'absolute',
                top: y,
                left: 0,
                right: 0,
                height: noteHeight,
                backgroundColor: isBlack
                  ? previewPitch === pitch
                    ? semantic.accent.primaryMuted
                    : semantic.background.elevated
                  : previewPitch === pitch
                    ? semantic.accent.primary
                    : semantic.background.page,
                borderBottom: `1px solid ${semantic.border.subtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 0.5,
                cursor: 'pointer',
                transition: 'background-color 0.1s',
                '&:hover': {
                  backgroundColor: isBlack
                    ? semantic.background.sunken
                    : semantic.background.surface,
                },
              }}
            >
              {isC && (
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.6rem',
                    color: semantic.text.secondary,
                  }}
                >
                  {midiToNoteName(pitch)}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Note grid */}
      <Box
        ref={gridRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleGridMouseMove}
        onMouseUp={handleGridMouseUp}
        onMouseLeave={() => {
          // Don't cancel brush selection on mouse leave - document listeners handle it
          // Only reset for move/resize operations
          if (dragState.type !== 'none' && dragState.type !== 'brush') {
            setDragState({ type: 'none', startBeat: 0, startPitch: 0, startX: 0, startY: 0 })
          }
        }}
        onDoubleClick={handleGridDoubleClick}
      >
        {/* Grid lines */}
        <svg
          width="100%"
          height={gridHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Horizontal lines (pitch rows) */}
          {allPitchRows.map((pitch) => {
            const y = pitchToY(pitch) + noteHeight
            // Skip rendering if outside visible area
            if (y < 0 || y > gridHeight) return null

            const isC = pitch % 12 === 0
            return (
              <line
                key={`h-${pitch}`}
                x1={0}
                y1={y}
                x2="100%"
                y2={y}
                stroke={isC ? semantic.border.default : semantic.border.subtle}
                strokeWidth={isC ? 1 : 0.5}
              />
            )
          })}
          {/* Vertical lines (beat grid) - adaptive density */}
          {beatColumns.map(({ beat, level }) => {
            const x = beatToX(beat)
            return (
              <line
                key={`v-${beat}`}
                x1={x}
                y1={0}
                x2={x}
                y2={gridHeight}
                stroke={
                  level === 'bar' ? semantic.border.default :
                  level === 'beat' ? semantic.border.default :
                  semantic.border.subtle
                }
                strokeWidth={level === 'bar' ? 1.5 : level === 'beat' ? 1 : 0.5}
                opacity={level === 'fine' ? 0.5 : level === 'subbeat' ? 0.7 : 1}
              />
            )
          })}
        </svg>

        {/* Notes - only render if visible in viewport */}
        {clip.notes
          .filter((note) => {
            // Check if note is within visible viewport
            const noteEnd = note.startBeat + note.duration
            const inTimeRange = noteEnd >= viewport.startBeat && note.startBeat <= viewport.endBeat
            // Use floor/ceil since pitches are integers but viewport bounds can be fractional
            const inPitchRange = note.pitch >= Math.floor(viewport.lowNote) &&
                                 note.pitch <= Math.ceil(viewport.highNote)
            return inTimeRange && inPitchRange
          })
          .map((note) => {
            const x = beatToX(note.startBeat)
            const y = pitchToY(note.pitch)
            const width = (note.duration / beatsVisible) * gridWidth
            const isSelected = selection.has(note.id)
            const isInBrushPreview = brushPreviewIds.has(note.id)
            const shouldHighlight = isSelected || isInBrushPreview
            const noteWidth = Math.max(8, width - 1)

            return (
              <Box
                key={note.id}
                sx={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: noteWidth,
                  height: noteHeight - 1,
                  backgroundColor: shouldHighlight
                    ? semantic.accent.primary
                    : semantic.accent.primaryMuted,
                  borderRadius: 0.5,
                  border: `1px solid ${shouldHighlight ? semantic.accent.primary : semantic.border.default}`,
                  cursor: dragState.type === 'none' ? 'grab' : 'grabbing',
                  opacity: note.velocity,
                  transition: 'background-color 0.1s, border-color 0.1s',
                  '&:hover': {
                    borderColor: semantic.accent.primary,
                  },
                }}
              >
                {/* Resize handles */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 6,
                    height: '100%',
                    cursor: 'ew-resize',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 6,
                    height: '100%',
                    cursor: 'ew-resize',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                />
              </Box>
            )
          })}

        {/* Playhead */}
        {playheadBeat >= viewport.startBeat && playheadBeat <= viewport.endBeat && (
          <Box
            sx={{
              position: 'absolute',
              left: beatToX(playheadBeat),
              top: 0,
              width: 2,
              height: gridHeight,
              backgroundColor: semantic.semantic.error,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}

        {/* Brush selection rectangle - clamp to grid bounds for visual rendering */}
        {brushRect && (() => {
          // Calculate raw rect bounds
          const rawLeft = Math.min(brushRect.x1, brushRect.x2)
          const rawTop = Math.min(brushRect.y1, brushRect.y2)
          const rawRight = Math.max(brushRect.x1, brushRect.x2)
          const rawBottom = Math.max(brushRect.y1, brushRect.y2)

          // Clamp to grid bounds
          const clampedLeft = Math.max(0, rawLeft)
          const clampedTop = Math.max(0, rawTop)
          const clampedRight = Math.min(gridWidth, rawRight)
          const clampedBottom = Math.min(gridHeight, rawBottom)

          // Only render if there's a visible area
          const visibleWidth = clampedRight - clampedLeft
          const visibleHeight = clampedBottom - clampedTop
          if (visibleWidth <= 0 || visibleHeight <= 0) return null

          return (
            <Box
              sx={{
                position: 'absolute',
                left: clampedLeft,
                top: clampedTop,
                width: visibleWidth,
                height: visibleHeight,
                backgroundColor: 'rgba(100, 150, 255, 0.2)',
                border: '1px solid rgba(100, 150, 255, 0.8)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            />
          )
        })()}
      </Box>
      </Box>{/* End main content row */}
    </Box>
  )
}
