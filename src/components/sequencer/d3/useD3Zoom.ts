/**
 * useD3Zoom - Viewport pan/zoom behavior for PianoRoll
 *
 * Provides:
 * - Two-finger scroll = PAN (trackpad or touch)
 * - Pinch = ZOOM (touch devices)
 * - Ctrl+wheel = ZOOM (desktop)
 * - Middle mouse drag = PAN (desktop)
 *
 * Key behavior: Two-finger scroll on trackpad pans WITHOUT zooming.
 * This matches DAW conventions (Logic, Ableton, etc.)
 */

import * as d3 from 'd3'
import { useEffect, useRef } from 'react'
import type { ViewportState } from '../../../hooks'

// ============ Types ============

export interface UseD3ZoomOptions {
  /** Ref to the container element (SVG or div) */
  containerRef: React.RefObject<SVGSVGElement | HTMLDivElement | null>
  /** Current viewport state */
  viewport: ViewportState
  /** Grid width in pixels */
  gridWidth: number
  /** Grid height in pixels */
  gridHeight: number
  /** Combined pan+zoom for time axis */
  panZoomTime: (anchorBeat: number, anchorRatio: number, zoomFactor: number) => void
  /** Combined pan+zoom for pitch axis */
  panZoomPitch: (anchorPitch: number, anchorRatio: number, zoomFactor: number) => void
  /** Pan time (for horizontal scroll without zoom) */
  panTime: (deltaBeats: number) => void
  /** Pan pitch (for vertical scroll without zoom) */
  panPitch: (deltaNotes: number) => void
}

// ============ Hook ============

export function useD3Zoom(options: UseD3ZoomOptions): void {
  const {
    containerRef,
    panZoomTime,
    panZoomPitch,
    panTime,
    panPitch,
  } = options

  // Use refs for values that change but shouldn't trigger effect re-runs
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ========== WHEEL HANDLER (Trackpad/Mouse) ==========
    // Two-finger scroll = pan, Ctrl+wheel = zoom
    const handleWheel = (e: Event) => {
      const event = e as WheelEvent
      event.preventDefault()

      const { gridWidth, gridHeight, viewport } = optionsRef.current
      const visibleBeats = viewport.endBeat - viewport.startBeat
      const visibleNotes = viewport.highNote - viewport.lowNote

      // Ctrl+wheel = zoom
      if (event.ctrlKey || event.metaKey) {
        const rect = container.getBoundingClientRect()
        const localX = event.clientX - rect.left
        const localY = event.clientY - rect.top

        const anchorRatioX = Math.max(0, Math.min(1, localX / gridWidth))
        const anchorRatioY = Math.max(0, Math.min(1, localY / gridHeight))

        const anchorBeat = viewport.startBeat + anchorRatioX * visibleBeats
        const anchorPitch = viewport.highNote - anchorRatioY * visibleNotes

        // Wheel deltaY: positive = scroll down = zoom out
        // Zoom factor > 1 = zoom out, < 1 = zoom in
        const zoomFactor = 1 + event.deltaY * 0.002

        panZoomTime(anchorBeat, anchorRatioX, zoomFactor)
        panZoomPitch(anchorPitch, anchorRatioY, zoomFactor)
      } else {
        // Regular scroll = pan
        const beatsPerPixel = visibleBeats / gridWidth
        const notesPerPixel = visibleNotes / gridHeight

        // deltaX: positive = scroll right = move viewport right (later beats)
        if (Math.abs(event.deltaX) > 0.5) {
          panTime(event.deltaX * beatsPerPixel)
        }

        // deltaY: positive = scroll down = move viewport down (lower pitches)
        if (Math.abs(event.deltaY) > 0.5) {
          panPitch(-event.deltaY * notesPerPixel)
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })

    // ========== TOUCH HANDLER (Pinch-to-zoom + Two-finger pan) ==========
    // Use D3 zoom only for touch gestures
    let lastTouchDistance = 0
    let lastTouchCenter = { x: 0, y: 0 }

    const zoom = d3
      .zoom<SVGSVGElement | HTMLDivElement, unknown>()
      .scaleExtent([0.25, 4])
      .filter((event: Event) => {
        // Only handle touch events with 2+ fingers
        if (event.type.startsWith('touch')) {
          const touchEvent = event as TouchEvent
          return touchEvent.touches?.length >= 2
        }
        // Middle mouse button for pan
        if (event.type === 'mousedown') {
          return (event as MouseEvent).button === 1
        }
        // Block wheel events (handled separately above)
        if (event.type === 'wheel') return false
        return false
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement | HTMLDivElement, unknown>) => {
        const { gridWidth, gridHeight, viewport } = optionsRef.current
        const sourceEvent = event.sourceEvent as TouchEvent | MouseEvent

        // Handle touch pinch/pan
        if ('touches' in sourceEvent && sourceEvent.touches.length >= 2) {
          const touches = sourceEvent.touches
          const t1 = touches[0]
          const t2 = touches[1]

          // Calculate center and distance between touches
          const centerX = (t1.clientX + t2.clientX) / 2
          const centerY = (t1.clientY + t2.clientY) / 2
          const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)

          const rect = container.getBoundingClientRect()
          const localX = centerX - rect.left
          const localY = centerY - rect.top

          const visibleBeats = viewport.endBeat - viewport.startBeat
          const visibleNotes = viewport.highNote - viewport.lowNote

          // Handle pinch zoom
          if (lastTouchDistance > 0 && Math.abs(distance - lastTouchDistance) > 2) {
            const anchorRatioX = Math.max(0, Math.min(1, localX / gridWidth))
            const anchorRatioY = Math.max(0, Math.min(1, localY / gridHeight))
            const anchorBeat = viewport.startBeat + anchorRatioX * visibleBeats
            const anchorPitch = viewport.highNote - anchorRatioY * visibleNotes

            const zoomFactor = lastTouchDistance / distance
            panZoomTime(anchorBeat, anchorRatioX, zoomFactor)
            panZoomPitch(anchorPitch, anchorRatioY, zoomFactor)
          }

          // Handle two-finger pan
          if (lastTouchCenter.x !== 0 || lastTouchCenter.y !== 0) {
            const deltaX = centerX - lastTouchCenter.x
            const deltaY = centerY - lastTouchCenter.y

            const beatsPerPixel = visibleBeats / gridWidth
            const notesPerPixel = visibleNotes / gridHeight

            if (Math.abs(deltaX) > 1) {
              panTime(-deltaX * beatsPerPixel)
            }
            if (Math.abs(deltaY) > 1) {
              panPitch(deltaY * notesPerPixel)
            }
          }

          lastTouchDistance = distance
          lastTouchCenter = { x: centerX, y: centerY }
        }
      })
      .on('end', () => {
        // Reset touch tracking
        lastTouchDistance = 0
        lastTouchCenter = { x: 0, y: 0 }
      })

    // Apply D3 zoom for touch only
    const selection = d3.select(container as SVGSVGElement | HTMLDivElement)
    selection.call(zoom)

    // Disable double-click zoom (we use double-click for note creation)
    selection.on('dblclick.zoom', null)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      selection.on('.zoom', null)
    }
  }, [containerRef, panZoomTime, panZoomPitch, panTime, panPitch])
}
