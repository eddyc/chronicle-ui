/**
 * AccentBorder - Simple bordered wrapper with accent color
 *
 * Minimal replacement for RainbowBorder - uses single accent color
 * @deprecated Consider using simple CSS border instead
 */
import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { useChronicleTheme } from '../../hooks'

export type GradientType = 'accent' | 'neutral'

export interface RainbowBorderProps {
  children: ReactNode
  /** Border thickness in pixels (default: 1) */
  thickness?: number
  /** Border radius in pixels (default: 8) */
  borderRadius?: number
  /** Border style (default: accent) */
  gradient?: GradientType
  /** Direction (ignored in minimal design) */
  direction?: 'horizontal' | 'vertical' | 'diagonal'
}

export function RainbowBorder({
  children,
  thickness = 1,
  borderRadius = 8,
  gradient = 'accent',
}: RainbowBorderProps) {
  const { semantic } = useChronicleTheme()

  const borderColor = gradient === 'accent'
    ? semantic.accent.primary
    : semantic.border.default

  return (
    <Box
      sx={{
        border: `${thickness}px solid ${borderColor}`,
        borderRadius: `${borderRadius}px`,
        backgroundColor: semantic.background.surface,
      }}
    >
      {children}
    </Box>
  )
}
