/**
 * DSP Graph Types
 *
 * Types for representing DSP instruction graphs.
 */

import type { Instruction, Arg } from '@eddyc/chronicle-dsl'

/**
 * Opcode categories for visual styling
 */
export type OpcodeCategory =
  | 'oscillator'
  | 'filter'
  | 'envelope'
  | 'math'
  | 'output'
  | 'voice'
  | 'midi'
  | 'table'
  | 'analysis'
  | 'unknown'

/**
 * A node in the DSP graph
 */
export interface DSPNode {
  /** Unique node ID (same as instruction ID) */
  id: string
  /** Opcode name */
  op: string
  /** Visual category for coloring */
  category: OpcodeCategory
  /** Original instruction args */
  args: Arg[]
  /** Position (set by layout algorithm) */
  x?: number
  y?: number
  /** Real-time activity level (0-1) for glow effect */
  activity?: number
}

/**
 * An edge in the DSP graph (signal connection)
 */
export interface DSPEdge {
  /** Source node ID */
  source: string
  /** Target node ID */
  target: string
  /** Output index for multi-output opcodes */
  outputIndex?: number
}

/**
 * The complete DSP graph
 */
export interface DSPGraph {
  nodes: DSPNode[]
  edges: DSPEdge[]
}

/**
 * Category colors for node styling
 */
export const CATEGORY_COLORS: Record<OpcodeCategory, string> = {
  oscillator: '#4ECDC4', // Teal
  filter: '#9B59B6',     // Purple
  envelope: '#2ECC71',   // Green
  math: '#3498DB',       // Blue
  output: '#E74C3C',     // Red
  voice: '#F39C12',      // Orange
  midi: '#E91E63',       // Pink
  table: '#00BCD4',      // Cyan
  analysis: '#795548',   // Brown
  unknown: '#95A5A6',    // Gray
}

/**
 * Categorize an opcode by its name
 */
export function categorizeOpcode(op: string): OpcodeCategory {
  // Oscillators
  if (['phasor', 'oscil', 'vco2', 'phasor2', 'saw', 'square', 'pulse'].includes(op)) {
    return 'oscillator'
  }

  // Filters
  if (['moogladder', 'lpf', 'tone', 'atone', 'reson', 'svf', 'ladder'].includes(op)) {
    return 'filter'
  }

  // Envelopes
  if (['adsr', 'env', 'linen', 'expon', 'line'].includes(op)) {
    return 'envelope'
  }

  // Math operations
  if (['add', 'sub', 'mul', 'div', 'mix', 'scale', 'clip', 'wrap', 'abs'].includes(op)) {
    return 'math'
  }

  // Output
  if (['out', 'audio'].includes(op)) {
    return 'output'
  }

  // Voice parameters
  if (['voice_freq', 'voice_gate', 'voice_vel', 'voiceFreq', 'voiceGate', 'voiceVel'].includes(op)) {
    return 'voice'
  }

  // MIDI
  if (['midi_freq', 'midi_gate', 'midi_vel', 'midi_cc'].includes(op)) {
    return 'midi'
  }

  // Tables
  if (['table', 'ftgen', 'tablei', 'tableikt'].includes(op)) {
    return 'table'
  }

  // Analysis
  if (['rms', 'peak', 'zcr', 'follow'].includes(op)) {
    return 'analysis'
  }

  return 'unknown'
}

/**
 * Convert instructions to a DSP graph
 */
export function instructionsToGraph(instructions: Instruction[]): DSPGraph {
  const nodes: DSPNode[] = instructions.map((inst) => ({
    id: inst.id,
    op: inst.op,
    category: categorizeOpcode(inst.op),
    args: inst.args,
  }))

  const edges: DSPEdge[] = []

  for (const inst of instructions) {
    for (const arg of inst.args) {
      if (arg.type === 'ref') {
        edges.push({
          source: arg.refId,
          target: inst.id,
        })
      }
    }
  }

  return { nodes, edges }
}
