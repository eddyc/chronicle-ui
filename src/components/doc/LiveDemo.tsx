import { Paper, Box, Typography } from '@mui/material'
import { PlayArrow as PlayIcon } from '@mui/icons-material'
import { ReactNode } from 'react'
import { useChronicleTheme } from '../../hooks/useChronicleTheme'

interface LiveDemoProps {
  children: ReactNode
  title?: string
}

export function LiveDemo({ children, title }: LiveDemoProps) {
  const { components, semantic } = useChronicleTheme()

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        backgroundColor: components.liveDemo.background,
        border: `1px solid ${components.liveDemo.border}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: `1px solid ${semantic.border.subtle}`,
          backgroundColor: components.liveDemo.headerBackground,
        }}
      >
        <PlayIcon sx={{ fontSize: 16, color: components.liveDemo.headerText }} />
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: components.liveDemo.headerText,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {title || 'Live Demo'}
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  )
}
