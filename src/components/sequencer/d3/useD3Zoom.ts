/**
 * useD3Zoom - D3 zoom behavior for PianoRoll viewport
 *
 * Provides:
 * - Pinch-to-zoom on touch devices
 * - Ctrl+wheel zoom on desktop
 * - Two-finger pan on trackpad
 * - Single-finger pan on touch (when not over notes)
 *
 * Uses D3-zoom for unified mouse + touch support.
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

    // Track the zoom transform separately from viewport state
    // D3 zoom manages its own transform, we translate it to viewport updates
    let lastTransform = d3.zoomIdentity

    const zoom = d3
      .zoom<SVGSVGElement | HTMLDivElement, unknown>()
      // Allow zoom from 0.25x to 4x (relative to initial)
      .scaleExtent([0.25, 4])
      // Constrain pan (handled by viewport clamping)
      .filter((event: Event) => {
        // Allow:
        // - Wheel events (trackpad/mouse wheel)
        // - Touch events (pinch/pan)
        // - Mouse drag with middle button only (leave left for note interaction)
        const mouseEvent = event as MouseEvent
        const touchEvent = event as TouchEvent

        // Wheel is always allowed (trackpad two-finger, mouse wheel)
        if (event.type === 'wheel') return true

        // Touch events allowed (pinch-to-zoom, two-finger pan)
        if (event.type.startsWith('touch')) {
          // Only allow multi-touch (pinch/two-finger pan)
          // Single touch should be handled by note drag
          return touchEvent.touches?.length >= 2
        }

        // Mouse: only middle button drag for pan
        // Left button is for note selection/drag
        if (event.type === 'mousedown') {
          return mouseEvent.button === 1 // Middle button
        }

        return false
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement | HTMLDivElement, unknown>) => {
        const { gridWidth, gridHeight, viewport } = optionsRef.current
        const transform = event.transform

        // Calculate deltas from last transform
        const scaleRatio = transform.k / lastTransform.k
        const deltaX = transform.x - lastTransform.x * scaleRatio
        const deltaY = transform.y - lastTransform.y * scaleRatio

        // Get cursor position for anchor
        const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent | WheelEvent
        let clientX = 0
        let clientY = 0

        if (sourceEvent) {
          if ('touches' in sourceEvent && sourceEvent.touches.length > 0) {
            // Touch: use center of touches
            const touches = sourceEvent.touches
            clientX = Array.from(touches).reduce((sum, t) => sum + t.clientX, 0) / touches.length
            clientY = Array.from(touches).reduce((sum, t) => sum + t.clientY, 0) / touches.length
          } else if ('clientX' in sourceEvent) {
            clientX = sourceEvent.clientX
            clientY = sourceEvent.clientY
          }
        }

        const rect = container.getBoundingClientRect()
        const localX = clientX - rect.left
        const localY = clientY - rect.top

        // Calculate anchor position as ratio (0-1)
        const anchorRatioX = Math.max(0, Math.min(1, localX / gridWidth))
        const anchorRatioY = Math.max(0, Math.min(1, localY / gridHeight))

        // Calculate anchor beat and pitch
        const visibleBeats = viewport.endBeat - viewport.startBeat
        const visibleNotes = viewport.highNote - viewport.lowNote
        const anchorBeat = viewport.startBeat + anchorRatioX * visibleBeats
        const anchorPitch = viewport.highNote - anchorRatioY * visibleNotes

        // Handle zoom (scale changed)
        if (Math.abs(scaleRatio - 1) > 0.001) {
          // Zoom factor: D3 scale increase = zoom in = smaller viewport = factor < 1
          const zoomFactor = 1 / scaleRatio

          // Apply zoom to both axes
          panZoomTime(anchorBeat, anchorRatioX, zoomFactor)
          panZoomPitch(anchorPitch, anchorRatioY, zoomFactor)
        }

        // Handle pan (translation changed)
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
          // Convert pixel delta to beat/note delta
          const beatsPerPixel = visibleBeats / gridWidth
          const notesPerPixel = visibleNotes / gridHeight

          // Pan: negative deltaX = scroll right = later in time
          if (Math.abs(deltaX) > 0.5) {
            panTime(-deltaX * beatsPerPixel)
          }

          // Pan: negative deltaY = scroll down = lower notes
          if (Math.abs(deltaY) > 0.5) {
            panPitch(deltaY * notesPerPixel)
          }
        }

        lastTransform = transform
      })

    // Apply zoom behavior
    const selection = d3.select(container as SVGSVGElement | HTMLDivElement)
    selection.call(zoom)

    // Disable default double-click zoom (we use double-click for note creation)
    selection.on('dblclick.zoom', null)

    return () => {
      selection.on('.zoom', null)
    }
  }, [containerRef, panZoomTime, panZoomPitch, panTime, panPitch])
}
