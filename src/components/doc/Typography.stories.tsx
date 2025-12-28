import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { H1, H2, H3, P, Code, UL } from './Typography'
import { Doc } from './Doc'

const meta: Meta = {
  title: 'Components/Doc/Typography',
  parameters: {
    layout: 'padded',
  },
}

export default meta

export const Headings: StoryObj = {
  render: () => (
    <Doc>
      <H1>Heading 1 - Page Title</H1>
      <H2>Heading 2 - Section</H2>
      <H3>Heading 3 - Subsection</H3>
    </Doc>
  ),
}

export const Paragraph: StoryObj = {
  render: () => (
    <Doc>
      <P>
        Chronicle is a reactive DSP Virtual DOM where TypeScript synthetic objects
        represent DSP nodes and sequencer events. The graph can be inspected to
        dynamically build native DSP chains and schedule events.
      </P>
      <P>
        Use the <code>phasor</code> opcode to create a basic oscillator, then chain
        it with filters and effects to build complex audio graphs.
      </P>
    </Doc>
  ),
}

export const InlineCode: StoryObj = {
  render: () => (
    <Doc>
      <P>
        The <Code>graph()</Code> function takes a callback that receives a context
        with DSP primitives like <Code>phasor</Code> and <Code>param</Code>.
      </P>
    </Doc>
  ),
}

export const UnorderedList: StoryObj = {
  render: () => (
    <Doc>
      <P>Chronicle supports multiple opcode types:</P>
      <UL>
        <li><strong>phasor</strong> - Phase accumulator oscillator</li>
        <li><strong>sin</strong> - Sine wave shaper</li>
        <li><strong>moogladder</strong> - Moog-style lowpass filter</li>
        <li>Use <code>param()</code> to create control-rate inputs</li>
      </UL>
    </Doc>
  ),
}

export const CompleteDocument: StoryObj = {
  render: () => (
    <Doc>
      <H1>Getting Started</H1>
      <P>
        Chronicle provides a declarative DSL for building audio graphs in TypeScript.
      </P>

      <H2>Installation</H2>
      <P>
        Install the packages using your preferred package manager:
      </P>

      <H3>Basic Usage</H3>
      <P>
        Import the <Code>graph</Code> function from <Code>@eddyc/chronicle-dsl</Code> and
        define your audio graph:
      </P>

      <H2>Features</H2>
      <UL>
        <li><strong>Reactive</strong> - Automatically tracks signal dependencies</li>
        <li><strong>Type-safe</strong> - Full TypeScript support</li>
        <li><strong>Declarative</strong> - Define what, not how</li>
      </UL>
    </Doc>
  ),
}
