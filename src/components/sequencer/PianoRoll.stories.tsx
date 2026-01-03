/**
 * PianoRoll Storybook Stories
 *
 * Stories for developing and testing the PianoRoll component in isolation.
 */

import React, { useState, useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import { PianoRoll } from './PianoRoll'
import type { MidiClip } from '@eddyc/chronicle-client'

const meta: Meta<typeof PianoRoll> = {
  title: 'Sequencer/PianoRoll',
  component: PianoRoll,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof PianoRoll>

// Sample clip with some notes for testing
const sampleClip: MidiClip = {
  id: 'clip1',
  name: 'Demo Clip',
  length: 8,
  notes: [
    { id: 'n1', pitch: 60, startBeat: 0, duration: 1, velocity: 0.8 },
    { id: 'n2', pitch: 64, startBeat: 1, duration: 0.5, velocity: 0.7 },
    { id: 'n3', pitch: 67, startBeat: 2, duration: 2, velocity: 0.9 },
    { id: 'n4', pitch: 72, startBeat: 4, duration: 1, velocity: 0.6 },
    { id: 'n5', pitch: 65, startBeat: 5, duration: 1.5, velocity: 0.75 },
    { id: 'n6', pitch: 62, startBeat: 6.5, duration: 1, velocity: 0.85 },
  ],
}

// Long clip for testing pan/scroll
const longClip: MidiClip = {
  id: 'long-clip',
  name: 'Long Clip',
  length: 32,
  notes: Array.from({ length: 32 }, (_, i) => ({
    id: `note-${i}`,
    pitch: 48 + (i % 24),
    startBeat: i,
    duration: 0.5,
    velocity: 0.5 + (i % 5) * 0.1,
  })),
}

// Helper component that manages clip state
function PianoRollWithState(
  props: Partial<React.ComponentProps<typeof PianoRoll>> & { initialClip?: MidiClip }
) {
  const { initialClip = sampleClip, ...rest } = props
  const [clip, setClip] = useState<MidiClip>(initialClip)

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <PianoRoll clip={clip} onClipChange={setClip} height={400} {...rest} />
    </Box>
  )
}

// Helper for playhead animation
function PianoRollWithPlayhead(
  props: Partial<React.ComponentProps<typeof PianoRoll>> & { initialClip?: MidiClip }
) {
  const { initialClip = sampleClip, ...rest } = props
  const [clip, setClip] = useState<MidiClip>(initialClip)
  const [playhead, setPlayhead] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setPlayhead((prev) => (prev + 0.05) % clip.length)
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying, clip.length])

  return (
    <Box sx={{ width: '100%', maxWidth: 900 }}>
      <Box sx={{ mb: 1, display: 'flex', gap: 2 }}>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span>Beat: {playhead.toFixed(2)}</span>
      </Box>
      <PianoRoll
        clip={clip}
        onClipChange={setClip}
        playheadBeat={playhead}
        height={400}
        {...rest}
      />
    </Box>
  )
}

/**
 * Default piano roll with sample notes.
 * Test: Create, move, resize notes.
 */
export const Default: Story = {
  render: () => <PianoRollWithState />,
}

/**
 * Empty clip for testing note creation.
 * Test: Click and drag to create notes.
 */
export const EmptyClip: Story = {
  render: () => (
    <PianoRollWithState
      initialClip={{ id: 'empty', name: 'Empty Clip', length: 4, notes: [] }}
    />
  ),
}

/**
 * Long clip (32 bars) for testing pan/scroll.
 * Test: Two-finger scroll to pan, timeline drag to scroll/zoom.
 */
export const LongClip: Story = {
  render: () => <PianoRollWithState initialClip={longClip} />,
}

/**
 * Animated playhead for transport integration.
 * Test: Playhead follows transport position.
 */
export const WithPlayhead: Story = {
  render: () => <PianoRollWithPlayhead />,
}

/**
 * Selection testing.
 * Test: Click notes to select, shift-click to multi-select.
 */
export const Selection: Story = {
  render: () => {
    const [selection, setSelection] = useState<Set<string>>(new Set(['n1', 'n3']))
    const [clip, setClip] = useState<MidiClip>(sampleClip)

    return (
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        <Box sx={{ mb: 1 }}>
          Selected: {Array.from(selection).join(', ') || 'none'}
        </Box>
        <PianoRoll
          clip={clip}
          onClipChange={setClip}
          selectedNoteIds={selection}
          onSelectionChange={setSelection}
          height={400}
        />
      </Box>
    )
  },
}

/**
 * Different visible beats setting.
 * Test: Zoom level affects beat display.
 */
export const ZoomedIn: Story = {
  render: () => <PianoRollWithState visibleBeats={4} />,
}

/**
 * Wide view with more visible beats.
 * Test: Zoomed out view.
 */
