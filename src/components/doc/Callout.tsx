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

export function Callout({ type = 'info', children }: CalloutProps) {
  const { semantic } = useChronicleTheme()
  const callout = semantic.callout[type]
  const Icon = icons[type]

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        mb: 3,
        backgroundColor: callout.bg,
        border: `1px solid ${callout.border}33`,
        borderRadius: 1,
      }}
    >
      <Icon sx={{ color: callout.icon, flexShrink: 0, mt: 0.25 }} />
      <Box
        sx={{
          color: semantic.text.secondary,
          lineHeight: 1.6,
          '& p': { m: 0 },
          '& code': {
            backgroundColor: `${semantic.accent.tertiary}15`,
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
