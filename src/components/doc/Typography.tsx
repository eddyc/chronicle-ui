import { Typography as MuiTypography, Box } from '@mui/material'
import { ReactNode } from 'react'
import { colors } from '../../theme'

interface TypographyProps {
  children: ReactNode
}

export function H1({ children }: TypographyProps) {
  return (
    <MuiTypography
      variant="h1"
      sx={{
        mt: 0,
        mb: 3,
        color: colors.cream,
        fontWeight: 400,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function H2({ children }: TypographyProps) {
  return (
    <MuiTypography
      variant="h2"
      sx={{
        mt: 5,
        mb: 2,
        color: colors.cream,
        fontWeight: 400,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function H3({ children }: TypographyProps) {
  return (
    <MuiTypography
      variant="h3"
      sx={{
        mt: 4,
        mb: 1.5,
        color: colors.cream,
        fontWeight: 400,
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </MuiTypography>
  )
}

export function P({ children }: TypographyProps) {
  return (
    <MuiTypography
      variant="body1"
      sx={{
        mb: 2,
        color: colors.warmGray,
        lineHeight: 1.8,
        '& code': {
          backgroundColor: colors.panelLight,
          color: colors.amber,
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
  return (
    <Box
      component="code"
      sx={{
        backgroundColor: colors.panelLight,
        color: colors.amber,
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
  return (
    <Box
      component="ul"
      sx={{
        mb: 2,
        pl: 3,
        color: colors.warmGray,
        lineHeight: 1.8,
        '& li': {
          mb: 0.75,
          '&::marker': {
            color: colors.amber,
          },
        },
        '& strong': {
          color: colors.cream,
          fontWeight: 600,
        },
        '& code': {
          backgroundColor: colors.panelLight,
          color: colors.amber,
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
