/**
 * Chronicle UI Color Palette
 *
 * @deprecated Use tokens from useChronicleTheme() hook instead.
 * This file provides backward compatibility with the old color system.
 *
 * Migration guide:
 * - colors.amber → semantic.accent.primary
 * - colors.cream → semantic.text.primary
 * - colors.warmGray → semantic.text.secondary
 * - colors.panelLight → semantic.border.default
 * - colors.panelDark → semantic.background.surface
 * - colors.panelBlack → semantic.background.page
 */

import { createSemanticTokens } from './tokens'

// Create dark mode tokens for backward compatibility
const darkTokens = createSemanticTokens('dark')

/**
 * @deprecated Use tokens from useChronicleTheme() hook instead
 */
export const colors = {
  // Primary accent
  amber: darkTokens.accent.primary,

  // Neutrals
  cream: darkTokens.text.primary,
  warmGray: darkTokens.text.secondary,

  // Panel colors
  panelLight: darkTokens.border.default,
  panelDark: darkTokens.background.surface,
  panelBlack: darkTokens.background.page,

  // Hardware accents (mapped to new system)
  chrome: darkTokens.text.secondary,
  bakelite: darkTokens.background.elevated,
} as const

export type Colors = typeof colors
