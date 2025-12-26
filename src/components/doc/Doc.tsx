import { Box } from '@mui/material'
import { ReactNode } from 'react'

interface DocProps {
  children: ReactNode
  maxWidth?: number
}

/**
 * Document wrapper component
 * Centers content with max-width and removes top margin from first child
 */
export function Doc({ children, maxWidth = 800 }: DocProps) {
  return (
    <Box
      sx={{
        maxWidth,
        mx: 'auto',
        '& > *:first-of-type': {
          mt: 0,
        },
      }}
    >
      {children}
    </Box>
  )
}
