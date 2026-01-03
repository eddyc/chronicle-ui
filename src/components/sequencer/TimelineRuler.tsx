/**
 * TimelineRuler - Beat/bar markers with drag for scroll/zoom
 *
 * Drag left/right = scroll time (pan)
 * Drag up/down = zoom time
 *
 * Uses geometric anchoring: the beat under the cursor at drag start
 * stays under the cursor throughout the drag operation.
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
  /**
   * Combined pan+zoom callback with cursor anchoring.
   * @param anchorBeat - The beat that should stay under the cursor
   * @param anchorRatio - Current cursor position as ratio (0-1) of viewport width
   * @param zoomFactor - Zoom factor (>1 = zoom out, <1 = zoom in)
   */
  onPanZoom: (anchorBeat: number, anchorRatio: number, zoomFactor: number) => void
  /** Beats per bar (default: 4) */
  beatsPerBar?: number
  /** Clip length for loop region display */
  clipLength?: number
  /** Callback when clip length changes */
  onClipLengthChange?: (newLength: number) => void
}

export function TimelineRuler({
  startBeat,
  endBeat,
  width,
  height = RULER_HEIGHT,
  onPanZoom,
  beatsPerBar = 4,
  clipLength,
  onClipLengthChange,
}: TimelineRulerProps) {
  const { semantic } = useChronicleTheme()
  const rulerRef = useRef<HTMLDivElement>(null)

  // Store the anchor beat (captured on mousedown) and cumulative zoom
  const dragAnchorRef = useRef<{ anchorBeat: number; cumulativeZoom: number } | null>(null)
  const lastYRef = useRef<number>(0)

  // Loop handle drag state
  const [isLoopHandleDragging, setIsLoopHandleDragging] = useState(false)
  const loopHandleDragRef = useRef<{ startLength: number } | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!rulerRef.current) return

      const rect = rulerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = x / width

      // Calculate the beat under the cursor at drag start
      const visibleBeats = endBeat - startBeat
      const anchorBeat = startBeat + ratio * visibleBeats

      dragAnchorRef.current = { anchorBeat, cumulativeZoom: 1 }
      lastYRef.current = e.clientY

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragAnchorRef.current || !rulerRef.current) return

        const rect = rulerRef.current.getBoundingClientRect()
        const currentX = moveEvent.clientX - rect.left
        const currentRatio = Math.max(0, Math.min(1, currentX / width))

        // Calculate zoom from vertical drag (deltaY since last frame)
        const deltaY = moveEvent.clientY - lastYRef.current
        lastYRef.current = moveEvent.clientY

        // Apply zoom factor incrementally
        // Drag down (positive deltaY) = zoom IN (smaller range), drag up = zoom OUT
        const zoomDelta = 1 - deltaY * 0.01
        dragAnchorRef.current.cumulativeZoom *= zoomDelta

        // Call panZoom with anchor beat, current cursor ratio, and cumulative zoom
        onPanZoom(dragAnchorRef.current.anchorBeat, currentRatio, zoomDelta)
      }

      const cleanup = () => {
        dragAnchorRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
        document.removeEventListener('mouseleave', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
      document.addEventListener('mouseleave', cleanup)
    },
    [startBeat, endBeat, width, onPanZoom]
  )

  // Handle loop end drag
  const handleLoopHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation() // Don't trigger ruler pan/zoom
      if (!rulerRef.current || clipLength === undefined) return

      loopHandleDragRef.current = { startLength: clipLength }
      setIsLoopHandleDragging(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!loopHandleDragRef.current || !rulerRef.current) return

        const rect = rulerRef.current.getBoundingClientRect()
        const x = moveEvent.clientX - rect.left
        const visibleBeats = endBeat - startBeat

        // Convert pixel position to beat position
        const beat = startBeat + (x / width) * visibleBeats

        // Snap to beat grid and ensure minimum length
        const snappedBeat = Math.round(beat * 4) / 4 // Snap to 1/16th note
        const newLength = Math.max(1, snappedBeat) // Minimum 1 beat

        onClipLengthChange?.(newLength)
      }

      const cleanup = () => {
        loopHandleDragRef.current = null
        setIsLoopHandleDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [startBeat, endBeat, width, clipLength, onClipLengthChange]
  )

  // Calculate beat markers with adaptive density (matching grid thresholds)
  const visibleBeats = endBeat - startBeat
  const pixelsPerBeat = width / visibleBeats

  // Determine marker step based on zoom level (same thresholds as grid)
  let markerStep: number
  if (pixelsPerBeat >= 120) {
    markerStep = 0.125  // 1/32nd notes when very zoomed in
  } else if (pixelsPerBeat >= 60) {
    markerStep = 0.25   // 1/16th notes
  } else if (pixelsPerBeat >= 30) {
    markerStep = 0.5    // 1/8th notes
  } else if (pixelsPerBeat >= 15) {
    markerStep = 1      // quarter notes (beats)
  } else {
    markerStep = 4      // bars only when very zoomed out
  }

  // Generate markers with level classification
  const markers: Array<{ beat: number; level: 'bar' | 'beat' | 'subbeat' | 'fine'; label?: string }> = []
  const firstBeat = Math.floor(startBeat / markerStep) * markerStep
  for (let beat = firstBeat; beat <= endBeat; beat += markerStep) {
    if (beat >= startBeat) {
      const bar = Math.floor(beat / beatsPerBar) + 1
      const beatInBar = (beat % beatsPerBar) + 1

      // Classify the beat for visual hierarchy
      const isBar = Math.abs(beat - Math.round(beat / beatsPerBar) * beatsPerBar) < 0.001
      const isBeat = Math.abs(beat - Math.round(beat)) < 0.001
      const isSubbeat = Math.abs(beat * 4 - Math.round(beat * 4)) < 0.001

      const level = isBar ? 'bar' : isBeat ? 'beat' : isSubbeat ? 'subbeat' : 'fine'

      // Labels: bars always, beats when zoomed enough
      let label: string | undefined
      if (isBar) {
        label = `${bar}`
      } else if (isBeat && pixelsPerBeat > 40) {
        label = `${bar}.${beatInBar}`
      }

      markers.push({ beat, level, label })
    }
  }

  return (
    <Box
      ref={rulerRef}
      sx={{
        width,
        height,
        backgroundColor: semantic.background.elevated,
        borderBottom: `1px solid ${semantic.border.default}`,
        position: 'relative',
        cursor: 'ew-resize',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Beat/bar markers with level-based styling */}
      {markers.map(({ beat, level, label }) => {
        const x = ((beat - startBeat) / visibleBeats) * width
        const tickHeight = level === 'bar' ? 12 : level === 'beat' ? 8 : level === 'subbeat' ? 5 : 3
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
                backgroundColor: level === 'bar' ? semantic.text.primary : semantic.text.secondary,
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

      {/* Loop region indicator with draggable handle */}
      {clipLength !== undefined && clipLength > 0 && (() => {
        const loopEndX = ((clipLength - startBeat) / visibleBeats) * width
        const isVisible = loopEndX > 0 && clipLength > startBeat

        if (!isVisible) return null

        return (
          <>
            {/* Loop region bar */}
            <Box
              sx={{
                position: 'absolute',
                left: Math.max(0, -startBeat / visibleBeats * width),
                top: 0,
                width: Math.min(width, loopEndX),
                height: 3,
                backgroundColor: semantic.accent.primary,
                opacity: 0.6,
                pointerEvents: 'none',
              }}
            />
            {/* Draggable loop end handle */}
            {onClipLengthChange && loopEndX > 0 && loopEndX <= width && (
              <Box
                onMouseDown={handleLoopHandleMouseDown}
                sx={{
                  position: 'absolute',
                  left: loopEndX - LOOP_HANDLE_WIDTH / 2,
                  top: 0,
                  width: LOOP_HANDLE_WIDTH,
                  height: '100%',
                  cursor: 'ew-resize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  '&:hover': {
                    '& > div': {
                      backgroundColor: semantic.accent.primary,
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Handle visual */}
                <Box
                  sx={{
                    width: 3,
                    height: '70%',
                    backgroundColor: isLoopHandleDragging
                      ? semantic.accent.primary
                      : semantic.accent.primaryMuted,
                    borderRadius: 1,
                    opacity: isLoopHandleDragging ? 1 : 0.8,
                    transition: 'background-color 0.1s, opacity 0.1s',
                  }}
                />
              </Box>
            )}
          </>
        )
      })()}
    </Box>
  )
}
