/**
 * Piano roll utility functions
 *
 * Helper functions for MIDI note naming and grid snapping
 * used across piano roll components.
 */

// ============ Constants ============

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export const DEFAULT_VISIBLE_BEATS = 8
export const DEFAULT_SNAP_TO_BEAT = 0.25 // 1/16th note
export const KEY_WIDTH = 40
export const DEFAULT_LOW_NOTE = 36 // C2
export const DEFAULT_HIGH_NOTE = 84 // C6
export const DEFAULT_VELOCITY = 0.8

// ============ MIDI Helpers ============

/**
 * Convert MIDI note number to note name (e.g., 60 → "C4")
 */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const note = NOTE_NAMES[midi % 12]
  return `${note}${octave}`
}

/**
 * Check if a MIDI note is a black key
 */
export function isBlackKey(midi: number): boolean {
  const note = midi % 12
  return [1, 3, 6, 8, 10].includes(note)
}

// ============ Grid Helpers ============

/**
 * Snap a value to the nearest grid point
 */
export function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

/**
 * Create a unique note ID
 */
export function createNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ============ Grid Density ============

export type GridLevel = 'bar' | 'beat' | 'subbeat' | 'fine'

export interface GridColumn {
  beat: number
  level: GridLevel
}

/**
 * Calculate adaptive grid step based on zoom level
 */
export function calculateGridStep(pixelsPerBeat: number): number {
  if (pixelsPerBeat >= 120) {
    return 0.125 // 1/32nd notes when very zoomed in
  } else if (pixelsPerBeat >= 60) {
    return 0.25 // 1/16th notes
  } else if (pixelsPerBeat >= 30) {
    return 0.5 // 1/8th notes
  } else if (pixelsPerBeat >= 15) {
    return 1 // quarter notes (beats)
  } else {
    return 4 // bars only when very zoomed out
  }
}

/**
 * Classify a beat position for visual hierarchy
 */
export function classifyBeat(beat: number): GridLevel {
  const isBar = Math.abs(beat - Math.round(beat / 4) * 4) < 0.001
  const isBeat = Math.abs(beat - Math.round(beat)) < 0.001
  const isSubbeat = Math.abs(beat * 4 - Math.round(beat * 4)) < 0.001

  if (isBar) return 'bar'
  if (isBeat) return 'beat'
  if (isSubbeat) return 'subbeat'
  return 'fine'
}

/**
 * Generate beat columns for grid rendering
 */
export function generateBeatColumns(
  startBeat: number,
  endBeat: number,
  gridWidth: number
): GridColumn[] {
  const cols: GridColumn[] = []
  const beatsVisible = endBeat - startBeat
  const pixelsPerBeat = gridWidth / beatsVisible
  const gridStep = calculateGridStep(pixelsPerBeat)

  const firstBeat = Math.floor(startBeat / gridStep) * gridStep
  for (let beat = firstBeat; beat <= endBeat; beat += gridStep) {
    if (beat >= startBeat) {
      cols.push({ beat, level: classifyBeat(beat) })
    }
  }
  return cols
}

/**
 * Generate all pitch rows (0-127) for rendering
 */
export function generatePitchRows(): number[] {
  const rows = []
  for (let pitch = 127; pitch >= 0; pitch--) {
    rows.push(pitch)
  }
  return rows
}
