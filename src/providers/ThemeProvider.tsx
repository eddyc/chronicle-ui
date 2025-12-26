import { ThemeProvider as MuiThemeProvider, CssBaseline, type Theme } from '@mui/material'
import { theme as defaultTheme } from '../theme'

interface ThemeProviderProps {
  children: React.ReactNode
  theme?: Theme
}

/**
 * Chronicle theme provider
 * Wraps MUI ThemeProvider with CssBaseline for consistent styling
 */
export function ThemeProvider({ children, theme = defaultTheme }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
