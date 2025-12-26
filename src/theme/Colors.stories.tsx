import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { colors } from './colors'

const meta: Meta = {
  title: 'Theme/Colors',
  parameters: {
    layout: 'padded',
  },
}

export default meta

function ColorSwatch({ name, value }: { name: string; value: string }) {
  const isLight = ['cream', 'chrome', 'amber'].includes(name)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          backgroundColor: value,
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      <Box>
        <Typography sx={{ color: colors.cream, fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography
          sx={{ color: colors.warmGray, fontFamily: 'monospace', fontSize: '0.85rem' }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

function ColorSection({ title, colorNames }: { title: string; colorNames: (keyof typeof colors)[] }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        sx={{ color: colors.amber, mb: 2, fontWeight: 600 }}
      >
        {title}
      </Typography>
      {colorNames.map((name) => (
        <ColorSwatch key={name} name={name} value={colors[name]} />
      ))}
    </Box>
  )
}

export const Palette: StoryObj = {
  render: () => (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ color: colors.cream, mb: 4, fontWeight: 700 }}
      >
        Chronicle Color Palette
      </Typography>
      <Typography sx={{ color: colors.warmGray, mb: 4, maxWidth: 600 }}>
        Inspired by 70s electronics and vintage synthesizer interfaces.
        Warm amber accents evoke LED displays, while rich neutrals create
        a sophisticated hardware aesthetic.
      </Typography>

      <ColorSection title="Primary" colorNames={['amber']} />
      <ColorSection title="Neutrals" colorNames={['cream', 'warmGray']} />
      <ColorSection title="Panels" colorNames={['panelLight', 'panelDark', 'panelBlack']} />
      <ColorSection title="Hardware" colorNames={['chrome', 'bakelite']} />
    </Box>
  ),
}
