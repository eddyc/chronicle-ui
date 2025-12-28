import { Box, Paper } from '@mui/material'
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material'
import { ReactNode } from 'react'
import { useChronicleTheme } from '../../hooks'

type CalloutType = 'info' | 'warning' | 'tip'

interface CalloutProps {
  type?: CalloutType
  children: ReactNode
}

const icons = {
  info: InfoIcon,
  warning: WarningIcon,
  tip: TipIcon,
}

/**
 * Minimal callout - single style with amber accent
 * No color variants - just a subtle box with accent icon
 */
export function Callout({ type = 'info', children }: CalloutProps) {
  const { semantic } = useChronicleTheme()
  const Icon = icons[type]

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        mb: 3,
        backgroundColor: semantic.callout.background,
        border: `1px solid ${semantic.callout.border}`,
        borderRadius: 1,
      }}
    >
      <Icon sx={{ color: semantic.callout.accent, flexShrink: 0, mt: 0.25 }} />
      <Box
        sx={{
          color: semantic.text.secondary,
          lineHeight: 1.6,
          '& p': { m: 0 },
          '& code': {
            backgroundColor: semantic.accent.primaryMuted,
            color: semantic.accent.primary,
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: '0.85em',
          },
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}
