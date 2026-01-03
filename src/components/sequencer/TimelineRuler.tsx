/**
 * TimelineRuler - Beat/bar markers display
 *
 * Displays beat and bar markers with adaptive density based on zoom level.
 * No zoom interaction - that's handled by TimeZoomStrip.
 * Supports loop region display with draggable start/end handles.
 */

import { Box } from '@mui/material'
import { useRef, useCallback, useState } from 'react'
import { useChronicleTheme } from '../../hooks'

const RULER_HEIGHT = 32
const LOOP_HANDLE_WIDTH = 6

export interface TimelineRulerProps {
  /** First visible beat */
  startBeat: number
  /** Last visible beat */
  endBeat: number
  /** Width of the ruler in pixels */
  width: number
  /** Height of the ruler (default: 24) */
  height?: number
  /** Beats per bar (default: 4) */
  beatsPerBar?: number
  /** Loop start position in beats */
  loopStart?: number
  /** Loop end position in beats */
  loopEnd?: number
  /** Callback when loop start changes */
  onLoopStartChange?: (beat: number) => void
  /** Callback when loop end changes */
  onLoopEndChange?: (beat: number) => void
  /** Clip length for visual reference (optional, shows muted area beyond loop) */
  clipLength?: number
  /** @deprecated Use loopEnd and onLoopEndChange instead */
  onClipLengthChange?: (newLength: number) => void
  /** Convert pixel X to beat (from D3 scales, for consistent coordinate math) */
  xToBeat?: (x: number) => number
}

type DragHandle = 'start' | 'end' | 'bar' | null

