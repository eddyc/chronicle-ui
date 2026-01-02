/**
 * MiniTransport - Compact transport controls for the sequencer
 *
 * Provides play/stop, tempo control, and playhead position display.
 */

import { Box, IconButton, TextField, Typography } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import { useChronicleTheme } from '../../hooks'

export interface MiniTransportProps {
  /** Whether playback is active */
  isPlaying: boolean
  /** Current tempo in BPM */
  tempo: number
  /** Current playhead position in beats */
  playheadBeat: number
  /** Called when play button is clicked */
  onPlay: () => void
  /** Called when stop button is clicked */
  onStop: () => void
  /** Called when tempo changes */
  onTempoChange: (bpm: number) => void
  /** Called when seeking to a beat position */
  onSeek?: (beat: number) => void
}

function formatBeatPosition(beat: number): string {
  const bars = Math.floor(beat / 4) + 1
  const beatInBar = (beat % 4) + 1
  const subBeat = Math.floor((beat % 1) * 4) + 1
  return `${bars}.${Math.floor(beatInBar)}.${subBeat}`
}

export function MiniTransport({
  isPlaying,
  tempo,
  playheadBeat,
  onPlay,
  onStop,
  onTempoChange,
}: MiniTransportProps) {
  const { semantic, components } = useChronicleTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 1,
        backgroundColor: semantic.background.surface,
        borderRadius: 1,
        border: `1px solid ${semantic.border.default}`,
      }}
    >
      {/* Play/Stop buttons */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <IconButton
          onClick={isPlaying ? onStop : onPlay}
          size="small"
          sx={{
            color: isPlaying ? semantic.semantic.error : semantic.accent.primary,
            backgroundColor: semantic.background.elevated,
            '&:hover': {
              backgroundColor: semantic.background.sunken,
            },
          }}
        >
          {isPlaying ? <StopIcon /> : <PlayArrowIcon />}
        </IconButton>
      </Box>

      {/* Position display */}
      <Box
        sx={{
          minWidth: 80,
          textAlign: 'center',
          fontFamily: 'monospace',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: semantic.text.primary,
          }}
        >
          {formatBeatPosition(playheadBeat)}
        </Typography>
      </Box>

      {/* Tempo control */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          type="number"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          size="small"
          inputProps={{
            min: 20,
            max: 300,
            step: 1,
            style: {
              width: 50,
              textAlign: 'center',
              padding: '4px 8px',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: semantic.background.elevated,
              '& fieldset': {
                borderColor: semantic.border.default,
              },
              '&:hover fieldset': {
                borderColor: semantic.border.strong,
              },
            },
            '& input': {
              color: semantic.text.primary,
              fontSize: '0.75rem',
            },
          }}
        />
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: semantic.text.secondary,
            textTransform: 'uppercase',
          }}
        >
          BPM
        </Typography>
      </Box>
    </Box>
  )
}
