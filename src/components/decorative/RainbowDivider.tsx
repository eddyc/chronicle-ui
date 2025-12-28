/**
 * Divider - Simple horizontal line for section separators
 *
 * Minimal replacement for RainbowDivider - uses border color
 * @deprecated Consider using MUI Divider instead
 */
import { Box } from '@mui/material'
import { useChronicleTheme } from '../../hooks'
import type { GradientType } from './RainbowBorder'

export interface RainbowDividerProps {
  /** Height/thickness in pixels (default: 1) */
  thickness?: number
  /** Style type (default: neutral) */
  gradient?: GradientType
  /** Vertical margin in MUI spacing units (default: 3) */
  my?: number
}

export function RainbowDivider({
  thickness = 1,
  gradient = 'neutral',
  my = 3,
}: RainbowDividerProps) {
  const { semantic } = useChronicleTheme()

  const color = gradient === 'accent'
    ? semantic.accent.primary
    : semantic.border.default

  return (
    <Box
      sx={{
        height: thickness,
        backgroundColor: color,
        borderRadius: thickness / 2,
        my,
      }}
    />
  )
}