export function TimelineRuler({
  startBeat,
  endBeat,
  width,
  height = RULER_HEIGHT,
  beatsPerBar = 4,
  loopStart = 0,
  loopEnd,
  onLoopStartChange,
  onLoopEndChange,
  clipLength,
  onClipLengthChange,
  xToBeat: xToBeatProp,
}: TimelineRulerProps) {
  const { semantic } = useChronicleTheme()
  const rulerRef = useRef<HTMLDivElement>(null)

  // Effective loop end (use loopEnd if provided, otherwise clipLength for backwards compat)
  const effectiveLoopEnd = loopEnd ?? clipLength ?? 4

  // Loop handle drag state (used for cursor feedback)
  const [, setDraggingHandle] = useState<DragHandle>(null)

  // Convert pixel X to beat position - use passed function or fallback to local calculation
  const pixelToBeat = useCallback(
    (x: number): number => {
      if (xToBeatProp) {
        return xToBeatProp(x)
      }
      // Fallback for backwards compatibility
      const visibleBeats = endBeat - startBeat
      const beat = startBeat + (x / width) * visibleBeats
      // Snap to 1/16th note grid
      return Math.round(beat * 4) / 4
    },
    [xToBeatProp, startBeat, endBeat, width]
  )

  // Handle loop start drag
  const handleLoopStartMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!rulerRef.current || !onLoopStartChange) return

      setDraggingHandle('start')

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!rulerRef.current) return
        const rect = rulerRef.current.getBoundingClientRect()
        const x = moveEvent.clientX - rect.left
        const beat = pixelToBeat(x)
        // Clamp: minimum 0, maximum loopEnd - 0.25
        const clampedBeat = Math.max(0, Math.min(effectiveLoopEnd - 0.25, beat))
        onLoopStartChange(clampedBeat)
      }

      const cleanup = () => {
        setDraggingHandle(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [pixelToBeat, effectiveLoopEnd, onLoopStartChange]
  )

  // Handle loop end drag
  const handleLoopEndMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!rulerRef.current) return

      setDraggingHandle('end')

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!rulerRef.current) return
        const rect = rulerRef.current.getBoundingClientRect()
        const x = moveEvent.clientX - rect.left
        const beat = pixelToBeat(x)
        // Clamp: minimum loopStart + 0.25, no maximum
        const clampedBeat = Math.max(loopStart + 0.25, beat)

        // Call the appropriate callback
        if (onLoopEndChange) {
          onLoopEndChange(clampedBeat)
        } else if (onClipLengthChange) {
          // Backwards compatibility
          onClipLengthChange(clampedBeat)
        }
      }

      const cleanup = () => {
        setDraggingHandle(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [pixelToBeat, loopStart, onLoopEndChange, onClipLengthChange]
  )

  // Handle loop bar drag (move entire region)
  const handleLoopBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!rulerRef.current || !onLoopStartChange || !onLoopEndChange) return

      setDraggingHandle('bar')

      // Capture initial state
      const startMouseX = e.clientX
      const initialLoopStart = loopStart
      const initialLoopEnd = effectiveLoopEnd
      const loopLength = initialLoopEnd - initialLoopStart

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!rulerRef.current) return
        const deltaX = moveEvent.clientX - startMouseX
        const visibleBeats = endBeat - startBeat
        const deltaBeat = (deltaX / width) * visibleBeats

        // Calculate new positions
        let newStart = initialLoopStart + deltaBeat
        let newEnd = newStart + loopLength

        // Clamp to valid range (minimum 0)
        if (newStart < 0) {
          newStart = 0
          newEnd = loopLength
        }

        // Snap to grid (1/4 note)
        newStart = Math.round(newStart * 4) / 4
        newEnd = Math.round(newEnd * 4) / 4

        onLoopStartChange(newStart)
        onLoopEndChange(newEnd)
      }

      const cleanup = () => {
        setDraggingHandle(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [loopStart, effectiveLoopEnd, startBeat, endBeat, width, onLoopStartChange, onLoopEndChange]
  )

  // Calculate beat markers with adaptive density
  const visibleBeats = endBeat - startBeat
  const pixelsPerBeat = width / visibleBeats

  // Determine marker step based on zoom level
  let markerStep: number
  if (pixelsPerBeat >= 120) {
    markerStep = 0.125 // 1/32nd notes when very zoomed in
  } else if (pixelsPerBeat >= 60) {
    markerStep = 0.25 // 1/16th notes
  } else if (pixelsPerBeat >= 30) {
    markerStep = 0.5 // 1/8th notes
  } else if (pixelsPerBeat >= 15) {
    markerStep = 1 // quarter notes (beats)
  } else {
    markerStep = 4 // bars only when very zoomed out
  }

  // Generate markers with level classification
  const markers: Array<{
    beat: number
    level: 'bar' | 'beat' | 'subbeat' | 'fine'
    label?: string
  }> = []
  const firstBeat = Math.floor(startBeat / markerStep) * markerStep
  // Generate one extra marker beyond endBeat to prevent edge gaps
  for (let beat = firstBeat; beat <= endBeat + markerStep; beat += markerStep) {
    if (beat >= startBeat && beat <= endBeat + markerStep) {
      const bar = Math.floor(beat / beatsPerBar) + 1
      const beatInBar = (beat % beatsPerBar) + 1

      // Classify the beat for visual hierarchy
      const isBar = Math.abs(beat - Math.round(beat / beatsPerBar) * beatsPerBar) < 0.001
      const isBeat = Math.abs(beat - Math.round(beat)) < 0.001
      const isSubbeat = Math.abs(beat * 4 - Math.round(beat * 4)) < 0.001

      const level = isBar ? 'bar' : isBeat ? 'beat' : isSubbeat ? 'subbeat' : 'fine'

      // Minimum pixels needed for a label
      const MIN_LABEL_SPACING = 35

      let label: string | undefined
      if (isBar) {
        label = `${bar}`
      } else if (isBeat && !isBar && pixelsPerBeat >= MIN_LABEL_SPACING) {
        label = `${bar}.${Math.floor(beatInBar)}`
      } else if (isSubbeat && !isBeat && pixelsPerBeat / 4 >= MIN_LABEL_SPACING) {
        const wholeBeat = Math.floor(beat)
        const beatInBarWhole = (wholeBeat % beatsPerBar) + 1
        const sixteenthInBeat = Math.round((beat - wholeBeat) * 4) + 1
        label = `${bar}.${beatInBarWhole}.${sixteenthInBeat}`
      }

      markers.push({ beat, level, label })
    }
  }

  // Calculate loop region positions
  const loopStartX = ((loopStart - startBeat) / visibleBeats) * width
  const loopEndX = ((effectiveLoopEnd - startBeat) / visibleBeats) * width
  const loopVisible = loopEndX > 0 && loopStartX < width

  // Check if handles should be visible
  const canEditLoopStart = !!onLoopStartChange
  const canEditLoopEnd = !!(onLoopEndChange || onClipLengthChange)

  return (
    <Box
      ref={rulerRef}
      sx={{
        width,
        height,
        backgroundColor: semantic.background.elevated,
        borderBottom: `1px solid ${semantic.border.default}`,
        position: 'relative',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Beat/bar markers with level-based styling */}
      {markers.map(({ beat, level, label }) => {
        const x = ((beat - startBeat) / visibleBeats) * width
        const tickHeight =
          level === 'bar' ? 14 : level === 'beat' ? 10 : level === 'subbeat' ? 6 : 4
        const tickOpacity = level === 'fine' ? 0.4 : level === 'subbeat' ? 0.6 : 1
        return (
          <Box
            key={beat}
            sx={{
              position: 'absolute',
              left: x,
              top: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* Tick mark - positioned at bottom */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                width: 1,
                height: tickHeight,
                backgroundColor:
                  level === 'bar' ? semantic.text.primary : semantic.text.secondary,
                opacity: tickOpacity,
              }}
            />
            {/* Label - positioned below the loop bar */}
            {label && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 4,
                  fontSize: '0.65rem',
                  color: semantic.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Box>
            )}
          </Box>
        )
      })}

      {/* Loop region indicator with draggable handles */}
      {loopVisible && (
        <>
          {/* Visual bar - just for display, no events */}
          <Box
            sx={{
              position: 'absolute',
              left: Math.max(0, loopStartX),
              top: 0,
              width: Math.max(0, Math.min(width, loopEndX) - Math.max(0, loopStartX)),
              height: 8,
              backgroundColor: semantic.accent.primary,
              pointerEvents: 'none',
            }}
          />

          {/* START resize handle */}
          {canEditLoopStart && loopStartX >= 0 && loopStartX <= width && (
            <Box
              onMouseDown={handleLoopStartMouseDown}
              sx={{
                position: 'absolute',
                left: loopStartX - LOOP_HANDLE_WIDTH / 2,
                top: 0,
                width: LOOP_HANDLE_WIDTH,
                height: 8,
                cursor: 'ew-resize',
              }}
            />
          )}

          {/* END resize handle */}
          {canEditLoopEnd && loopEndX > 0 && loopEndX <= width && (
            <Box
              onMouseDown={handleLoopEndMouseDown}
              sx={{
                position: 'absolute',
                left: loopEndX - LOOP_HANDLE_WIDTH / 2,
                top: 0,
                width: LOOP_HANDLE_WIDTH,
                height: 8,
                cursor: 'ew-resize',
              }}
            />
          )}

          {/* Draggable middle area - between handles, for moving entire region */}
          {canEditLoopStart && canEditLoopEnd && (
            <Box
              onMouseDown={handleLoopBarMouseDown}
              sx={{
                position: 'absolute',
                left: loopStartX + LOOP_HANDLE_WIDTH / 2,
                top: 0,
                width: Math.max(0, loopEndX - loopStartX - LOOP_HANDLE_WIDTH),
                height: 8,
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
            />
          )}
        </>
      )}
    </Box>
  )
}
