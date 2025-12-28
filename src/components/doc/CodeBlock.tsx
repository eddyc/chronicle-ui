import { Box, Paper, IconButton, Tooltip } from '@mui/material'
import { ContentCopy as CopyIcon, Check as CheckIcon } from '@mui/icons-material'
import { useState, useCallback, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import { useChronicleTheme } from '../../hooks'

interface CodeBlockProps {
  children: string
  language?: string
}

/**
 * Minimal syntax highlighted code block
 * 4-5 color palette: function (amber), string (light amber), keyword (gray), comment (muted gray)
 */
export function CodeBlock({ children, language = 'typescript' }: CodeBlockProps) {
  const { semantic, components } = useChronicleTheme()
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)
  const code = children.trim()

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const { syntax } = components.codeBlock

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        mb: 3,
        backgroundColor: components.codeBlock.background,
        border: `1px solid ${components.codeBlock.border}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderBottom: `1px solid ${components.codeBlock.border}`,
          backgroundColor: components.codeBlock.header,
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.65rem',
            color: semantic.text.muted,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {language}
        </Box>
        <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? semantic.accent.primary : semantic.text.muted,
              '&:hover': { color: semantic.text.primary },
            }}
          >
            {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code content - minimal 4-5 color syntax */}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflow: 'auto',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.85rem',
          lineHeight: 1.7,
          // 1. Functions - accent color (amber)
          '& .token.function': { color: syntax.function },
          '& .token.builtin': { color: syntax.function },
          '& .token.class-name': { color: syntax.function },
          '& .token.property': { color: syntax.function },
          '& .token.tag': { color: syntax.function },
          // 2. Strings/values - lighter accent
          '& .token.string': { color: syntax.string },
          '& .token.template-string': { color: syntax.string },
          '& .token.number': { color: syntax.string },
          '& .token.boolean': { color: syntax.string },
          '& .token.constant': { color: syntax.string },
          '& .token.attr-value': { color: syntax.string },
          // 3. Keywords - muted gray
          '& .token.keyword': { color: syntax.keyword },
          '& .token.attr-name': { color: syntax.keyword },
          // 4. Comments - very muted
          '& .token.comment': { color: syntax.comment, fontStyle: 'italic' },
          // 5. Everything else - inherit/secondary
          '& .token.operator': { color: syntax.operator },
          '& .token.punctuation': { color: syntax.punctuation },
          '& .token.parameter': { color: semantic.text.primary },
          // Default text
          color: semantic.text.primary,
        }}
      >
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </Box>
    </Paper>
  )
}
