/**
 * PianoKeyboard - Piano keys column for PianoRoll
 *
 * Renders the piano keyboard on the left side of the piano roll using SVG.
 * Uses D3 for rendering to stay in sync with the grid (same render pipeline).
 * Supports:
 * - Click to preview notes
 * - Hover to show note in PitchZoomStrip
 */

import { Box } from '@mui/material'
import { useRef, useMemo } from 'react'
import { useChronicleTheme } from '../../hooks'
import type { ViewportState } from '../../hooks'
import type { PianoRollScales } from './hooks/usePianoRollScales'
import { useD3PianoKeys } from './d3'
import { KEY_WIDTH } from './utils/pianoRollHelpers'

// ============ Types ============

export interface PianoKeyboardProps {
  /** Current viewport state */
  viewport: ViewportState
  /** Height of the grid container */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
  /** Convert pitch to Y position (from D3 scales) */
  pitchToY: (pitch: number) => number
  /** Currently hovered pitch (for highlighting) */
  hoveredPitch: number | null
  /** Callback when hover changes */
  onHoverPitch: (pitch: number | null) => void
  /** Called when a note should be previewed */
  onNotePreview?: (pitch: number, velocity: number) => void
  /** Called when a note preview should end */
  onNotePreviewEnd?: (pitch: number) => void
}

// ============ Component ============

export function PianoKeyboard({
  viewport,
  gridHeight,
  noteHeight,
  pitchToY,
  hoveredPitch,
  onHoverPitch,
  onNotePreview,
  onNotePreviewEnd,
}: PianoKeyboardProps) {
  const { semantic } = useChronicleTheme()
  const svgRef = useRef<SVGSVGElement>(null)

  // Create scales object for D3 hook (matching PianoRollScales interface)
  const scales: PianoRollScales = useMemo(
    () => ({
      gridWidth: KEY_WIDTH,
      gridHeight,
      noteHeight,
      pitchToY,
      // These aren't used by piano keys but required by the type
      xScale: null as never,
      yScale: null as never,
      beatToX: () => 0,
      xToBeat: () => 0,
      yToPitch: () => 0,
    }),
    [gridHeight, noteHeight, pitchToY]
  )

  // Use D3 to render piano keys (same pipeline as grid for perfect sync)
  useD3PianoKeys({
    svgRef,
    scales,
    keyWidth: KEY_WIDTH,
    hoveredPitch,
    onHoverPitch,
    onNotePreview,
    onNotePreviewEnd,
    theme: {
      border: {
        subtle: semantic.border.subtle,
      },
      accent: {
        primary: semantic.accent.primary,
      },
    },
  })

  return (
    <Box
      sx={{
        width: KEY_WIDTH,
        flexShrink: 0,
        borderRight: `1px solid ${semantic.border.default}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <svg
        ref={svgRef}
        width={KEY_WIDTH}
        height={gridHeight}
        style={{ display: 'block' }}
      />
    </Box>
  )
}
