/**
 * Chronicle UI Gradient Tokens
 * Peter Max-inspired rainbow gradients
 */

import { primitives } from './primitives'

const { rainbow } = primitives

export const gradients = {
  // Full rainbow spectrum
  rainbow: {
    horizontal: `linear-gradient(90deg, ${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow}, ${rainbow.green}, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.purple}, ${rainbow.magenta})`,
    vertical: `linear-gradient(180deg, ${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow}, ${rainbow.green}, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.purple}, ${rainbow.magenta})`,
    diagonal: `linear-gradient(135deg, ${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow}, ${rainbow.green}, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.purple}, ${rainbow.magenta})`,
    circular: `conic-gradient(${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow}, ${rainbow.green}, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.purple}, ${rainbow.magenta}, ${rainbow.red})`,
    radial: `radial-gradient(circle, ${rainbow.yellow}, ${rainbow.orange}, ${rainbow.magenta}, ${rainbow.purple})`,
  },

  // Warm sunset (red → yellow)
  sunset: {
    horizontal: `linear-gradient(90deg, ${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow})`,
    vertical: `linear-gradient(180deg, ${rainbow.red}, ${rainbow.orange}, ${rainbow.yellow})`,
  },

  // Cool ocean (cyan → purple)
  ocean: {
    horizontal: `linear-gradient(90deg, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.indigo}, ${rainbow.purple})`,
    vertical: `linear-gradient(180deg, ${rainbow.cyan}, ${rainbow.blue}, ${rainbow.indigo}, ${rainbow.purple})`,
  },

  // Cosmic (magenta → cyan)
  cosmic: {
    horizontal: `linear-gradient(90deg, ${rainbow.magenta}, ${rainbow.purple}, ${rainbow.indigo}, ${rainbow.cyan})`,
    vertical: `linear-gradient(180deg, ${rainbow.magenta}, ${rainbow.purple}, ${rainbow.indigo}, ${rainbow.cyan})`,
    radial: `radial-gradient(circle, ${rainbow.cyan}, ${rainbow.purple}, ${rainbow.magenta})`,
  },

  // Nature (green → yellow)
  nature: {
    horizontal: `linear-gradient(90deg, ${rainbow.green}, ${rainbow.lime}, ${rainbow.yellow})`,
    vertical: `linear-gradient(180deg, ${rainbow.green}, ${rainbow.lime}, ${rainbow.yellow})`,
  },
} as const

export type GradientTokens = typeof gradients
