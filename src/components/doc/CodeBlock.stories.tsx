import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { CodeBlock } from './CodeBlock'
import { Doc } from './Doc'

const meta: Meta<typeof CodeBlock> = {
  title: 'Components/Doc/CodeBlock',
  component: CodeBlock,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    language: {
      control: 'select',
      options: ['typescript', 'javascript', 'json', 'bash'],
    },
  },
}

export default meta
type Story = StoryObj<typeof CodeBlock>

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    children: `import { graph } from '@eddyc/chronicle-dsl'

const result = graph(({ phasor, sin }) => {
  const freq = 440
  const osc = phasor(freq)
  const wave = sin(osc)
  return { audio: wave }
})`,
  },
}

export const JavaScript: Story = {
  args: {
    language: 'javascript',
    children: `const audioContext = new AudioContext()
const oscillator = audioContext.createOscillator()

oscillator.type = 'sine'
oscillator.frequency.value = 440
oscillator.connect(audioContext.destination)
oscillator.start()`,
  },
}

export const JSON: Story = {
  args: {
    language: 'json',
    children: `{
  "name": "@eddyc/chronicle-dsl",
  "version": "0.1.0",
  "dependencies": {
    "@chronicle/core": "workspace:*"
  }
}`,
  },
}

export const Bash: Story = {
  args: {
    language: 'bash',
    children: `# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run the app
cd apps/chronicle-app && pnpm start`,
  },
}

export const InDocument: Story = {
  render: () => (
    <Doc>
      <CodeBlock language="typescript">
{`graph(({ phasor }) => {
  const osc = phasor(440)
  return { audio: osc }
})`}
      </CodeBlock>
    </Doc>
  ),
}
