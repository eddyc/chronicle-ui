import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { StatusBadge } from './StatusBadge'
import { colors } from '../../theme'

const meta: Meta<typeof StatusBadge> = {
  title: 'Components/Doc/StatusBadge',
  component: StatusBadge,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['working', 'wip', 'planned'],
    },
  },
}

export default meta
type Story = StoryObj<typeof StatusBadge>

export const Working: Story = {
  args: {
    status: 'working',
  },
}

export const WIP: Story = {
  args: {
    status: 'wip',
  },
}

export const Planned: Story = {
  args: {
    status: 'planned',
  },
}

export const AllVariants: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <StatusBadge status="working" />
      <StatusBadge status="wip" />
      <StatusBadge status="planned" />
    </Box>
  ),
}

export const InContext: Story = {
  render: () => (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography sx={{ color: colors.cream, fontWeight: 600 }}>phasor</Typography>
        <StatusBadge status="working" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography sx={{ color: colors.cream, fontWeight: 600 }}>moogladder</Typography>
        <StatusBadge status="wip" />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ color: colors.cream, fontWeight: 600 }}>granulator</Typography>
        <StatusBadge status="planned" />
      </Box>
    </Box>
  ),
}
