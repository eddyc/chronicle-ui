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
 * - Zoom strips for time/pitch navigation
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
import { useRef, useState, useCallback, useEffect } from 'react'
import { useChronicleTheme, usePianoRollViewport } from '../../hooks'
import { TimelineRuler } from './TimelineRuler'
import { TimeZoomStrip, TIME_ZOOM_STRIP_HEIGHT } from './TimeZoomStrip'
import { PitchZoomStrip, PITCH_ZOOM_STRIP_WIDTH } from './PitchZoomStrip'
import { PianoKeyboard } from './PianoKeyboard'
import { PianoRollGrid } from './PianoRollGrid'
import type { MidiClip } from '@eddyc/chronicle-client'
import {
  DEFAULT_VISIBLE_BEATS,
  DEFAULT_SNAP_TO_BEAT,
  KEY_WIDTH,
  DEFAULT_LOW_NOTE,
  DEFAULT_HIGH_NOTE,
} from './utils/pianoRollHelpers'

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

// ============ Constants ============

const RULER_HEIGHT = 24

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

  // Hovered pitch (from keyboard hover, shown in PitchZoomStrip)
  const [hoveredPitch, setHoveredPitch] = useState<number | null>(null)

  // Grid dimensions from container
  const [gridWidth, setGridWidth] = useState(400)
  const [gridContainerHeight, setGridContainerHeight] = useState(300)

  // Calculate left column width (zoom strip + keys)
  const leftColumnWidth = PITCH_ZOOM_STRIP_WIDTH + KEY_WIDTH

  // Measure grid width and height on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setGridWidth(containerRef.current.clientWidth - leftColumnWidth)
      }
      if (gridRef.current) {
        setGridContainerHeight(gridRef.current.clientHeight)
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [leftColumnWidth])

  // Calculate dimensions using viewport
  const noteRange = viewport.highNote - viewport.lowNote + 1
  const gridHeight = gridContainerHeight
  const noteHeight = gridHeight / noteRange

  // Handle clip length change
  const handleClipLengthChange = useCallback(
    (newLength: number) => {
      onClipChange({
        ...clip,
        length: newLength,
      })
    },
    [clip, onClipChange]
  )

  // Delete selected notes
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

  // Create wheel handler for grid panning
  const wheelHandler = useCallback(
    (e: WheelEvent) => {
      const handler = createWheelHandler(gridWidth, gridHeight)
      handler(e)
    },
    [createWheelHandler, gridWidth, gridHeight]
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
      {/* Row 1: Time zoom strip */}
      <Box sx={{ display: 'flex' }}>
        {/* Corner (above pitch zoom strip and keys) */}
        <Box
          sx={{
            width: leftColumnWidth,
            height: TIME_ZOOM_STRIP_HEIGHT,
            flexShrink: 0,
            backgroundColor: semantic.background.elevated,
            borderRight: `1px solid ${semantic.border.default}`,
            borderBottom: `1px solid ${semantic.border.default}`,
          }}
        />
        {/* Time zoom strip */}
        <TimeZoomStrip
          startBeat={viewport.startBeat}
          endBeat={viewport.endBeat}
          width={gridWidth}
          onPanZoom={panZoomTime}
        />
      </Box>

      {/* Row 2: Timeline ruler */}
      <Box sx={{ display: 'flex' }}>
        {/* Empty corner above pitch zoom strip and keys */}
        <Box
          sx={{
            width: leftColumnWidth,
            height: RULER_HEIGHT,
            flexShrink: 0,
            backgroundColor: semantic.background.elevated,
            borderRight: `1px solid ${semantic.border.default}`,
            borderBottom: `1px solid ${semantic.border.default}`,
          }}
        />
        {/* Timeline ruler (no zoom, just tick marks) */}
        <TimelineRuler
          startBeat={viewport.startBeat}
          endBeat={viewport.endBeat}
          width={gridWidth}
          clipLength={clip.length}
          onClipLengthChange={handleClipLengthChange}
        />
      </Box>

      {/* Row 3: Main content (pitch zoom + keys + grid) */}
      <Box ref={gridRef} sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Pitch zoom strip */}
        <PitchZoomStrip
          viewport={viewport}
          gridHeight={gridHeight}
          noteHeight={noteHeight}
          hoveredPitch={hoveredPitch}
          onPanZoomPitch={panZoomPitch}
        />

        {/* Piano keyboard */}
        <PianoKeyboard
          viewport={viewport}
          gridHeight={gridHeight}
          noteHeight={noteHeight}
          hoveredPitch={hoveredPitch}
          onHoverPitch={setHoveredPitch}
          onNotePreview={onNotePreview}
          onNotePreviewEnd={onNotePreviewEnd}
        />

        {/* Note grid */}
        <PianoRollGrid
          clip={clip}
          onClipChange={onClipChange}
          viewport={viewport}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          noteHeight={noteHeight}
          snapToBeat={snapToBeat}
          selection={selection}
          onSelectionChange={setSelection}
          playheadBeat={playheadBeat}
          onWheel={wheelHandler}
        />
      </Box>
    </Box>
  )
}
