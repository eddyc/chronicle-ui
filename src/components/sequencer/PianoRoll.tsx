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
import { useChronicleTheme } from '../../hooks'
import type { MidiClip, MidiNote } from '@eddyc/chronicle-client'

// ============ Constants ============

const DEFAULT_VISIBLE_BEATS = 8
const DEFAULT_SNAP_TO_BEAT = 0.25 // 1/16th note
const NOTE_HEIGHT = 12
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
  type: 'none' | 'create' | 'move' | 'resize-start' | 'resize-end'
  noteId?: string
  startBeat: number
  startPitch: number
  originalNote?: MidiNote
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
  const { semantic, components } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Controlled or uncontrolled selection
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set())
  const selection = selectedNoteIds ?? internalSelection
  const setSelection = onSelectionChange ?? setInternalSelection

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    type: 'none',
    startBeat: 0,
    startPitch: 0,
  })

  // Preview state for piano keys
  const [previewPitch, setPreviewPitch] = useState<number | null>(null)

  // Calculate dimensions
  const noteRange = highNote - lowNote + 1
  const gridHeight = noteRange * NOTE_HEIGHT
  const beatWidth = useMemo(() => {
    if (!containerRef.current) return 50
    const containerWidth = containerRef.current.clientWidth - KEY_WIDTH
    return containerWidth / visibleBeats
  }, [visibleBeats])

  // Convert pixel coordinates to beat/pitch
  const pixelToBeat = useCallback(
    (x: number): number => {
      const gridX = x - KEY_WIDTH
      return snap(gridX / beatWidth, snapToBeat)
    },
    [beatWidth, snapToBeat]
  )

  const pixelToPitch = useCallback(
    (y: number): number => {
      const row = Math.floor(y / NOTE_HEIGHT)
      return highNote - row
    },
    [highNote]
  )

  const pitchToY = useCallback(
    (pitch: number): number => {
      return (highNote - pitch) * NOTE_HEIGHT
    },
    [highNote]
  )

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
        const noteStartX = note.startBeat * beatWidth
        const noteEndX = (note.startBeat + note.duration) * beatWidth
        const noteY = pitchToY(note.pitch)
        const noteX = x

        return (
          noteX >= noteStartX &&
          noteX <= noteEndX &&
          y >= noteY &&
          y < noteY + NOTE_HEIGHT
        )
      })

      if (clickedNote) {
        // Check if clicking near edges for resize
        const noteStartX = clickedNote.startBeat * beatWidth
        const noteEndX = (clickedNote.startBeat + clickedNote.duration) * beatWidth
        const edgeThreshold = 8

        if (x - noteStartX < edgeThreshold) {
          setDragState({
            type: 'resize-start',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            originalNote: { ...clickedNote },
          })
        } else if (noteEndX - x < edgeThreshold) {
          setDragState({
            type: 'resize-end',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            originalNote: { ...clickedNote },
          })
        } else {
          // Move note
          if (!e.shiftKey && !selection.has(clickedNote.id)) {
            setSelection(new Set([clickedNote.id]))
          } else if (e.shiftKey) {
            const newSelection = new Set(selection)
            if (newSelection.has(clickedNote.id)) {
              newSelection.delete(clickedNote.id)
            } else {
              newSelection.add(clickedNote.id)
            }
            setSelection(newSelection)
          }
          setDragState({
            type: 'move',
            noteId: clickedNote.id,
            startBeat: beat,
            startPitch: pitch,
            originalNote: { ...clickedNote },
          })
        }
      } else {
        // Create new note
        setSelection(new Set())
        setDragState({
          type: 'create',
          startBeat: beat,
          startPitch: pitch,
        })
      }
    },
    [clip.notes, pixelToBeat, pixelToPitch, beatWidth, pitchToY, selection, setSelection]
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
        case 'create': {
          // Visual feedback during creation would be handled by a preview overlay
          break
        }
        case 'move': {
          if (!dragState.originalNote) break
          const deltaBeat = beat - dragState.startBeat
          const deltaPitch = pitch - dragState.startPitch
          updateNote(dragState.noteId!, {
            startBeat: Math.max(0, dragState.originalNote.startBeat + deltaBeat),
            pitch: Math.max(lowNote, Math.min(highNote, dragState.originalNote.pitch + deltaPitch)),
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
    [dragState, pixelToBeat, pixelToPitch, updateNote, lowNote, highNote, snapToBeat]
  )

  const handleGridMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.type === 'none' || !gridRef.current) return

      if (dragState.type === 'create') {
        const rect = gridRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const endBeat = pixelToBeat(x + KEY_WIDTH)
        const duration = Math.max(snapToBeat, endBeat - dragState.startBeat)

        if (duration > 0) {
          const newNote: MidiNote = {
            id: createNoteId(),
            pitch: dragState.startPitch,
            startBeat: dragState.startBeat,
            duration,
            velocity: DEFAULT_VELOCITY,
          }
          addNote(newNote)
          setSelection(new Set([newNote.id]))
        }
      }

      setDragState({ type: 'none', startBeat: 0, startPitch: 0 })
    },
    [dragState, pixelToBeat, snapToBeat, addNote, setSelection]
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

  // Generate pitch rows (top = high pitch, bottom = low pitch)
  const pitchRows = useMemo(() => {
    const rows = []
    for (let pitch = highNote; pitch >= lowNote; pitch--) {
      rows.push(pitch)
    }
    return rows
  }, [lowNote, highNote])

  // Generate beat columns
  const beatColumns = useMemo(() => {
    const cols = []
    for (let beat = 0; beat < visibleBeats; beat += snapToBeat) {
      cols.push(beat)
    }
    return cols
  }, [visibleBeats, snapToBeat])

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        height,
        overflow: 'hidden',
        backgroundColor: semantic.background.surface,
        borderRadius: 1,
        border: `1px solid ${semantic.border.default}`,
        userSelect: 'none',
      }}
    >
      {/* Piano keyboard */}
      <Box
        sx={{
          width: KEY_WIDTH,
          flexShrink: 0,
          borderRight: `1px solid ${semantic.border.default}`,
          overflow: 'hidden',
        }}
        onMouseUp={handleKeyMouseUp}
        onMouseLeave={handleKeyMouseUp}
      >
        {pitchRows.map((pitch) => {
          const isBlack = isBlackKey(pitch)
          const isC = pitch % 12 === 0
          return (
            <Box
              key={pitch}
              onMouseDown={() => handleKeyMouseDown(pitch)}
              sx={{
                height: NOTE_HEIGHT,
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
        onMouseLeave={handleGridMouseUp}
      >
        {/* Grid lines */}
        <svg
          width="100%"
          height={gridHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {/* Horizontal lines (pitch rows) */}
          {pitchRows.map((pitch) => {
            const y = pitchToY(pitch) + NOTE_HEIGHT
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
          {/* Vertical lines (beat grid) */}
          {beatColumns.map((beat) => {
            const x = beat * beatWidth
            const isBeat = beat === Math.floor(beat)
            return (
              <line
                key={`v-${beat}`}
                x1={x}
                y1={0}
                x2={x}
                y2={gridHeight}
                stroke={isBeat ? semantic.border.default : semantic.border.subtle}
                strokeWidth={isBeat ? 1 : 0.5}
              />
            )
          })}
        </svg>

        {/* Notes */}
        {clip.notes.map((note) => {
          const x = note.startBeat * beatWidth
          const y = pitchToY(note.pitch)
          const width = note.duration * beatWidth
          const isSelected = selection.has(note.id)

          return (
            <Box
              key={note.id}
              sx={{
                position: 'absolute',
                left: x,
                top: y,
                width: width - 1,
                height: NOTE_HEIGHT - 1,
                backgroundColor: isSelected
                  ? semantic.accent.primary
                  : semantic.accent.primaryMuted,
                borderRadius: 0.5,
                border: `1px solid ${isSelected ? semantic.accent.primary : semantic.border.default}`,
                cursor: dragState.type === 'none' ? 'grab' : 'grabbing',
                opacity: note.velocity,
                transition: 'background-color 0.1s, border-color 0.1s',
                '&:hover': {
                  borderColor: semantic.accent.primary,
                },
              }}
            />
          )
        })}

        {/* Playhead */}
        {playheadBeat >= 0 && playheadBeat <= visibleBeats && (
          <Box
            sx={{
              position: 'absolute',
              left: playheadBeat * beatWidth,
              top: 0,
              width: 2,
              height: gridHeight,
              backgroundColor: semantic.semantic.error,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}
      </Box>
    </Box>
  )
}
