/**
 * PianoKeyboard - Piano keys column for PianoRoll
 *
 * Renders the piano keyboard on the left side of the piano roll.
 * Supports:
 * - Click to preview notes
 * - Hover to show note in PitchZoomStrip
 */

import { Box } from '@mui/material'
import { useRef, useState, useCallback } from 'react'
import { useChronicleTheme } from '../../hooks'
import type { ViewportState } from '../../hooks'
import {
  isBlackKey,
  KEY_WIDTH,
  DEFAULT_VELOCITY,
  generatePitchRows,
} from './utils/pianoRollHelpers'

// ============ Types ============

export interface PianoKeyboardProps {
  /** Current viewport state */
  viewport: ViewportState
  /** Height of the grid container */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
  /** Currently hovered pitch (for highlighting) */
  hoveredPitch: number | null
  /** Callback when hover changes */
  onHoverPitch: (pitch: number | null) => void
  /** Called when a note should be previewed */
  onNotePreview?: (pitch: number, velocity: number) => void
  /** Called when a note preview should end */
  onNotePreviewEnd?: (pitch: number) => void
}

// ============ Constants ============

const ALL_PITCH_ROWS = generatePitchRows()

// Piano key colors - always consistent
const WHITE_KEY_COLOR = '#F5F5F0' // Creamy white
const BLACK_KEY_COLOR = '#1A1A1A' // Dark black

// ============ Component ============

export function PianoKeyboard({
  viewport,
  gridHeight,
  noteHeight,
  hoveredPitch,
  onHoverPitch,
  onNotePreview,
  onNotePreviewEnd,
}: PianoKeyboardProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // Preview state for piano keys (playing note)
  const [previewPitch, setPreviewPitch] = useState<number | null>(null)

  // Convert pitch to Y position
  const pitchToY = useCallback(
    (pitch: number): number => {
      return (viewport.highNote - pitch) * noteHeight
    },
    [viewport.highNote, noteHeight]
  )

  // Handle mouse down - start note preview
  const handleKeyMouseDown = useCallback(
    (pitch: number) => {
      setPreviewPitch(pitch)
      onNotePreview?.(pitch, DEFAULT_VELOCITY)
    },
    [onNotePreview]
  )

  // Handle mouse up - end note preview
  const handleMouseUp = useCallback(() => {
    if (previewPitch !== null) {
      onNotePreviewEnd?.(previewPitch)
      setPreviewPitch(null)
    }
  }, [previewPitch, onNotePreviewEnd])

  // Handle mouse leave - clear hover and end preview
  const handleMouseLeave = useCallback(() => {
    onHoverPitch(null)
    if (previewPitch !== null) {
      onNotePreviewEnd?.(previewPitch)
      setPreviewPitch(null)
    }
  }, [onHoverPitch, previewPitch, onNotePreviewEnd])

  return (
    <Box
      ref={containerRef}
      sx={{
        width: KEY_WIDTH,
        flexShrink: 0,
        borderRight: `1px solid ${semantic.border.default}`,
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {ALL_PITCH_ROWS.map((pitch) => {
        const y = pitchToY(pitch)
        // Skip rendering if completely outside visible area
        if (y + noteHeight < 0 || y > gridHeight) return null

        const isBlack = isBlackKey(pitch)

        return (
          <Box
            key={pitch}
            onMouseDown={() => handleKeyMouseDown(pitch)}
            onMouseEnter={() => onHoverPitch(pitch)}
            sx={{
              position: 'absolute',
              top: y,
              left: 0,
              right: 0,
              height: noteHeight,
              backgroundColor: isBlack ? BLACK_KEY_COLOR : WHITE_KEY_COLOR,
              borderBottom: `1px solid ${semantic.border.subtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 0.5,
              cursor: 'pointer',
            }}
          />
        )
      })}
    </Box>
  )
}
