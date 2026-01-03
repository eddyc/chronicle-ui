/**
 * usePianoRollScales - D3 scales for PianoRoll coordinate conversion
 *
 * Provides D3 linear scales for mapping between:
 * - beat <-> pixel X
 * - pitch <-> pixel Y
 *
 * Replaces the manual coordinate helpers in pianoRollHelpers.ts
 */

import * as d3 from 'd3'
import { useMemo } from 'react'
import type { ViewportState } from '../../../hooks'
import { snap } from '../utils/pianoRollHelpers'

// ============ Types ============

export interface PianoRollScales {
  /** D3 scale: beat -> pixel X */
  xScale: d3.ScaleLinear<number, number>
  /** D3 scale: pitch -> pixel Y (inverted for screen coords) */
  yScale: d3.ScaleLinear<number, number>
  /** Convert beat to pixel X */
  beatToX: (beat: number) => number
  /** Convert pitch to pixel Y */
  pitchToY: (pitch: number) => number
  /** Convert pixel X to beat (with snapping) */
  xToBeat: (x: number) => number
  /** Convert pixel Y to pitch */
  yToPitch: (y: number) => number
  /** Grid width in pixels */
  gridWidth: number
  /** Grid height in pixels */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
}

export interface UsePianoRollScalesOptions {
  viewport: ViewportState
  gridWidth: number
  gridHeight: number
  snapToBeat: number
}

// ============ Hook ============

export function usePianoRollScales(
  options: UsePianoRollScalesOptions
): PianoRollScales {
  const { viewport, gridWidth, gridHeight, snapToBeat } = options

  return useMemo(() => {
    // X scale: beat -> pixel
    const xScale = d3
      .scaleLinear()
      .domain([viewport.startBeat, viewport.endBeat])
      .range([0, gridWidth])

    // Y scale: pitch -> pixel (inverted - high notes at top)
    // Note: We use highNote + 1 so that pitchToY(highNote) = 0, not noteHeight
    const noteRange = viewport.highNote - viewport.lowNote + 1
    const yScale = d3
      .scaleLinear()
      .domain([viewport.highNote + 1, viewport.lowNote])
      .range([0, gridHeight])

    const noteHeight = gridHeight / noteRange

    return {
      xScale,
      yScale,
      gridWidth,
      gridHeight,
      noteHeight,
      beatToX: (beat: number) => xScale(beat),
      pitchToY: (pitch: number) => yScale(pitch + 1),
      xToBeat: (x: number) => {
        const beat = xScale.invert(x)
        return snap(beat, snapToBeat)
      },
      yToPitch: (y: number) => {
        // Y is inverted, so we need to find which pitch row the y coordinate falls in
        const pitch = Math.floor(yScale.invert(y))
        return Math.max(0, Math.min(127, pitch))
      },
    }
  }, [viewport, gridWidth, gridHeight, snapToBeat])
}
