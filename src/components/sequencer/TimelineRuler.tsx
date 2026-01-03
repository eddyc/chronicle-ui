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

const RULER_HEIGHT = 24
const LOOP_HANDLE_WIDTH = 8

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

type DragHandle = 'start' | 'end' | null

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

  // Loop handle drag state
  const [draggingHandle, setDraggingHandle] = useState<DragHandle>(null)

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
          level === 'bar' ? 12 : level === 'beat' ? 8 : level === 'subbeat' ? 5 : 3
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
            {/* Tick mark */}
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
            {/* Label */}
            {label && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
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

      {/* Loop region indicator with draggable handles (Ableton-style) */}
      {loopVisible && (
        <>
          {/* Loop region bar - thick colored band */}
          <Box
            sx={{
              position: 'absolute',
              left: Math.max(0, loopStartX),
              top: 0,
              width: Math.min(width - Math.max(0, loopStartX), loopEndX - Math.max(0, loopStartX)),
              height: 10,
              backgroundColor: semantic.accent.primary,
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          />

          {/* Draggable loop START handle - triangle pointing right ▷ */}
          {canEditLoopStart && loopStartX >= -LOOP_HANDLE_WIDTH && loopStartX <= width && (
            <Box
              onMouseDown={handleLoopStartMouseDown}
              sx={{
                position: 'absolute',
                left: loopStartX - LOOP_HANDLE_WIDTH,
                top: 0,
                width: LOOP_HANDLE_WIDTH * 2,
                height: '100%',
                cursor: 'ew-resize',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                zIndex: 10,
                '&:hover': {
                  '& .loop-handle-triangle': {
                    borderLeftColor: semantic.accent.primary,
                  },
                  '& .loop-handle-flag': {
                    backgroundColor: semantic.accent.primary,
                  },
                },
              }}
            >
              {/* Triangle pointing right */}
              <Box
                className="loop-handle-triangle"
                sx={{
                  width: 0,
                  height: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: `8px solid ${draggingHandle === 'start' ? semantic.accent.primary : semantic.accent.primaryMuted}`,
                  transition: 'border-color 0.1s',
                  mr: '8px',
                }}
              />
              {/* Vertical flag/bracket line */}
              <Box
                className="loop-handle-flag"
                sx={{
                  width: 2,
                  flex: 1,
                  backgroundColor: draggingHandle === 'start' ? semantic.accent.primary : semantic.accent.primaryMuted,
                  transition: 'background-color 0.1s',
                  mr: '8px',
                }}
              />
            </Box>
          )}

          {/* Draggable loop END handle - triangle pointing left ◁ */}
          {canEditLoopEnd && loopEndX > 0 && loopEndX <= width + LOOP_HANDLE_WIDTH && (
            <Box
              onMouseDown={handleLoopEndMouseDown}
              sx={{
                position: 'absolute',
                left: loopEndX - LOOP_HANDLE_WIDTH,
                top: 0,
                width: LOOP_HANDLE_WIDTH * 2,
                height: '100%',
                cursor: 'ew-resize',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                zIndex: 10,
                '&:hover': {
                  '& .loop-handle-triangle': {
                    borderRightColor: semantic.accent.primary,
                  },
                  '& .loop-handle-flag': {
                    backgroundColor: semantic.accent.primary,
                  },
                },
              }}
            >
              {/* Triangle pointing left */}
              <Box
                className="loop-handle-triangle"
                sx={{
                  width: 0,
                  height: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderRight: `8px solid ${draggingHandle === 'end' ? semantic.accent.primary : semantic.accent.primaryMuted}`,
                  transition: 'border-color 0.1s',
                  ml: '8px',
                }}
              />
              {/* Vertical flag/bracket line */}
              <Box
                className="loop-handle-flag"
                sx={{
                  width: 2,
                  flex: 1,
                  backgroundColor: draggingHandle === 'end' ? semantic.accent.primary : semantic.accent.primaryMuted,
                  transition: 'background-color 0.1s',
                  ml: '8px',
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}
