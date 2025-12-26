import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import { Knob } from './Knob'

const meta: Meta<typeof Knob> = {
  title: 'Components/Controls/Knob',
  component: Knob,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 1000, step: 1 } },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    size: { control: { type: 'range', min: 40, max: 100, step: 4 } },
  },
}

export default meta
type Story = StoryObj<typeof Knob>

function KnobWithState(props: Omit<React.ComponentProps<typeof Knob>, 'value' | 'onChange'> & { initialValue?: number }) {
  const { initialValue = props.min, ...rest } = props
  const [value, setValue] = useState(initialValue)
  return <Knob {...rest} value={value} onChange={setValue} />
}

export const Default: Story = {
  render: () => (
    <KnobWithState
      label="freq"
      min={20}
      max={2000}
      initialValue={440}
      unit=" Hz"
    />
  ),
}

export const Percentage: Story = {
  render: () => (
    <KnobWithState
      label="gain"
      min={0}
      max={100}
      initialValue={75}
      unit="%"
    />
  ),
}

export const Decimal: Story = {
  render: () => (
    <KnobWithState
      label="depth"
      min={0}
      max={1}
      step={0.1}
      initialValue={0.5}
    />
  ),
}

export const Large: Story = {
  render: () => (
    <KnobWithState
      label="master"
      min={0}
      max={100}
      initialValue={80}
      size={80}
      unit="%"
    />
  ),
}

export const Small: Story = {
  render: () => (
    <KnobWithState
      label="pan"
      min={-50}
      max={50}
      initialValue={0}
      size={44}
    />
  ),
}

export const KnobBank: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 4 }}>
      <KnobWithState label="freq" min={20} max={2000} initialValue={440} unit=" Hz" />
      <KnobWithState label="cutoff" min={100} max={10000} initialValue={2000} unit=" Hz" />
      <KnobWithState label="res" min={0} max={100} initialValue={30} unit="%" />
      <KnobWithState label="drive" min={0} max={10} step={0.1} initialValue={2.5} />
    </Box>
  ),
}
