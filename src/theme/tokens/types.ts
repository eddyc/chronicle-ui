/**
 * Chronicle UI Token Types
 */

export type ThemeMode = 'light' | 'dark'

// Re-export token types
export type { PrimitiveTokens } from './primitives'
export type { GradientTokens } from './gradients'
export type { SemanticTokens } from './semantic'
export type { ComponentTokens } from './components'

// Full theme tokens object
export interface ChronicleThemeTokens {
  mode: ThemeMode
  semantic: import('./semantic').SemanticTokens
  components: import('./components').ComponentTokens
}

// Augment MUI theme to include Chronicle tokens
declare module '@mui/material/styles' {
  interface Theme {
    chronicle: ChronicleThemeTokens
  }
  interface ThemeOptions {
    chronicle?: Partial<ChronicleThemeTokens>
  }
}
