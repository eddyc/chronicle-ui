import { Paper, Box, Typography } from '@mui/material'
import { PlayArrow as PlayIcon } from '@mui/icons-material'
import { ReactNode } from 'react'

interface LiveDemoProps {
  children: ReactNode
  title?: string
}

export function LiveDemo({ children, title }: LiveDemoProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        backgroundColor: 'background.paper',
        border: '1px solid rgba(0, 212, 170, 0.2)',
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
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(0, 212, 170, 0.05)',
        }}
      >
        <PlayIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'primary.main',
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
