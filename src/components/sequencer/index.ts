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
  usePianoRollDrag,
  type DragType,
  type DragState,
  type BrushRect,
  type UsePianoRollDragOptions,
  type UsePianoRollDragResult,
} from './hooks'

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
  // Coordinate conversion
  createCoordinateHelpers,
  type CoordinateHelpers,
  type CreateCoordinateHelpersOptions,
  // Grid density
  calculateGridStep,
  classifyBeat,
  generateBeatColumns,
  generatePitchRows,
  type GridLevel,
  type GridColumn,
} from './utils/pianoRollHelpers'
