/**
 * Chronicle UI Primitive Tokens
 * Peter Max / Yellow Submarine Pop Art Palette
 *
 * These are raw color values that never change between themes.
 * The rainbow spectrum is the signature of the pop art aesthetic.
 */

export const primitives = {
  // Rainbow spectrum - Peter Max signature colors
  rainbow: {
    red: '#FF3366', // Vibrant coral-red
    orange: '#FF6B35', // Electric orange
    yellow: '#FFD23F', // Sunny yellow
    lime: '#9BDE7E', // Fresh lime
    green: '#00D68F', // Emerald green
    teal: '#00CED1', // Cosmic teal
    cyan: '#00BFFF', // Electric cyan
    blue: '#4A90D9', // Sky blue
    indigo: '#6366F1', // Deep indigo
    purple: '#A855F7', // Vibrant purple
    magenta: '#EC4899', // Hot magenta
    pink: '#FF85A2', // Bubblegum pink
  },

  // Neutrals - warm undertones throughout
  neutral: {
    white: '#FFFFFF',
    cream: '#FFF8F0',
    sand: '#F5E6D3',
    warmGray50: '#FAF7F5',
    warmGray100: '#F0EBE6',
    warmGray200: '#E0D8D0',
    warmGray300: '#C4B8AB',
    warmGray400: '#9A918A',
    warmGray500: '#6B635C',
    warmGray600: '#4A4540',
    warmGray700: '#353230',
    warmGray800: '#252220',
    warmGray900: '#1A1816',
    black: '#0A0908',
  },

  // Transparency variants (for overlays, glows, shadows)
  alpha: {
    black10: 'rgba(10, 9, 8, 0.1)',
    black20: 'rgba(10, 9, 8, 0.2)',
    black40: 'rgba(10, 9, 8, 0.4)',
    black60: 'rgba(10, 9, 8, 0.6)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white40: 'rgba(255, 255, 255, 0.4)',
    white60: 'rgba(255, 255, 255, 0.6)',
  },
} as const

export type PrimitiveTokens = typeof primitives
