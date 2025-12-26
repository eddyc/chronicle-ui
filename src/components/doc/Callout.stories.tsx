import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Callout } from './Callout'
import { Doc } from './Doc'

const meta: Meta<typeof Callout> = {
  title: 'Components/Doc/Callout',
  component: Callout,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'warning', 'tip'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Callout>

export const Info: Story = {
  args: {
    type: 'info',
    children: 'Chronicle uses a reactive architecture where signal dependencies are automatically tracked.',
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'Audio processing runs in a separate thread. Avoid blocking operations in your graph callbacks.',
  },
}

export const Tip: Story = {
  args: {
    type: 'tip',
    children: 'Use the Plot component to visualize your audio signals in real-time during development.',
  },
}

export const AllVariants: Story = {
  render: () => (
    <Doc>
      <Callout type="info">
        <strong>Note:</strong> This is an informational callout for general notes and context.
      </Callout>

      <Callout type="warning">
        <strong>Warning:</strong> Be careful when modifying audio parameters at audio rate -
        this can cause zipper noise.
      </Callout>

      <Callout type="tip">
        <strong>Pro tip:</strong> Chain multiple filters together using the fluent API:
        <code>signal.filter(1000).gain(0.5)</code>
      </Callout>
    </Doc>
  ),
}
