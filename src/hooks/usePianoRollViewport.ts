/**
 * usePianoRollViewport - Viewport state management for PianoRoll
 *
 * Manages the visible range of beats (time) and notes (pitch) for the piano roll.
 * Provides pan and zoom functions that update the viewport state.
 *
 * Key principle: Use viewport ranges (startBeat/endBeat, lowNote/highNote) instead
 * of CSS transforms. This keeps coordinate math simple and correct.
 */

import { useState, useCallback, useRef, useMemo } from 'react'

// ============ Types ============

export interface ViewportState {
  /** First visible beat (left edge) */
  startBeat: number
  /** Last visible beat (right edge) */
  endBeat: number
  /** Lowest visible MIDI note */
  lowNote: number
  /** Highest visible MIDI note */
  highNote: number
}

export interface UsePianoRollViewportOptions {
  /** Initial number of visible beats (default: 8) */
  initialBeats?: number
  /** Initial lowest visible note (default: 36 = C2) */
  initialLowNote?: number
  /** Initial highest visible note (default: 84 = C6) */
  initialHighNote?: number
  /** Minimum beats that can be visible (zoom limit, default: 1) */
  minBeatsVisible?: number
  /** Maximum beats that can be visible (zoom limit, default: 64) */
  maxBeatsVisible?: number
  /** Minimum notes that can be visible (zoom limit, default: 12) */
  minNotesVisible?: number
  /** Maximum notes that can be visible (zoom limit, default: 88) */
  maxNotesVisible?: number
  /** Total clip length in beats (for clamping scroll) */
  clipLength: number
}

export interface UsePianoRollViewportResult {
  /** Current viewport state */
  viewport: ViewportState
  /** Pan time (horizontal scroll). Positive = scroll right (later in time) */
  panTime: (deltaBeats: number) => void
  /** Pan pitch (vertical scroll). Positive = scroll up (higher notes) */
  panPitch: (deltaNotes: number) => void
  /** Zoom time. factor > 1 = zoom out, factor < 1 = zoom in. Anchor is the beat to keep fixed. */
  zoomTime: (factor: number, anchorBeat?: number) => void
  /** Zoom pitch. factor > 1 = zoom out, factor < 1 = zoom in. Anchor is the pitch to keep fixed. */
  zoomPitch: (factor: number, anchorPitch?: number) => void
  /**
   * Combined pan+zoom for time axis with cursor anchoring.
   * Keeps anchorBeat at the cursor position (anchorRatio) while zooming.
   * @param anchorBeat - The beat that should stay under the cursor
   * @param anchorRatio - Current cursor position as ratio (0-1) of viewport width
   * @param zoomFactor - Zoom factor (>1 = zoom out, <1 = zoom in)
   */
  panZoomTime: (anchorBeat: number, anchorRatio: number, zoomFactor: number) => void
  /**
   * Combined pan+zoom for pitch axis with cursor anchoring.
   * Keeps anchorPitch at the cursor position (anchorRatio) while zooming.
   * @param anchorPitch - The pitch that should stay under the cursor
   * @param anchorRatio - Current cursor position as ratio (0-1) of viewport height (0=top=high, 1=bottom=low)
   * @param zoomFactor - Zoom factor (>1 = zoom out, <1 = zoom in)
   */
  panZoomPitch: (anchorPitch: number, anchorRatio: number, zoomFactor: number) => void
  /** Reset viewport to show all notes */
  resetViewport: () => void
  /** Create wheel event handler for grid panning. Pass grid dimensions. */
  createWheelHandler: (gridWidth: number, gridHeight: number) => (e: WheelEvent) => void
}

// ============ Helpers ============

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============ Hook ============

