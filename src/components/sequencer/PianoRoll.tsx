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
 * const playheadBeatRef = useRef(0)
 * // Update ref directly for smooth animation (no React re-renders)
 * transport.onPlayheadData((data) => { playheadBeatRef.current = data.beat })
 *
 * <PianoRoll
 *   clip={clip}
 *   onClipChange={setClip}
 *   playheadBeatRef={playheadBeatRef}
 *   isPlaying={isPlaying}
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
import { usePianoRollScales } from './hooks/usePianoRollScales'
import type { MidiClip } from '@eddyc/chronicle-client'
import {
  DEFAULT_VISIBLE_BEATS,
  DEFAULT_SNAP_TO_BEAT,
  KEY_WIDTH,
  DEFAULT_LOW_NOTE,
  DEFAULT_HIGH_NOTE,
} from './utils/pianoRollHelpers'
import type { NoteLabel } from './d3'

// ============ Types ============

export interface PianoRollProps {
  /** The clip being edited */
  clip: MidiClip
  /** Callback when clip changes */
  onClipChange: (clip: MidiClip) => void
  /** Ref containing current playhead position (updated externally without re-renders) */
  playheadBeatRef: React.MutableRefObject<number>
  /** Whether sequencer is currently playing (controls RAF animation) */
  isPlaying?: boolean
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
  /** Note map for labeled note display (e.g., drum pads) */
  noteMap?: NoteLabel[]
}

// ============ Constants ============

const RULER_HEIGHT = 32

// ============ Component ============

export function PianoRoll({
  clip,
  onClipChange,
  playheadBeatRef,
  isPlaying = false,
  visibleBeats = DEFAULT_VISIBLE_BEATS,
  snapToBeat = DEFAULT_SNAP_TO_BEAT,
  lowNote = DEFAULT_LOW_NOTE,
  highNote = DEFAULT_HIGH_NOTE,
  onNotePreview,
  onNotePreviewEnd,
  selectedNoteIds,
  onSelectionChange,
  height = 300,
  noteMap,
}: PianoRollProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Viewport state for pan/zoom
  const { viewport, panZoomTime, panZoomPitch, panTime, panPitch, fitToContent } =
    usePianoRollViewport({
      clipLength: clip.length,
      initialBeats: visibleBeats,
      initialLowNote: lowNote,
      initialHighNote: highNote,
    })

  // Auto-fit viewport to content on initial mount
  const hasAutoFit = useRef(false)
  useEffect(() => {
    if (!hasAutoFit.current && clip.notes.length > 0) {
      hasAutoFit.current = true
      fitToContent({
        loopStart: clip.loopStart ?? 0,
        loopEnd: clip.loopEnd ?? clip.length,
        notes: clip.notes,
      })
    }
  }, [clip, fitToContent])

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
  const gridHeight = gridContainerHeight

  // Create D3 scales for coordinate conversion - single source of truth
  const scales = usePianoRollScales({
    viewport,
    gridWidth,
    gridHeight,
    snapToBeat,
  })

  // Track pending loop changes for batching start+end updates
  const pendingLoopRef = useRef<{ start?: number; end?: number }>({})
  const flushTimeoutRef = useRef<number | null>(null)

  const flushLoopChanges = useCallback(() => {
    const pending = pendingLoopRef.current
    if (pending.start !== undefined || pending.end !== undefined) {
      onClipChange({
        ...clip,
        ...(pending.start !== undefined && { loopStart: pending.start }),
        ...(pending.end !== undefined && { loopEnd: pending.end }),
      })
      pendingLoopRef.current = {}
    }
    flushTimeoutRef.current = null
  }, [clip, onClipChange])

  // Handle loop start change
  const handleLoopStartChange = useCallback(
    (beat: number) => {
      pendingLoopRef.current.start = beat
      // Flush immediately if no pending timeout, or let existing timeout batch
      if (flushTimeoutRef.current === null) {
        flushTimeoutRef.current = requestAnimationFrame(flushLoopChanges)
      }
    },
    [flushLoopChanges]
  )

  // Handle loop end change
  const handleLoopEndChange = useCallback(
    (beat: number) => {
      pendingLoopRef.current.end = beat
      // Flush immediately if no pending timeout, or let existing timeout batch
      if (flushTimeoutRef.current === null) {
        flushTimeoutRef.current = requestAnimationFrame(flushLoopChanges)
      }
    },
    [flushLoopChanges]
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
        {/* Timeline ruler (no zoom, just tick marks) - wrapped with loop lines overlay */}
        <Box sx={{ position: 'relative', width: gridWidth }}>
          <TimelineRuler
            startBeat={viewport.startBeat}
            endBeat={viewport.endBeat}
            width={gridWidth}
            loopStart={clip.loopStart ?? 0}
            loopEnd={clip.loopEnd ?? clip.length}
            onLoopStartChange={handleLoopStartChange}
            onLoopEndChange={handleLoopEndChange}
            clipLength={clip.length}
            xToBeat={scales.xToBeat}
          />
          {/* Loop boundary lines - extend from ruler through entire grid */}
          {(() => {
            const loopStart = clip.loopStart ?? 0
            const loopEnd = clip.loopEnd ?? clip.length
            const visibleBeats = viewport.endBeat - viewport.startBeat
            const startX = ((loopStart - viewport.startBeat) / visibleBeats) * gridWidth
            const endX = ((loopEnd - viewport.startBeat) / visibleBeats) * gridWidth
            const totalHeight = RULER_HEIGHT + gridHeight
            return (
              <>
                {startX >= 0 && startX <= gridWidth && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: startX,
                      top: 0,
                      width: '1px',
                      height: totalHeight,
                      backgroundColor: semantic.accent.primary,
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  />
                )}
                {endX >= 0 && endX <= gridWidth && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: endX,
                      top: 0,
                      width: '1px',
                      height: totalHeight,
                      backgroundColor: semantic.accent.primary,
                      pointerEvents: 'none',
                      zIndex: 30,
                    }}
                  />
                )}
              </>
            )
          })()}
        </Box>
      </Box>

      {/* Row 3: Main content (pitch zoom + keys + grid) */}
      <Box ref={gridRef} sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Pitch zoom strip */}
        <PitchZoomStrip
          viewport={viewport}
          gridHeight={gridHeight}
          noteHeight={scales.noteHeight}
          pitchToY={scales.pitchToY}
          hoveredPitch={hoveredPitch}
          onPanZoomPitch={panZoomPitch}
        />

        {/* Piano keyboard */}
        <PianoKeyboard
          viewport={viewport}
          gridHeight={gridHeight}
          noteHeight={scales.noteHeight}
          pitchToY={scales.pitchToY}
          hoveredPitch={hoveredPitch}
          onHoverPitch={setHoveredPitch}
          onNotePreview={onNotePreview}
          onNotePreviewEnd={onNotePreviewEnd}
          noteMap={noteMap}
        />

        {/* Note grid */}
        <PianoRollGrid
          clip={clip}
          onClipChange={onClipChange}
          viewport={viewport}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          noteHeight={scales.noteHeight}
          snapToBeat={snapToBeat}
          selection={selection}
          onSelectionChange={setSelection}
          playheadBeatRef={playheadBeatRef}
          isPlaying={isPlaying}
          panZoomTime={panZoomTime}
          panZoomPitch={panZoomPitch}
          panTime={panTime}
          panPitch={panPitch}
          loopStart={clip.loopStart ?? 0}
          loopEnd={clip.loopEnd ?? clip.length}
        />
      </Box>
    </Box>
  )
}
