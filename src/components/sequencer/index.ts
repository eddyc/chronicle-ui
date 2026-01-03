// Main components
export { PianoRoll, type PianoRollProps } from './PianoRoll'
export { PianoKeyboard, type PianoKeyboardProps } from './PianoKeyboard'
export { PianoRollGrid, type PianoRollGridProps } from './PianoRollGrid'
export { TimelineRuler, type TimelineRulerProps } from './TimelineRuler'
export { MiniTransport, type MiniTransportProps } from './MiniTransport'

// Zoom strips
export {
  PitchZoomStrip,
  PITCH_ZOOM_STRIP_WIDTH,
  type PitchZoomStripProps,
} from './PitchZoomStrip'
export {
  TimeZoomStrip,
  TIME_ZOOM_STRIP_HEIGHT,
  type TimeZoomStripProps,
} from './TimeZoomStrip'

// Hooks
export {
  usePianoRollScales,
  type PianoRollScales,
  type UsePianoRollScalesOptions,
} from './hooks'

// D3 hooks
export {
  useD3Grid,
  useD3Notes,
  useD3NoteDrag,
  useD3Brush,
  useD3Overlays,
  useD3Zoom,
  type BrushRect,
} from './d3'

// Utilities
export {
  // Constants
  NOTE_NAMES,
  DEFAULT_VISIBLE_BEATS,
  DEFAULT_SNAP_TO_BEAT,
  KEY_WIDTH,
  DEFAULT_LOW_NOTE,
  DEFAULT_HIGH_NOTE,
  DEFAULT_VELOCITY,
  // MIDI helpers
  midiToNoteName,
  isBlackKey,
  // Grid helpers
  snap,
  createNoteId,
  // Grid density
  calculateGridStep,
  classifyBeat,
  generateBeatColumns,
  generatePitchRows,
  type GridLevel,
  type GridColumn,
} from './utils/pianoRollHelpers'
