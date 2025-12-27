import { Box, Paper, Typography } from '@mui/material'
import { ReactNode } from 'react'
import { useChronicleTheme } from '../../hooks'

interface CardProps {
  title?: string
  description?: string
  children: ReactNode
}

/**
 * Generic card container with flat pop art styling
 */
export function Card({ title, description, children }: CardProps) {
  const { semantic, components } = useChronicleTheme()

  return (
    <Box>
      {/* Header */}
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography
              variant="h2"
              sx={{ color: semantic.text.primary, mb: description ? 0.5 : 0 }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" sx={{ color: semantic.text.secondary }}>
              {description}
            </Typography>
          )}
        </Box>
      )}

      {/* Panel - clean flat style */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: components.card.background,
          border: `1px solid ${components.card.border}`,
          borderRadius: 1,
        }}
      >
        {children}
      </Paper>
    </Box>
  )
}