export function usePianoRollViewport(
  options: UsePianoRollViewportOptions
): UsePianoRollViewportResult {
  const {
    initialBeats = 8,
    initialLowNote = 36,
    initialHighNote = 84,
    minBeatsVisible = 1,
    maxBeatsVisible = 64,
    minNotesVisible = 12,
    maxNotesVisible = 88,
    clipLength,
  } = options

  // Store options in ref for stable callbacks
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [viewport, setViewport] = useState<ViewportState>(() => ({
    startBeat: 0,
    endBeat: initialBeats,
    lowNote: initialLowNote,
    highNote: initialHighNote,
  }))

  // Pan time (horizontal scroll)
  const panTime = useCallback((deltaBeats: number) => {
    setViewport((v) => {
      const range = v.endBeat - v.startBeat
      let newStart = v.startBeat + deltaBeats

      // Clamp to valid range
      if (newStart < 0) {
        newStart = 0
      }
      const maxStart = Math.max(0, optionsRef.current.clipLength - range)
      if (newStart > maxStart) {
        newStart = maxStart
      }

      return {
        ...v,
        startBeat: newStart,
        endBeat: newStart + range,
      }
    })
  }, [])

  // Pan pitch (vertical scroll)
  const panPitch = useCallback((deltaNotes: number) => {
    setViewport((v) => {
      const range = v.highNote - v.lowNote
      let newLow = v.lowNote + deltaNotes

      // Clamp to MIDI range (0-127)
      if (newLow < 0) {
        newLow = 0
      }
      if (newLow + range > 127) {
        newLow = 127 - range
      }

      return {
        ...v,
        lowNote: newLow,
        highNote: newLow + range,
      }
    })
  }, [])

  // Zoom time (horizontal zoom)
  const zoomTime = useCallback(
    (factor: number, anchorBeat?: number) => {
      setViewport((v) => {
        const range = v.endBeat - v.startBeat
        const newRange = clamp(range * factor, minBeatsVisible, maxBeatsVisible)

        if (newRange === range) return v

        // Anchor point (default: center of viewport)
        const anchor = anchorBeat ?? v.startBeat + range / 2
        const anchorRatio = (anchor - v.startBeat) / range

        // Keep anchor at same relative position
        let newStart = anchor - newRange * anchorRatio

        // Clamp to valid range
        if (newStart < 0) {
          newStart = 0
        }
        const maxStart = Math.max(0, optionsRef.current.clipLength - newRange)
        if (newStart > maxStart) {
          newStart = maxStart
        }

        return {
          ...v,
          startBeat: newStart,
          endBeat: newStart + newRange,
        }
      })
    },
    [minBeatsVisible, maxBeatsVisible]
  )

  // Zoom pitch (vertical zoom)
  const zoomPitch = useCallback(
    (factor: number, anchorPitch?: number) => {
      setViewport((v) => {
        const range = v.highNote - v.lowNote
        const newRange = clamp(range * factor, minNotesVisible, maxNotesVisible)

        if (newRange === range) return v

        // Anchor point (default: center of viewport)
        const anchor = anchorPitch ?? v.lowNote + range / 2
        const anchorRatio = (anchor - v.lowNote) / range

        // Keep anchor at same relative position
        let newLow = anchor - newRange * anchorRatio

        // Clamp to MIDI range
        if (newLow < 0) {
          newLow = 0
        }
        if (newLow + newRange > 127) {
          newLow = 127 - newRange
        }

        // Don't round - keep fractional for smooth zooming
        return {
          ...v,
          lowNote: newLow,
          highNote: newLow + newRange,
        }
      })
    },
    [minNotesVisible, maxNotesVisible]
  )

  // Combined pan+zoom for time axis (geometric solution)
  // The invariant: anchorBeat = startBeat + anchorRatio * range
  // Solving for startBeat: startBeat = anchorBeat - anchorRatio * range
  const panZoomTime = useCallback(
    (anchorBeat: number, anchorRatio: number, zoomFactor: number) => {
      setViewport((v) => {
        const range = v.endBeat - v.startBeat
        const newRange = clamp(range * zoomFactor, minBeatsVisible, maxBeatsVisible)

        // Calculate new startBeat to keep anchorBeat at anchorRatio position
        // This is the geometric invariant that makes zoom feel natural
        let newStart = anchorBeat - anchorRatio * newRange

        // Only clamp startBeat to >= 0 (can't go before beat 0)
        // Don't clamp to clipLength - allow viewport to extend beyond clip
        // This is important when clipLength < visibleRange (e.g., 4-beat clip with 8-beat view)
        newStart = Math.max(0, newStart)

        return {
          ...v,
          startBeat: newStart,
          endBeat: newStart + newRange,
        }
      })
    },
    [minBeatsVisible, maxBeatsVisible]
  )

  // Combined pan+zoom for pitch axis (geometric solution)
  // The invariant: anchorPitch = highNote - anchorRatio * range (since Y is inverted)
  // Solving for highNote: highNote = anchorPitch + anchorRatio * range
  // And lowNote = highNote - range
  const panZoomPitch = useCallback(
    (anchorPitch: number, anchorRatio: number, zoomFactor: number) => {
      setViewport((v) => {
        const range = v.highNote - v.lowNote
        // Don't clamp newRange to integers - allow fractional for smooth zoom
        const newRange = clamp(range * zoomFactor, minNotesVisible, maxNotesVisible)

        // Calculate new highNote to keep anchorPitch at anchorRatio position
        // anchorRatio is from top (0) to bottom (1), and highNote is at top
        let newHigh = anchorPitch + anchorRatio * newRange
        let newLow = newHigh - newRange

        // Clamp to MIDI range
        if (newLow < 0) {
          newLow = 0
          newHigh = newRange
        }
        if (newHigh > 127) {
          newHigh = 127
          newLow = 127 - newRange
        }

        // Don't round - keep fractional values for smooth zooming
        // The rendering will handle the fractional note heights
        return {
          ...v,
          lowNote: newLow,
          highNote: newHigh,
        }
      })
    },
    [minNotesVisible, maxNotesVisible]
  )

  // Reset viewport to show all content
  const resetViewport = useCallback(() => {
    setViewport({
      startBeat: 0,
      endBeat: optionsRef.current.initialBeats ?? 8,
      lowNote: optionsRef.current.initialLowNote ?? 36,
      highNote: optionsRef.current.initialHighNote ?? 84,
    })
  }, [])

  // Create wheel handler for grid panning
  const createWheelHandler = useCallback(
    (gridWidth: number, gridHeight: number) => {
      return (e: WheelEvent) => {
        e.preventDefault()

        // Two-finger scroll → pan
        const beatsVisible = viewport.endBeat - viewport.startBeat
        const notesVisible = viewport.highNote - viewport.lowNote

        const beatsPerPixel = beatsVisible / gridWidth
        const notesPerPixel = notesVisible / gridHeight

        // Horizontal pan (deltaX)
        if (Math.abs(e.deltaX) > 0) {
          panTime(e.deltaX * beatsPerPixel * 0.5)
        }

        // Vertical pan (deltaY) - negative because wheel up = scroll up = higher notes
        if (Math.abs(e.deltaY) > 0) {
          panPitch(-e.deltaY * notesPerPixel * 0.5)
        }
      }
    },
    [viewport, panTime, panPitch]
  )

  return {
    viewport,
    panTime,
    panPitch,
    zoomTime,
    zoomPitch,
    panZoomTime,
    panZoomPitch,
    resetViewport,
    createWheelHandler,
  }
}
