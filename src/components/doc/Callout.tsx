import { Box, Paper } from '@mui/material'
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Lightbulb as TipIcon,
} from '@mui/icons-material'
import { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'tip'

interface CalloutProps {
  type?: CalloutType
  children: ReactNode
}

const calloutStyles: Record<CalloutType, { icon: typeof InfoIcon; color: string; bg: string }> = {
  info: {
    icon: InfoIcon,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  warning: {
    icon: WarningIcon,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  tip: {
    icon: TipIcon,
    color: '#00d4aa',
    bg: 'rgba(0, 212, 170, 0.1)',
  },
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const style = calloutStyles[type]
  const Icon = style.icon

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        mb: 3,
        backgroundColor: style.bg,
        border: `1px solid ${style.color}33`,
        borderRadius: 1,
      }}
    >
      <Icon sx={{ color: style.color, flexShrink: 0, mt: 0.25 }} />
      <Box
        sx={{
          color: 'text.secondary',
          lineHeight: 1.6,
          '& p': { m: 0 },
          '& code': {
            backgroundColor: 'rgba(0, 212, 170, 0.1)',
            color: 'primary.main',
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
