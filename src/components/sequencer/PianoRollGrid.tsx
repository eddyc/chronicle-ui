/**
 * PianoRollGrid - Note grid area for PianoRoll
 *
 * Renders the main editing area of the piano roll:
 * - Grid lines (horizontal pitch rows, vertical beat columns)
 * - MIDI notes with selection highlighting
 * - Playhead position indicator
 * - Brush selection rectangle
 *
 * Handles all mouse interactions via usePianoRollDrag hook.
 */

import { Box } from '@mui/material'
import { useRef, useMemo, useCallback, useEffect } from 'react'
import { useChronicleTheme } from '../../hooks'
import type { ViewportState } from '../../hooks'
import type { MidiClip } from '@eddyc/chronicle-client'
import { usePianoRollDrag, type DragState } from './hooks'
import {
  isBlackKey,
  generatePitchRows,
  generateBeatColumns,
  createCoordinateHelpers,
} from './utils/pianoRollHelpers'

// ============ Types ============

export interface PianoRollGridProps {
  /** The clip being edited */
  clip: MidiClip
  /** Callback when clip changes */
  onClipChange: (clip: MidiClip) => void
  /** Current viewport state */
  viewport: ViewportState
  /** Width of the grid in pixels */
  gridWidth: number
  /** Height of the grid in pixels */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
  /** Snap grid size in beats */
  snapToBeat: number
  /** Currently selected note IDs */
  selection: Set<string>
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<string>) => void
  /** Current playhead position in beats */
  playheadBeat: number
  /** Callback for wheel events (pan/zoom) */
  onWheel?: (e: WheelEvent) => void
  /** Loop start position in beats (for dimming notes outside) */
  loopStart?: number
  /** Loop end position in beats (for dimming notes outside) */
  loopEnd?: number
}

// ============ Constants ============

const ALL_PITCH_ROWS = generatePitchRows()

// ============ Component ============

export function PianoRollGrid({
  clip,
  onClipChange,
  viewport,
  gridWidth,
  gridHeight,
  noteHeight,
  snapToBeat,
  selection,
  onSelectionChange,
  playheadBeat,
  onWheel,
  loopStart = 0,
  loopEnd,
}: PianoRollGridProps) {
  const { semantic } = useChronicleTheme()
  const gridRef = useRef<HTMLDivElement>(null)

  const beatsVisible = viewport.endBeat - viewport.startBeat

  // Create coordinate helpers
  const coordinateHelpers = useMemo(
    () =>
      createCoordinateHelpers({
        viewport,
        gridWidth,
        gridHeight,
        noteHeight,
        snapToBeat,
      }),
    [viewport, gridWidth, gridHeight, noteHeight, snapToBeat]
  )

  const { beatToX, pitchToY } = coordinateHelpers

  // Drag state machine
  const {
    dragState,
    brushRect,
    brushPreviewIds,
    handleGridMouseDown,
    handleGridMouseMove,
    handleGridMouseUp,
    handleGridDoubleClick,
  } = usePianoRollDrag({
    clip,
    onClipChange,
    selection,
    onSelectionChange,
    snapToBeat,
    noteHeight,
    gridRef,
    coordinateHelpers,
  })

  // Generate beat columns with adaptive density
  const beatColumns = useMemo(
    () => generateBeatColumns(viewport.startBeat, viewport.endBeat, gridWidth),
    [viewport.startBeat, viewport.endBeat, gridWidth]
  )

  // Attach wheel handler
  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !onWheel) return
    grid.addEventListener('wheel', onWheel, { passive: false })
    return () => grid.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // Handle mouse leave - only reset for move/resize, not brush
  const handleMouseLeave = useCallback(() => {
    if (dragState.type !== 'none' && dragState.type !== 'brush') {
      // Let the parent component handle resetting drag state if needed
    }
  }, [dragState.type])

  return (
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
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleGridDoubleClick}
    >
      {/* Grid lines */}
      <svg
        width="100%"
        height={gridHeight}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {/* Horizontal lines (pitch rows) */}
        {ALL_PITCH_ROWS.map((pitch) => {
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
        {/* Vertical lines (beat grid) */}
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
                level === 'bar'
                  ? semantic.border.default
                  : level === 'beat'
                    ? semantic.border.default
                    : semantic.border.subtle
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
          const noteEnd = note.startBeat + note.duration
          const inTimeRange =
            noteEnd >= viewport.startBeat && note.startBeat <= viewport.endBeat
          const inPitchRange =
            note.pitch > viewport.lowNote - 1 &&
            note.pitch < viewport.highNote + 1
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

          // Check if note is outside loop region
          const effectiveLoopEnd = loopEnd ?? clip.length
          const noteEnd = note.startBeat + note.duration
          const isOutsideLoop =
            note.startBeat >= effectiveLoopEnd || noteEnd <= loopStart

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
                  : semantic.accent.primaryPressed,
                borderRadius: 0.5,
                border: shouldHighlight
                  ? `1px solid ${semantic.accent.primaryHover}`
                  : `1px solid ${semantic.accent.primaryPressed}`,
                cursor: dragState.type === 'none' ? 'grab' : 'grabbing',
                opacity: isOutsideLoop ? 0.4 : 1,
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

      {/* Brush selection rectangle */}
      {brushRect &&
        (() => {
          const rawLeft = Math.min(brushRect.x1, brushRect.x2)
          const rawTop = Math.min(brushRect.y1, brushRect.y2)
          const rawRight = Math.max(brushRect.x1, brushRect.x2)
          const rawBottom = Math.max(brushRect.y1, brushRect.y2)

          const clampedLeft = Math.max(0, rawLeft)
          const clampedTop = Math.max(0, rawTop)
          const clampedRight = Math.min(gridWidth, rawRight)
          const clampedBottom = Math.min(gridHeight, rawBottom)

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
  )
}
