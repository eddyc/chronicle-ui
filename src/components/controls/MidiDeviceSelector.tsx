import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  type SelectChangeEvent,
} from '@mui/material'
import { Piano, Refresh } from '@mui/icons-material'
import { useChronicleTheme } from '../../hooks'

/**
 * MIDI device descriptor
 * Matches the MidiDevice type from @eddyc/chronicle-client
 */
export interface MidiDevice {
  id: string
  name: string
  manufacturer?: string
}

export interface MidiDeviceSelectorProps {
  /** Whether MIDI is available on this platform */
  available: boolean
  /** Whether MIDI access has been granted */
  accessGranted: boolean
  /** List of available MIDI devices */
  devices: MidiDevice[]
  /** Currently selected device */
  selectedDevice: MidiDevice | null
  /** Callback to request MIDI access */
  onRequestAccess: () => Promise<boolean>
  /** Callback when device selection changes */
  onDeviceChange: (deviceId: string | null) => void
  /** Show connection status chip (default: true) */
  showStatus?: boolean
  /** Custom label (default: 'MIDI Input') */
  label?: string
  /** Size variant */
  size?: 'small' | 'medium'
}

/**
 * MidiDeviceSelector - Dropdown for selecting MIDI input devices
 *
 * Features:
 * - Request MIDI access button if not granted
 * - Dropdown with available devices
 * - "None" option to disable MIDI input
 * - Connection status indicator
 * - Refresh when devices change
 *
 * @example
 * ```tsx
 * import { MidiDeviceSelector } from '@eddyc/chronicle-ui'
 * import { useMidi } from '@eddyc/chronicle-client'
 *
 * function MyComponent() {
 *   const {
 *     available,
 *     accessGranted,
 *     devices,
 *     selectedDevice,
 *     requestAccess,
 *     selectDevice,
 *   } = useMidi()
 *
 *   return (
 *     <MidiDeviceSelector
 *       available={available}
 *       accessGranted={accessGranted}
 *       devices={devices}
 *       selectedDevice={selectedDevice}
 *       onRequestAccess={requestAccess}
 *       onDeviceChange={selectDevice}
 *     />
 *   )
 * }
 * ```
 */
export function MidiDeviceSelector({
  available,
  accessGranted,
  devices,
  selectedDevice,
  onRequestAccess,
  onDeviceChange,
  showStatus = true,
  label = 'MIDI Input',
  size = 'small',
}: MidiDeviceSelectorProps) {
  const { semantic } = useChronicleTheme()
  const [requesting, setRequesting] = useState(false)

  // Not available on this platform
  if (!available) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Piano sx={{ color: semantic.text.muted, fontSize: 20 }} />
        <Chip
          label="MIDI not available"
          size="small"
          sx={{
            backgroundColor: semantic.background.elevated,
            color: semantic.text.muted,
          }}
        />
      </Box>
    )
  }

  // Need to request access
  if (!accessGranted) {
    const handleRequest = async () => {
      setRequesting(true)
      try {
        await onRequestAccess()
      } finally {
        setRequesting(false)
      }
    }

    return (
      <Button
        variant="outlined"
        size={size}
        startIcon={<Piano />}
        onClick={handleRequest}
        disabled={requesting}
        sx={{
          borderColor: semantic.border.default,
          color: semantic.text.secondary,
          '&:hover': {
            borderColor: semantic.accent.primary,
            color: semantic.accent.primary,
          },
        }}
      >
        {requesting ? 'Requesting...' : 'Enable MIDI'}
      </Button>
    )
  }

  // Access granted - show device selector
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value
    onDeviceChange(value === '' ? null : value)
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FormControl size={size} sx={{ minWidth: 180 }}>
        <InputLabel
          id="midi-device-label"
          sx={{ color: semantic.text.secondary }}
        >
          {label}
        </InputLabel>
        <Select
          labelId="midi-device-label"
          value={selectedDevice?.id ?? ''}
          onChange={handleChange}
          label={label}
          sx={{
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: semantic.border.default,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: semantic.border.strong,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: semantic.accent.primary,
            },
          }}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {devices.map((device) => (
            <MenuItem key={device.id} value={device.id}>
              {device.name}
              {device.manufacturer && (
                <Box
                  component="span"
                  sx={{ color: semantic.text.muted, ml: 1 }}
                >
                  ({device.manufacturer})
                </Box>
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showStatus && (
        <Chip
          icon={<Piano sx={{ fontSize: 16 }} />}
          label={selectedDevice ? 'Connected' : 'No device'}
          size="small"
          sx={{
            backgroundColor: selectedDevice
              ? semantic.accent.primaryMuted
              : semantic.background.elevated,
            color: selectedDevice
              ? semantic.accent.primary
              : semantic.text.muted,
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      )}

      {devices.length === 0 && (
        <Chip
          icon={<Refresh sx={{ fontSize: 14 }} />}
          label="No devices found"
          size="small"
          sx={{
            backgroundColor: semantic.background.elevated,
            color: semantic.text.muted,
          }}
        />
      )}
    </Box>
  )
}
