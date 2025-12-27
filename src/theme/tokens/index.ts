/**
 * Chronicle UI Design Tokens
 * 3-layer token architecture: primitives → semantic → components
 */

// Layer 1: Primitives (raw values)
export { primitives, type PrimitiveTokens } from './primitives'

// Gradients (derived from primitives)
export { gradients, type GradientTokens } from './gradients'

// Layer 2: Semantic (theme-dependent)
export { createSemanticTokens, type SemanticTokens } from './semantic'

// Layer 3: Component (component-specific)
export { createComponentTokens, type ComponentTokens } from './components'

// Types
export type { ThemeMode, ChronicleThemeTokens } from './types'
