/**
 * useD3DSPGraph - D3 hook for rendering DSP graphs
 *
 * Renders a node-link diagram representing the DSP signal flow.
 */

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { DSPNode, DSPEdge, DSPGraph } from './types'
import { CATEGORY_COLORS, categorizeOpcode } from './types'

interface UseD3DSPGraphOptions {
  /** SVG element ref */
  svgRef: React.RefObject<SVGSVGElement>
  /** The graph to render */
  graph: DSPGraph
  /** Width of the SVG */
  width: number
  /** Height of the SVG */
  height: number
  /** Real-time activity data (node ID -> activity 0-1) */
  activityData?: Map<string, number>
  /** Currently highlighted node */
  highlightedNode?: string | null
  /** Callback when a node is clicked */
  onNodeClick?: (nodeId: string) => void
}

/**
 * Simple hierarchical layout (outputs at top, sources at bottom)
 */
function layoutGraph(graph: DSPGraph, width: number, height: number): DSPGraph {
  const { nodes, edges } = graph

  // Build adjacency for topological levels
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const inDegree = new Map<string, number>()
  const outgoingEdges = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    outgoingEdges.set(node.id, [])
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    const outgoing = outgoingEdges.get(edge.source) || []
    outgoing.push(edge.target)
    outgoingEdges.set(edge.source, outgoing)
  }

  // Compute levels via BFS from sources
  const levels = new Map<string, number>()
  const queue: string[] = []

  for (const [id, deg] of inDegree) {
    if (deg === 0) {
      queue.push(id)
      levels.set(id, 0)
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const nodeLevel = levels.get(nodeId)!

    for (const targetId of outgoingEdges.get(nodeId) || []) {
      const currentLevel = levels.get(targetId)
      if (currentLevel === undefined || currentLevel < nodeLevel + 1) {
        levels.set(targetId, nodeLevel + 1)
      }
      const newInDegree = (inDegree.get(targetId) || 1) - 1
      inDegree.set(targetId, newInDegree)
      if (newInDegree === 0) {
        queue.push(targetId)
      }
    }
  }

  // Handle any remaining nodes (cycles or disconnected)
  for (const node of nodes) {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0)
    }
  }

  // Group by level
  const levelGroups = new Map<number, DSPNode[]>()
  let maxLevel = 0

  for (const node of nodes) {
    const level = levels.get(node.id) || 0
    maxLevel = Math.max(maxLevel, level)
    const group = levelGroups.get(level) || []
    group.push(node)
    levelGroups.set(level, group)
  }

  // Position nodes
  const padding = 40
  const levelHeight = maxLevel > 0 ? (height - padding * 2) / (maxLevel + 1) : height / 2

  for (const [level, nodesAtLevel] of levelGroups) {
    const y = padding + level * levelHeight
    const nodeWidth = (width - padding * 2) / (nodesAtLevel.length + 1)

    nodesAtLevel.forEach((node, i) => {
      node.x = padding + (i + 1) * nodeWidth
      node.y = y
    })
  }

  return { nodes, edges }
}

/**
 * D3 hook for rendering DSP graph
 */
export function useD3DSPGraph({
  svgRef,
  graph,
  width,
  height,
  activityData,
  highlightedNode,
  onNodeClick,
}: UseD3DSPGraphOptions) {
  const layoutRef = useRef<DSPGraph | null>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg || graph.nodes.length === 0) return

    // Layout the graph
    const layoutedGraph = layoutGraph(graph, width, height)
    layoutRef.current = layoutedGraph

    const { nodes, edges } = layoutedGraph

    // Create node lookup for edges
    const nodeById = new Map(nodes.map((n) => [n.id, n]))

    // Select SVG and clear
    const svgSel = d3.select(svg)
    svgSel.selectAll('*').remove()

    // Add defs for arrow markers
    const defs = svgSel.append('defs')

    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#666')

    // Add glow filter for activity
    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur')

    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Create main group
    const g = svgSel.append('g')

    // Draw edges
    g.selectAll('line.edge')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'edge')
      .attr('x1', (d) => nodeById.get(d.source)?.x || 0)
      .attr('y1', (d) => nodeById.get(d.source)?.y || 0)
      .attr('x2', (d) => nodeById.get(d.target)?.x || 0)
      .attr('y2', (d) => nodeById.get(d.target)?.y || 0)
      .attr('stroke', '#555')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)')

    // Draw nodes
    const nodeGroups = g
      .selectAll('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', onNodeClick ? 'pointer' : 'default')
      .on('click', (_, d) => {
        if (onNodeClick) {
          onNodeClick(d.id)
        }
      })

    // Node circles
    nodeGroups
      .append('circle')
      .attr('r', 20)
      .attr('fill', (d) => CATEGORY_COLORS[d.category])
      .attr('stroke', (d) => (d.id === highlightedNode ? '#fff' : '#333'))
      .attr('stroke-width', (d) => (d.id === highlightedNode ? 3 : 1.5))
      .attr('filter', (d) => {
        const activity = activityData?.get(d.id) || 0
        return activity > 0.1 ? 'url(#glow)' : 'none'
      })

    // Node labels
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-size', 9)
      .attr('font-family', 'monospace')
      .attr('font-weight', 600)
      .text((d) => d.op.slice(0, 6))

    // Node ID labels (below)
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 34)
      .attr('fill', '#888')
      .attr('font-size', 8)
      .attr('font-family', 'monospace')
      .text((d) => d.id.slice(0, 8))
  }, [svgRef, graph, width, height, highlightedNode, onNodeClick])

  // Update activity glow separately (for smoother animation)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !activityData) return

    const svgSel = d3.select(svg)

    svgSel.selectAll<SVGCircleElement, DSPNode>('g.node circle').attr('filter', (d) => {
      const activity = activityData.get(d.id) || 0
      return activity > 0.1 ? 'url(#glow)' : 'none'
    })
  }, [svgRef, activityData])
}
