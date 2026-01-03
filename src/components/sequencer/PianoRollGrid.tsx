/**
 * PianoRollGrid - Note grid area for PianoRoll (D3 version)
 *
 * Renders the main editing area of the piano roll using D3:
 * - Grid lines (horizontal pitch rows, vertical beat columns)
 * - MIDI notes with selection highlighting
 * - Playhead position indicator
 * - Brush selection
 *
 * All rendering and interactions are handled by D3 hooks.
 */

import { Box } from '@mui/material'
import { useRef, useEffect, useCallback } from 'react'
import { useChronicleTheme } from '../../hooks'
import type { ViewportState } from '../../hooks'
import type { MidiClip } from '@eddyc/chronicle-client'
import { usePianoRollScales } from './hooks/usePianoRollScales'
import { useD3Grid } from './d3/useD3Grid'
import { useD3Notes } from './d3/useD3Notes'
import { useD3NoteDrag } from './d3/useD3NoteDrag'
import { useD3Brush } from './d3/useD3Brush'
import { useD3Zoom } from './d3/useD3Zoom'
import { useD3Overlays } from './d3/useD3Overlays'
import { usePlayheadAnimation } from './d3/usePlayheadAnimation'

// ============ Types ============

export interface PianoRollGridProps {
  /** The clip being edited */
  clip: MidiClip
  /** Callback when clip changes */
  onClipChange: (clip: MidiClip) => void
  /** Current viewport state */
  viewport: ViewportState
  /** Width of the grid in pixels */
  gridWidth: number
  /** Height of the grid in pixels */
  gridHeight: number
  /** Height of each note row in pixels */
  noteHeight: number
  /** Snap grid size in beats */
  snapToBeat: number
  /** Currently selected note IDs */
  selection: Set<string>
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<string>) => void
  /** Ref containing current playhead position (updated externally without re-renders) */
  playheadBeatRef: React.MutableRefObject<number>
  /** Whether sequencer is currently playing (controls RAF animation) */
  isPlaying: boolean
  /** Combined pan+zoom for time axis */
  panZoomTime: (anchorBeat: number, anchorRatio: number, zoomFactor: number) => void
  /** Combined pan+zoom for pitch axis */
  panZoomPitch: (anchorPitch: number, anchorRatio: number, zoomFactor: number) => void
  /** Pan time (for horizontal scroll) */
  panTime: (deltaBeats: number) => void
  /** Pan pitch (for vertical scroll) */
  panPitch: (deltaNotes: number) => void
  /** Loop start position in beats (for dimming notes outside) */
  loopStart?: number
  /** Loop end position in beats (for dimming notes outside) */
  loopEnd?: number
}

// ============ Component ============

export function PianoRollGrid({
  clip,
  onClipChange,
  viewport,
  gridWidth,
  gridHeight,
  noteHeight,
  snapToBeat,
  selection,
  onSelectionChange,
  playheadBeatRef,
  isPlaying,
  panZoomTime,
  panZoomPitch,
  panTime,
  panPitch,
  loopStart = 0,
  loopEnd,
}: PianoRollGridProps) {
  const { semantic } = useChronicleTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // D3 scales for coordinate conversion
  const scales = usePianoRollScales({
    viewport,
    gridWidth,
    gridHeight,
    snapToBeat,
  })

  // D3 brush for rectangular selection
  const { brushPreviewIds } = useD3Brush({
    svgRef,
    clip,
    scales,
    selection,
    onSelectionChange,
  })

  // D3 grid line rendering
  useD3Grid({
    svgRef,
    scales,
    viewport,
    theme: {
      border: {
        default: semantic.border.default,
        subtle: semantic.border.subtle,
      },
    },
  })

  // D3 notes rendering
  useD3Notes({
    svgRef,
    notes: clip.notes,
    scales,
    viewport,
    selection,
    brushPreviewIds,
    loopStart,
    loopEnd: loopEnd ?? clip.length,
    theme: {
      accent: {
        primary: semantic.accent.primary,
        primaryHover: semantic.accent.primaryHover,
        primaryPressed: semantic.accent.primaryPressed,
      },
    },
  })

  // D3 drag behavior for notes
  useD3NoteDrag({
    svgRef,
    clip,
    onClipChange,
    scales,
    selection,
    onSelectionChange,
    snapToBeat,
  })

  // RAF-based playhead animation (bypasses React for 60fps performance)
  usePlayheadAnimation({
    svgRef,
    playheadBeatRef,
    isPlaying,
    beatToX: scales.beatToX,
    viewport: { startBeat: viewport.startBeat, endBeat: viewport.endBeat },
    gridHeight,
    color: semantic.semantic.error,
  })

  // D3 zoom/pan (pinch-to-zoom, wheel, trackpad gestures)
  useD3Zoom({
    containerRef: svgRef,
    viewport,
    gridWidth,
    gridHeight,
    panZoomTime,
    panZoomPitch,
    panTime,
    panPitch,
  })

  // Loop region background and marker lines
  useD3Overlays({
    svgRef,
    scales,
    viewport,
    gridWidth,
    gridHeight,
    loopStart,
    loopEnd: loopEnd ?? clip.length,
    theme: {
      accent: {
        primary: semantic.accent.primary,
        primaryMuted: semantic.accent.primaryMuted,
      },
    },
  })

  // Handle delete key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.size > 0) {
          onClipChange({
            ...clip,
            notes: clip.notes.filter((n) => !selection.has(n.id)),
          })
          onSelectionChange(new Set())
        }
      }
    },
    [clip, onClipChange, selection, onSelectionChange]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        width={gridWidth}
        height={gridHeight}
        style={{ display: 'block' }}
      />
    </Box>
  )
}
