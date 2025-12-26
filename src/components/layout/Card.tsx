import { Box, Paper, Typography } from '@mui/material'
import { ReactNode } from 'react'
import { colors } from '../../theme'

interface CardProps {
  title?: string
  description?: string
  children: ReactNode
}

/**
 * Generic card container with Chronicle hardware aesthetic
 */
export function Card({ title, description, children }: CardProps) {
  return (
    <Box>
      {/* Header */}
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography
              variant="h2"
              sx={{ color: colors.cream, mb: description ? 0.5 : 0 }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography
              variant="body2"
              sx={{ color: colors.warmGray }}
            >
              {description}
            </Typography>
          )}
        </Box>
      )}

      {/* Panel - clean hardware aesthetic */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: colors.panelDark,
          border: `1px solid ${colors.panelLight}`,
          borderRadius: 1,
        }}
      >
        {children}
      </Paper>
    </Box>
  )
}
