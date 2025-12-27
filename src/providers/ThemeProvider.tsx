import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { createChronicleTheme } from '../theme'
import type { ThemeMode } from '../theme/tokens'

interface ThemeModeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

interface ThemeProviderProps {
  children: React.ReactNode
  /** Initial theme mode */
  defaultMode?: ThemeMode
  /** Follow system preference (prefers-color-scheme) */
  followSystem?: boolean
  /** Storage key for persisting mode preference */
  storageKey?: string
}

/**
 * Chronicle theme provider with light/dark mode support
 *
 * Features:
 * - Automatic system preference detection
 * - Persists user preference to localStorage
 * - Provides mode toggle via useThemeMode hook
 */
export function ThemeProvider({
  children,
  defaultMode = 'dark',
  followSystem = true,
  storageKey = 'chronicle-theme-mode',
}: ThemeProviderProps) {
  // Initialize from storage or system preference
  const [mode, setModeState] = useState<ThemeMode>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'light' || stored === 'dark') {
        return stored
      }
    }

    // Fall back to system preference if following system
    if (followSystem && typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }

    return defaultMode
  })

  // Listen for system preference changes
  useEffect(() => {
    if (!followSystem || typeof window === 'undefined') return

    // Only follow system if user hasn't set a preference
    const hasUserPreference = localStorage.getItem(storageKey) !== null

    if (hasUserPreference) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (e: MediaQueryListEvent) => {
      setModeState(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [followSystem, storageKey])

  // Persist mode changes
  const setMode = useCallback(
    (newMode: ThemeMode) => {
      setModeState(newMode)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newMode)
      }
    },
    [storageKey]
  )

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setMode])

  // Create theme based on current mode
  const theme = useMemo(() => createChronicleTheme(mode), [mode])

  const contextValue = useMemo(
    () => ({ mode, setMode, toggleMode }),
    [mode, setMode, toggleMode]
  )

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  )
}

/**
 * Hook to access and control theme mode
 *
 * @example
 * const { mode, toggleMode } = useThemeMode()
 * <button onClick={toggleMode}>{mode === 'dark' ? '🌙' : '☀️'}</button>
 */
export function useThemeMode() {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}
