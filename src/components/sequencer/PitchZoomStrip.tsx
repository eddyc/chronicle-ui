/**
 * PitchZoomStrip - Vertical zoom control strip for pitch axis
 *
 * A dedicated strip to the left of the piano keys for:
 * - Drag up/down to pan pitch
 * - Drag left/right to zoom pitch
 * - Displays octave markers (C3, C4, etc.)
 * - Shows hovered note name when hovering over piano keys
 *
 * Uses D3-drag for unified mouse + touch support.
 */

import { Box } from '@mui/material'
import { useRef, useEffect, useMemo } from 'react'
import * as d3 from 'd3'
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
  /** Convert pitch to Y position (from D3 scales) */
  pitchToY: (pitch: number) => number
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
  pitchToY,
  hoveredPitch,
  onPanZoomPitch,
}: PitchZoomStripProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  const noteRange = viewport.highNote - viewport.lowNote + 1

  // Use refs for values that change but shouldn't trigger effect re-runs
  const viewportRef = useRef({ viewport, gridHeight, noteRange })
  viewportRef.current = { viewport, gridHeight, noteRange }

  // Generate octave markers (C notes) - memoized to prevent recalculation on every render
  const octaveMarkers = useMemo(() => {
    const markers: Array<{ pitch: number; label: string; y: number }> = []
    for (let pitch = 0; pitch <= 127; pitch += 12) {
      const y = pitchToY(pitch)
      // Use consistent culling: visible if any part is in viewport
      if (y >= -noteHeight && y <= gridHeight) {
        markers.push({
          pitch,
          label: midiToNoteName(pitch),
          y,
        })
      }
    }
    return markers
  }, [pitchToY, noteHeight, gridHeight])

  // Set up D3 drag for unified mouse + touch support
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let anchorPitch = 0
    let lastX = 0

    const drag = d3
      .drag<HTMLDivElement, unknown>()
      .on('start', (event) => {
        const rect = container.getBoundingClientRect()
        const localY = event.sourceEvent.clientY - rect.top
        const ratio = localY / viewportRef.current.gridHeight

        // Calculate the pitch under the cursor at drag start
        const { viewport, noteRange } = viewportRef.current
        anchorPitch = viewport.highNote - ratio * noteRange

        lastX = event.sourceEvent.clientX
      })
      .on('drag', (event) => {
        const rect = container.getBoundingClientRect()
        const localY = event.sourceEvent.clientY - rect.top
        const currentRatio = Math.max(0, Math.min(1, localY / viewportRef.current.gridHeight))

        // Calculate zoom from horizontal drag (deltaX since last frame)
        const currentX = event.sourceEvent.clientX
        const deltaX = currentX - lastX
        lastX = currentX

        // Drag right = zoom in (smaller range), drag left = zoom out
        const zoomDelta = 1 - deltaX * 0.01

        onPanZoomPitch(anchorPitch, currentRatio, zoomDelta)
      })

    d3.select(container).call(drag)

    return () => {
      d3.select(container).on('.drag', null)
    }
  }, [onPanZoomPitch])

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
        touchAction: 'none', // Prevent browser gestures
        overflow: 'hidden',
      }}
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
