import { IconButton, Tooltip } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'
import { useThemeMode } from '../../providers/ThemeProvider'
import { useChronicleTheme } from '../../hooks'

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large'
}

/**
 * Theme toggle button for switching between light and dark modes
 */
export function ThemeToggle({ size = 'medium' }: ThemeToggleProps) {
  const { mode, toggleMode } = useThemeMode()
  const { semantic } = useChronicleTheme()

  const isDark = mode === 'dark'

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={toggleMode}
        size={size}
        sx={{
          color: semantic.accent.primary,
          transition: 'transform 0.2s ease',
          '&:hover': {
            transform: 'rotate(15deg)',
          },
        }}
      >
        {isDark ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  )
}
