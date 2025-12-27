/**
 * Hook to access Chronicle theme tokens
 */

import { useTheme } from '@mui/material/styles'
import type { ChronicleThemeTokens } from '../theme/tokens'

/**
 * Access Chronicle design tokens from the current theme
 *
 * @example
 * const { semantic, components } = useChronicleTheme()
 * <Box sx={{ color: semantic.accent.primary }} />
 */
export function useChronicleTheme(): ChronicleThemeTokens {
  const theme = useTheme()
  return theme.chronicle
}

/**
 * Access just the semantic tokens
 */
export function useSemanticTokens() {
  return useChronicleTheme().semantic
}

/**
 * Access just the component tokens
 */
export function useComponentTokens() {
  return useChronicleTheme().components
}
