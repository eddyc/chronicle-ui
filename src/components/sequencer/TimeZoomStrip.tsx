/**
 * TimeZoomStrip - Horizontal zoom control strip for time axis
 *
 * A dedicated strip above the timeline ruler for:
 * - Drag left/right to pan time
 * - Drag up/down to zoom time
 */

import { Box } from '@mui/material'
import { useRef, useCallback } from 'react'
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
  const dragAnchorRef = useRef<{ anchorBeat: number } | null>(null)
  const lastYRef = useRef<number>(0)

  // Pan/zoom via drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const ratio = x / width

      // Calculate the beat under the cursor at drag start
      const visibleBeats = endBeat - startBeat
      const anchorBeat = startBeat + ratio * visibleBeats

      dragAnchorRef.current = { anchorBeat }
      lastYRef.current = e.clientY

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragAnchorRef.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const currentX = moveEvent.clientX - rect.left
        const currentRatio = Math.max(0, Math.min(1, currentX / width))

        // Calculate zoom from vertical drag (deltaY since last frame)
        const deltaY = moveEvent.clientY - lastYRef.current
        lastYRef.current = moveEvent.clientY

        // Drag down = zoom in (smaller range), drag up = zoom out
        const zoomDelta = 1 - deltaY * 0.01

        onPanZoom(dragAnchorRef.current.anchorBeat, currentRatio, zoomDelta)
      }

      const cleanup = () => {
        dragAnchorRef.current = null
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', cleanup)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', cleanup)
    },
    [startBeat, endBeat, width, onPanZoom]
  )

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Optional: could add a subtle zoom icon or label here */}
    </Box>
  )
}
