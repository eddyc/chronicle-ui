import { Typography as MuiTypography, Box } from '@mui/material'
import { ReactNode } from 'react'
import { useChronicleTheme } from '../../hooks'

interface TypographyProps {
  children: ReactNode
}

export function H1({ children }: TypographyProps) {
  const { semantic } = useChronicleTheme()
  return (
    <MuiTypography
      variant="h1"
      sx={{
        mt: 0,
        mb: 3,
        color: semantic.text.primary,
        fontWeight: 400,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function H2({ children }: TypographyProps) {
  const { semantic } = useChronicleTheme()
  return (
    <MuiTypography
      variant="h2"
      sx={{
        mt: 5,
        mb: 2,
        color: semantic.text.primary,
        fontWeight: 400,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function H3({ children }: TypographyProps) {
  const { semantic } = useChronicleTheme()
  return (
    <MuiTypography
      variant="h3"
      sx={{
        mt: 4,
        mb: 1.5,
        color: semantic.text.primary,
        fontWeight: 400,
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function P({ children }: TypographyProps) {
  const { semantic } = useChronicleTheme()
  return (
    <MuiTypography
      variant="body1"
      sx={{
        mb: 2,
        color: semantic.text.secondary,
        lineHeight: 1.8,
        '& code': {
          backgroundColor: semantic.background.elevated,
          color: semantic.accent.primary,
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: '0.85em',
          fontFamily: '"JetBrains Mono", monospace',
        },
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function Code({ children }: TypographyProps) {
  const { semantic } = useChronicleTheme()
  return (
    <Box
      component="code"
      sx={{
        backgroundColor: semantic.background.elevated,
        color: semantic.accent.primary,
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        fontSize: '0.85em',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {children}
    </Box>
  )
}

interface ULProps {
  children: ReactNode
}

export function UL({ children }: ULProps) {
  const { semantic } = useChronicleTheme()
  return (
    <Box
      component="ul"
      sx={{
        mb: 2,
        pl: 3,
        color: semantic.text.secondary,
        lineHeight: 1.8,
        '& li': {
          mb: 0.75,
          '&::marker': {
            color: semantic.accent.primary,
          },
        },
        '& strong': {
          color: semantic.text.primary,
          fontWeight: 600,
        },
        '& code': {
          backgroundColor: semantic.background.elevated,
          color: semantic.accent.primary,
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: '0.85em',
          fontFamily: '"JetBrains Mono", monospace',
        },
      }}
    >
      {children}
    </Box>
  )
}
