/**
 * usePlayheadAnimation - RAF-based playhead animation
 *
 * Bypasses React entirely for smooth playhead updates during playback.
 * Uses requestAnimationFrame to poll a ref and update SVG attributes directly.
 * This avoids the performance overhead of React re-renders at 60fps.
 */

import { useEffect, useRef } from 'react'

// ============ Types ============

export interface UsePlayheadAnimationOptions {
  svgRef: React.RefObject<SVGSVGElement | null>
  /** Ref containing current playhead position (updated externally) */
  playheadBeatRef: React.MutableRefObject<number>
  /** Whether playback is active (controls RAF loop) */
  isPlaying: boolean
  /** Convert beat position to X pixel coordinate */
  beatToX: (beat: number) => number
  /** Viewport bounds for visibility check */
  viewport: { startBeat: number; endBeat: number }
  /** Grid height for playhead line */
  gridHeight: number
  /** Playhead color */
  color: string
}

// ============ Hook ============

export function usePlayheadAnimation(options: UsePlayheadAnimationOptions): void {
  const {
    svgRef,
    playheadBeatRef,
    isPlaying,
    beatToX,
    viewport,
    gridHeight,
    color,
  } = options

  // Cache playhead SVG element
  const playheadRef = useRef<SVGLineElement | null>(null)
  // Track RAF handle for cleanup
  const rafRef = useRef<number | null>(null)

  // Setup playhead element once
  useEffect(() => {
    if (!svgRef.current) return

    // Find existing or create new playhead line
    let playhead = svgRef.current.querySelector<SVGLineElement>('line.playhead')
    if (!playhead) {
      playhead = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      playhead.setAttribute('class', 'playhead')
      playhead.setAttribute('pointer-events', 'none')
      svgRef.current.appendChild(playhead)
    }

    // Set static attributes
    playhead.setAttribute('stroke', color)
    playhead.setAttribute('stroke-width', '2')
    playhead.setAttribute('y1', '0')
    playhead.setAttribute('y2', String(gridHeight))

    playheadRef.current = playhead

    return () => {
      // Don't remove on cleanup - let the SVG manage its lifecycle
      playheadRef.current = null
    }
  }, [svgRef, gridHeight, color])

  // RAF animation loop - bypasses React entirely
  useEffect(() => {
    const playhead = playheadRef.current
    if (!playhead) return

    function updatePlayhead() {
      if (!playhead) return

      const beat = playheadBeatRef.current
      const x = beatToX(beat)
      const isVisible = beat >= viewport.startBeat && beat <= viewport.endBeat

      playhead.setAttribute('x1', String(x))
      playhead.setAttribute('x2', String(x))
      playhead.setAttribute('visibility', isVisible ? 'visible' : 'hidden')
    }

    // Always update once immediately (for stopped state)
    updatePlayhead()

    if (!isPlaying) {
      // Not playing - no RAF loop needed
      return
    }

    // Start RAF loop for smooth playhead animation
    function animate() {
      updatePlayhead()
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, beatToX, viewport.startBeat, viewport.endBeat, playheadBeatRef])
}
