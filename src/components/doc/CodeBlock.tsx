import { Box, Paper, IconButton, Tooltip } from '@mui/material'
import { ContentCopy as CopyIcon, Check as CheckIcon } from '@mui/icons-material'
import { useState, useCallback, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import { colors } from '../../theme'

interface CodeBlockProps {
  children: string
  language?: string
}

// Minimal syntax highlighting - amber accents only
const syntaxColors = {
  keyword: colors.amber,
  string: colors.cream,
  function: colors.amber,
  number: colors.amber,
  operator: colors.warmGray,
  comment: colors.warmGray,
  punctuation: `${colors.cream}60`,
  property: colors.cream,
  className: colors.amber,
  boolean: colors.amber,
}

export function CodeBlock({ children, language = 'typescript' }: CodeBlockProps) {
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

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        mb: 3,
        backgroundColor: colors.panelBlack,
        border: `1px solid ${colors.panelLight}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      {/* Minimal header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderBottom: `1px solid ${colors.panelLight}`,
          backgroundColor: colors.panelDark,
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.65rem',
            color: colors.warmGray,
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
              color: copied ? colors.amber : colors.warmGray,
              '&:hover': { color: colors.cream },
            }}
          >
            {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code content */}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflow: 'auto',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '0.85rem',
          lineHeight: 1.7,
          // Minimal syntax theme
          '& .token.keyword': { color: syntaxColors.keyword },
          '& .token.string': { color: syntaxColors.string },
          '& .token.template-string': { color: syntaxColors.string },
          '& .token.function': { color: syntaxColors.function },
          '& .token.number': { color: syntaxColors.number },
          '& .token.boolean': { color: syntaxColors.boolean },
          '& .token.operator': { color: syntaxColors.operator },
          '& .token.comment': { color: syntaxColors.comment, fontStyle: 'italic' },
          '& .token.punctuation': { color: syntaxColors.punctuation },
          '& .token.property': { color: syntaxColors.property },
          '& .token.class-name': { color: syntaxColors.className },
          '& .token.builtin': { color: syntaxColors.function },
          '& .token.constant': { color: syntaxColors.number },
          '& .token.parameter': { color: colors.cream },
          // Default text
          color: colors.cream,
        }}
      >
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </Box>
    </Paper>
  )
}
