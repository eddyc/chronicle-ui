/**
 * DSPGraph - Visual representation of a DSP instruction graph
 *
 * Renders a node-link diagram showing signal flow between DSP operations.
 * Nodes are color-coded by category (oscillator, filter, envelope, etc.)
 * and can show real-time activity via glow effects.
 */

import { useRef, useMemo } from 'react'
import { Box } from '@mui/material'
import type { Instruction } from '@eddyc/chronicle-dsl'
import { useChronicleTheme } from '../../../hooks'
import { useD3DSPGraph } from './useD3DSPGraph'
import { instructionsToGraph, CATEGORY_COLORS, type OpcodeCategory } from './types'

export interface DSPGraphProps {
  /** Instructions to visualize */
  instructions: Instruction[]
  /** Width of the graph (default: 100%) */
  width?: number | string
  /** Height of the graph (default: 250) */
  height?: number
  /** Real-time activity data (signal ID -> activity level 0-1) */
  activityData?: Map<string, number>
  /** Currently highlighted node ID */
  highlightedNode?: string | null
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void
  /** Show legend (default: true) */
  showLegend?: boolean
}

/**
 * DSPGraph component
 *
 * Visualizes DSP instruction graphs as node-link diagrams.
 */
export function DSPGraph({
  instructions,
  width = '100%',
  height = 250,
  activityData,
  highlightedNode,
  onNodeClick,
  showLegend = true,
}: DSPGraphProps) {
  const { semantic } = useChronicleTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert instructions to graph
  const graph = useMemo(() => instructionsToGraph(instructions), [instructions])

  // Get unique categories for legend
  const usedCategories = useMemo(() => {
    const categories = new Set<OpcodeCategory>()
    for (const node of graph.nodes) {
      categories.add(node.category)
    }
    return Array.from(categories)
  }, [graph])

  // Calculate actual width for the SVG
  const svgWidth = typeof width === 'number' ? width : 500 // Default for percentage widths

  // Use the D3 hook for rendering
  useD3DSPGraph({
    svgRef,
    graph,
    width: svgWidth,
    height,
    activityData,
    highlightedNode,
    onNodeClick,
  })

  if (instructions.length === 0) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: semantic.background.sunken,
          border: `1px solid ${semantic.border.subtle}`,
          borderRadius: 1,
          color: semantic.text.muted,
          fontSize: '0.75rem',
        }}
      >
        No instructions to display
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width,
        backgroundColor: semantic.background.sunken,
        border: `1px solid ${semantic.border.subtle}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Graph SVG */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        style={{
          display: 'block',
        }}
        viewBox={`0 0 ${svgWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Legend */}
      {showLegend && usedCategories.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            px: 1.5,
            py: 1,
            borderTop: `1px solid ${semantic.border.subtle}`,
            backgroundColor: semantic.background.elevated,
          }}
        >
          {usedCategories.map((category) => (
            <Box
              key={category}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: CATEGORY_COLORS[category],
                }}
              />
              <Box
                component="span"
                sx={{
                  fontSize: '0.65rem',
                  color: semantic.text.secondary,
                  textTransform: 'capitalize',
                }}
              >
                {category}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
