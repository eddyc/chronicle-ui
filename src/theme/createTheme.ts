import { createTheme as muiCreateTheme, type ThemeOptions } from '@mui/material/styles'
import { colors } from './colors'

/**
 * Create a Chronicle-themed MUI theme
 * Optionally override any theme options
 */
export function createChronicleTheme(options?: ThemeOptions) {
  return muiCreateTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: colors.amber,
        light: '#F0BC5A',
        dark: '#C89020',
      },
      background: {
        default: colors.panelBlack,
        paper: colors.panelDark,
      },
      text: {
        primary: colors.cream,
        secondary: colors.warmGray,
      },
    },
    typography: {
      fontFamily: '"Nunito", sans-serif',
      h1: {
        fontFamily: '"Righteous", sans-serif',
        fontSize: '2.25rem',
        fontWeight: 400,
        letterSpacing: '0.02em',
      },
      h2: {
        fontFamily: '"Righteous", sans-serif',
        fontSize: '1.5rem',
        fontWeight: 400,
      },
      h3: {
        fontFamily: '"Righteous", sans-serif',
        fontSize: '1.1rem',
        fontWeight: 400,
      },
      body1: {
        fontSize: '0.9rem',
        lineHeight: 1.7,
      },
      body2: {
        fontSize: '0.8rem',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.75rem',
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: colors.panelBlack,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.panelDark,
            borderRight: `1px solid ${colors.panelLight}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            margin: '1px 8px',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: colors.panelLight,
            },
            '&.Mui-selected': {
              backgroundColor: colors.panelLight,
              '&:hover': {
                backgroundColor: colors.panelLight,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    ...options,
  })
}

/** Default Chronicle theme instance */
export const theme = createChronicleTheme()
