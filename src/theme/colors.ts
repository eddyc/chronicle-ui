/**
 * Chronicle UI Color Palette
 * 70s Electronics Design System - warm amber accents with rich neutrals
 */

export const colors = {
  // Primary accent - warm amber (like vintage LED displays)
  amber: '#E8A93A',

  // Neutrals - clean hierarchy
  cream: '#F0E6D8',
  warmGray: '#9A918A',

  // Panel colors
  panelLight: '#3A3530',
  panelDark: '#252220',
  panelBlack: '#1A1816',

  // Hardware accents
  chrome: '#C8C4C0',
  bakelite: '#2A2624',
} as const

export type Colors = typeof colors
