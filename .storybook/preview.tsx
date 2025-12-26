import React from 'react'
import type { Preview } from '@storybook/react'
import { ThemeProvider } from '../src/providers/ThemeProvider'
import '@fontsource/righteous'
import '@fontsource/nunito'
import '@fontsource/jetbrains-mono'

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    backgrounds: {
      default: 'chronicle',
      values: [{ name: 'chronicle', value: '#1A1816' }],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
