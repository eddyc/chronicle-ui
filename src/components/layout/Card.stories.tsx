import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { Card } from './Card'
import { Knob } from '../controls/Knob'
import { colors } from '../../theme'

const meta: Meta<typeof Card> = {
  title: 'Components/Layout/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    title: 'Oscillator',
    description: 'Basic waveform generator',
    children: (
      <Typography sx={{ color: colors.warmGray }}>
        Card content goes here
      </Typography>
    ),
  },
}

export const WithoutTitle: Story = {
  args: {
    children: (
      <Typography sx={{ color: colors.warmGray }}>
        A card without a title or description - just content.
      </Typography>
    ),
  },
}

export const TitleOnly: Story = {
  args: {
    title: 'Settings',
    children: (
      <Typography sx={{ color: colors.warmGray }}>
        A card with only a title, no description.
      </Typography>
    ),
  },
}

function InteractiveCardDemo() {
  const [freq, setFreq] = useState(440)
  const [gain, setGain] = useState(75)
  const [pan, setPan] = useState(0)

  return (
    <Card
      title="Oscillator"
      description="Basic sine wave generator with pan control"
    >
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
        <Knob label="freq" value={freq} onChange={setFreq} min={20} max={2000} unit=" Hz" />
        <Knob label="gain" value={gain} onChange={setGain} min={0} max={100} unit="%" />
        <Knob label="pan" value={pan} onChange={setPan} min={-50} max={50} />
      </Box>
    </Card>
  )
}

export const WithControls: Story = {
  render: () => <InteractiveCardDemo />,
}

export const MultipleCards: Story = {
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card title="VCO" description="Voltage-controlled oscillator">
        <Typography sx={{ color: colors.warmGray }}>
          Generates the raw waveform
        </Typography>
      </Card>
      <Card title="VCF" description="Voltage-controlled filter">
        <Typography sx={{ color: colors.warmGray }}>
          Shapes the harmonic content
        </Typography>
      </Card>
      <Card title="VCA" description="Voltage-controlled amplifier">
        <Typography sx={{ color: colors.warmGray }}>
          Controls the output level
        </Typography>
      </Card>
    </Box>
  ),
}