export const ZoomedOut: Story = {
  render: () => <PianoRollWithState visibleBeats={16} />,
}

/**
 * Custom note range (bass register).
 * Test: Different MIDI note range.
 */
export const BassRange: Story = {
  render: () => (
    <PianoRollWithState
      lowNote={24}
      highNote={60}
      initialClip={{
        id: 'bass',
        name: 'Bass Clip',
        length: 8,
        notes: [
          { id: 'b1', pitch: 36, startBeat: 0, duration: 2, velocity: 0.9 },
          { id: 'b2', pitch: 43, startBeat: 2, duration: 1, velocity: 0.8 },
          { id: 'b3', pitch: 48, startBeat: 4, duration: 2, velocity: 0.85 },
        ],
      }}
    />
  ),
}

/**
 * Fine snap grid (1/32 notes).
 * Test: High-resolution editing.
 */
export const FineSnap: Story = {
  render: () => <PianoRollWithState snapToBeat={0.125} visibleBeats={4} />,
}

/**
 * Coarse snap grid (whole notes).
 * Test: Low-resolution editing.
 */
export const CoarseSnap: Story = {
  render: () => <PianoRollWithState snapToBeat={1} />,
}

/**
 * Loop region controls.
 * Test: Drag loop start/end handles in timeline ruler.
 * Notes outside loop region are dimmed.
 */
export const LoopRegion: Story = {
  render: () => (
    <PianoRollWithState
      initialClip={{
        id: 'loop-clip',
        name: 'Loop Demo',
        length: 16,
        loopStart: 2,
        loopEnd: 10,
        notes: [
          // Notes before loop (should be dimmed)
          { id: 'pre1', pitch: 60, startBeat: 0, duration: 1, velocity: 0.8 },
          { id: 'pre2', pitch: 64, startBeat: 1, duration: 1, velocity: 0.7 },
          // Notes inside loop (should be bright)
          { id: 'in1', pitch: 67, startBeat: 2, duration: 2, velocity: 0.9 },
          { id: 'in2', pitch: 72, startBeat: 4, duration: 1, velocity: 0.6 },
          { id: 'in3', pitch: 65, startBeat: 5, duration: 1.5, velocity: 0.75 },
          { id: 'in4', pitch: 62, startBeat: 7, duration: 2, velocity: 0.85 },
          { id: 'in5', pitch: 69, startBeat: 9, duration: 0.5, velocity: 0.8 },
          // Notes after loop (should be dimmed)
          { id: 'post1', pitch: 60, startBeat: 10, duration: 2, velocity: 0.7 },
          { id: 'post2', pitch: 64, startBeat: 12, duration: 1, velocity: 0.6 },
          { id: 'post3', pitch: 67, startBeat: 14, duration: 2, velocity: 0.8 },
        ],
      }}
      visibleBeats={16}
    />
  ),
}

/**
 * Loop region with playhead animation.
 * Test: Playhead loops within the loop region.
 */
export const LoopWithPlayhead: Story = {
  render: () => {
    const [clip, setClip] = useState<MidiClip>({
      id: 'loop-playhead',
      name: 'Loop Playhead Demo',
      length: 16,
      loopStart: 4,
      loopEnd: 12,
      notes: [
        { id: 'n1', pitch: 60, startBeat: 4, duration: 2, velocity: 0.8 },
        { id: 'n2', pitch: 64, startBeat: 6, duration: 2, velocity: 0.7 },
        { id: 'n3', pitch: 67, startBeat: 8, duration: 2, velocity: 0.9 },
        { id: 'n4', pitch: 72, startBeat: 10, duration: 2, velocity: 0.6 },
      ],
    })
    const [playhead, setPlayhead] = useState(clip.loopStart ?? 0)
    const [isPlaying, setIsPlaying] = useState(true)

    const loopStart = clip.loopStart ?? 0
    const loopEnd = clip.loopEnd ?? clip.length

    useEffect(() => {
      if (!isPlaying) return
      const interval = setInterval(() => {
        setPlayhead((prev) => {
          const next = prev + 0.05
          // Loop back to loopStart when we reach loopEnd
          if (next >= loopEnd) return loopStart
          return next
        })
      }, 50)
      return () => clearInterval(interval)
    }, [isPlaying, loopStart, loopEnd])

    return (
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        <Box sx={{ mb: 1, display: 'flex', gap: 2 }}>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <span>Beat: {playhead.toFixed(2)}</span>
          <span>Loop: {loopStart.toFixed(1)} - {loopEnd.toFixed(1)}</span>
        </Box>
        <PianoRoll
          clip={clip}
          onClipChange={setClip}
          playheadBeat={playhead}
          height={400}
          visibleBeats={16}
        />
      </Box>
    )
  },
}
