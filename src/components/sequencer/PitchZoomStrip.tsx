/**
 * PitchZoomStrip - Vertical zoom control strip for pitch axis
 *
 * A dedicated strip to the left of the piano keys for:
 * - Drag up/down to pan pitch
 * - Drag left/right to zoom pitch
 * - Displays octave markers (C3, C4, etc.)
 * - Shows hovered note name when hovering over piano keys
 */

import { Box } from '@mui/material'
import { useRef, useCallback } from 'react'
import { useChronicleTheme } from '../../hooks'
import type { ViewportState } from '../../hooks'
import { midiToNoteName } from './utils/pianoRollHelpers'

// ============ Types ============

export interface PitchZoomStripProps {
  /** Current viewport state */
  viewport: ViewportState
  /** Height of the grid in pixels */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
  /** Currently hovered pitch from piano keyboard */
  hoveredPitch: number | null
  /** Callback for pan/zoom with cursor anchoring */
  onPanZoomPitch: (
    anchorPitch: number,
    anchorRatio: number,
    zoomFactor: number
  ) => void
}

// ============ Constants ============

export const PITCH_ZOOM_STRIP_WIDTH = 30

// ============ Component ============

export function PitchZoomStrip({
  viewport,
  gridHeight,
  noteHeight,
  hoveredPitch,
  onPanZoomPitch,
}: PitchZoomStripProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const dragAnchorRef = useRef<{ anchorPitch: number } | null>(null)
  const lastXRef = useRef<number>(0)

  const noteRange = viewport.highNote - viewport.lowNote + 1

  // Convert pitch to Y position
  const pitchToY = useCallback(
    (pitch: number): number => {
      return (viewport.highNote - pitch) * noteHeight
    },
    [viewport.highNote, noteHeight]
  )

  // Generate octave markers (C notes)
  const octaveMarkers: Array<{ pitch: number; label: string; y: number }> = []
  for (let pitch = 0; pitch <= 127; pitch += 12) {
    const y = pitchToY(pitch)
    // Only include if visible
    if (y >= -noteHeight && y <= gridHeight + noteHeight) {
      octaveMarkers.push({
        pitch,
        label: midiToNoteName(pitch),
        y,
      })
    }
  }

  // Pan/zoom via drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const ratio = y / gridHeight

      // Calculate the pitch under the cursor at drag start
      const anchorPitch = viewport.highNote - ratio * noteRange

      dragAnchorRef.current = { anchorPitch }
      lastXRef.current = e.clientX

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragAnchorRef.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const currentY = moveEvent.clientY - rect.top
        const currentRatio = Math.max(0, Math.min(1, currentY / gridHeight))

        // Calculate zoom from horizontal drag (deltaX since last frame)
        const deltaX = moveEvent.clientX - lastXRef.current
        lastXRef.current = moveEvent.clientX

        // Drag right = zoom in (smaller range), drag left = zoom out
        const zoomDelta = 1 - deltaX * 0.01

        onPanZoomPitch(dragAnchorRef.current.anchorPitch, currentRatio, zoomDelta)
      }

      const cleanup = () => {
        dragAnchorRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [viewport.highNote, noteRange, gridHeight, onPanZoomPitch]
  )

  return (
    <Box
      ref={containerRef}
      sx={{
        width: PITCH_ZOOM_STRIP_WIDTH,
        height: gridHeight,
        flexShrink: 0,
        backgroundColor: semantic.background.elevated,
        borderRight: `1px solid ${semantic.border.default}`,
        position: 'relative',
        cursor: 'zoom-in',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Octave markers - centered with the C key (same position as hover indicator) */}
      {octaveMarkers.map(({ pitch, label, y }) => (
        <Box
          key={pitch}
          sx={{
            position: 'absolute',
            top: y,
            left: 0,
            right: 0,
            height: noteHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              fontSize: '0.65rem',
              color: semantic.text.secondary,
            }}
          >
            {label}
          </Box>
        </Box>
      ))}

      {/* Hovered note indicator - shows note name, replaces octave label if on a C */}
      {hoveredPitch !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: pitchToY(hoveredPitch),
            left: 0,
            right: 0,
            height: noteHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: semantic.accent.primary,
            }}
          >
            {midiToNoteName(hoveredPitch)}
          </Box>
        </Box>
      )}
    </Box>
  )
}
