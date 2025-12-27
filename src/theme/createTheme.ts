import { createTheme as muiCreateTheme, type ThemeOptions } from '@mui/material/styles'
import {
  primitives,
  createSemanticTokens,
  createComponentTokens,
  type ThemeMode,
  type ChronicleThemeTokens,
} from './tokens'

const { rainbow } = primitives

/**
 * Create a Chronicle-themed MUI theme with light/dark mode support
 *
 * @param mode - 'light' or 'dark' theme mode
 * @param options - Optional MUI theme overrides
 */
export function createChronicleTheme(
  mode: ThemeMode = 'dark',
  options?: ThemeOptions
) {
  const semantic = createSemanticTokens(mode)
  const components = createComponentTokens(semantic, mode)

  const chronicle: ChronicleThemeTokens = {
    mode,
    semantic,
    components,
  }

  return muiCreateTheme({
    palette: {
      mode,
      primary: {
        main: semantic.accent.primary,
        light: rainbow.lime,
        dark: rainbow.orange,
      },
      secondary: {
        main: semantic.accent.secondary,
        light: rainbow.pink,
        dark: rainbow.purple,
      },
      error: {
        main: semantic.semantic.error,
      },
      warning: {
        main: semantic.semantic.warning,
      },
      success: {
        main: semantic.semantic.success,
      },
      info: {
        main: semantic.semantic.info,
      },
      background: {
        default: semantic.background.page,
        paper: semantic.background.surface,
      },
      text: {
        primary: semantic.text.primary,
        secondary: semantic.text.secondary,
        disabled: semantic.text.muted,
      },
      divider: semantic.border.subtle,
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
            backgroundColor: semantic.background.page,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: semantic.background.surface,
            borderRight: `1px solid ${semantic.border.subtle}`,
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
              backgroundColor: semantic.background.elevated,
            },
            '&.Mui-selected': {
              backgroundColor: components.sidebar.itemSelected,
              '&:hover': {
                backgroundColor: components.sidebar.itemSelected,
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
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
    },
    // Attach Chronicle tokens to theme for access via useTheme()
    chronicle,
    ...options,
  })
}

/** Default dark theme instance */
export const theme = createChronicleTheme('dark')

/** Light theme instance */
export const lightTheme = createChronicleTheme('light')
