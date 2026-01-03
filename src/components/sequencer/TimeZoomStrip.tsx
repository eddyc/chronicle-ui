/**
 * TimeZoomStrip - Horizontal zoom control strip for time axis
 *
 * A dedicated strip above the timeline ruler for:
 * - Drag left/right to pan time
 * - Drag up/down to zoom time
 *
 * Uses D3-drag for unified mouse + touch support.
 */

import { Box } from '@mui/material'
import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useChronicleTheme } from '../../hooks'

// ============ Types ============

export interface TimeZoomStripProps {
  /** First visible beat */
  startBeat: number
  /** Last visible beat */
  endBeat: number
  /** Width of the strip in pixels */
  width: number
  /** Callback for pan/zoom with cursor anchoring */
  onPanZoom: (
    anchorBeat: number,
    anchorRatio: number,
    zoomFactor: number
  ) => void
}

// ============ Constants ============

export const TIME_ZOOM_STRIP_HEIGHT = 30

// ============ Component ============

export function TimeZoomStrip({
  startBeat,
  endBeat,
  width,
  onPanZoom,
}: TimeZoomStripProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // Use refs for values that change but shouldn't trigger effect re-runs
  const viewportRef = useRef({ startBeat, endBeat, width })
  viewportRef.current = { startBeat, endBeat, width }

  // Set up D3 drag for unified mouse + touch support
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let anchorBeat = 0
    let lastY = 0

    const drag = d3
      .drag<HTMLDivElement, unknown>()
      .on('start', (event) => {
        const rect = container.getBoundingClientRect()
        const localX = event.sourceEvent.clientX - rect.left
        const ratio = localX / viewportRef.current.width

        // Calculate the beat under the cursor at drag start
        const visibleBeats = viewportRef.current.endBeat - viewportRef.current.startBeat
        anchorBeat = viewportRef.current.startBeat + ratio * visibleBeats

        lastY = event.sourceEvent.clientY
      })
      .on('drag', (event) => {
        const rect = container.getBoundingClientRect()
        const localX = event.sourceEvent.clientX - rect.left
        const currentRatio = Math.max(0, Math.min(1, localX / viewportRef.current.width))

        // Calculate zoom from vertical drag (deltaY since last frame)
        const currentY = event.sourceEvent.clientY
        const deltaY = currentY - lastY
        lastY = currentY

        // Drag down = zoom in (smaller range), drag up = zoom out
        const zoomDelta = 1 - deltaY * 0.01

        onPanZoom(anchorBeat, currentRatio, zoomDelta)
      })

    d3.select(container).call(drag)

    return () => {
      d3.select(container).on('.drag', null)
    }
  }, [onPanZoom])

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        height: TIME_ZOOM_STRIP_HEIGHT,
        backgroundColor: semantic.background.elevated,
        borderBottom: `1px solid ${semantic.border.default}`,
        position: 'relative',
        cursor: 'zoom-in',
        userSelect: 'none',
        touchAction: 'none', // Prevent browser gestures
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Optional: could add a subtle zoom icon or label here */}
    </Box>
  )
}
