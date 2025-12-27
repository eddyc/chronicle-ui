import { Box, Typography } from '@mui/material'
import { useRef, useCallback, useState, useEffect } from 'react'
import { useChronicleTheme } from '../../hooks'

interface KnobProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  size?: number
}

/**
 * Flat vector-style rotary knob control
 * Peter Max pop art aesthetic - clean lines, bold colors
 */
export function Knob({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  size = 56,
}: KnobProps) {
  const { semantic, components } = useChronicleTheme()
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startY: 0, startValue: 0 })

  const normalizedValue = (value - min) / (max - min)
  const rotation = normalizedValue * 270 - 135

  const clamp = (val: number, minVal: number, maxVal: number) =>
    Math.min(Math.max(val, minVal), maxVal)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragState.current = { startY: e.clientY, startValue: value }
    },
    [value]
  )

  useEffect(() => {
    if (!isDragging) return

    const sensitivity = (max - min) / 150

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragState.current.startY - e.clientY
      let newValue = dragState.current.startValue + deltaY * sensitivity
      newValue = Math.round(newValue / step) * step
      newValue = clamp(newValue, min, max)
      onChange(newValue)
    }

    const handleMouseUp = () => setIsDragging(false)

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, min, max, step, onChange])

  const displayValue = step < 1 ? value.toFixed(1) : value.toFixed(0)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        userSelect: 'none',
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: semantic.text.secondary,
        }}
      >
        {label}
      </Typography>

      {/* Knob - flat vector style */}
      <Box
        ref={knobRef}
        onMouseDown={handleMouseDown}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative',
          // Flat background - no gradients
          backgroundColor: components.knob.background,
          border: `2px solid ${components.knob.track}`,
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: semantic.border.strong,
          },
        }}
      >
        {/* Indicator line - bold pop art style */}
        <Box
          sx={{
            position: 'absolute',
            top: '15%',
            left: '50%',
            width: 3,
            height: '30%',
            backgroundColor: components.knob.indicator,
            borderRadius: 1.5,
            transformOrigin: 'center 117%',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />
      </Box>

      {/* Value display */}
      <Box
        sx={{
          backgroundColor: components.knob.value.background,
          border: `1px solid ${semantic.border.subtle}`,
          borderRadius: 1,
          px: 1,
          py: 0.25,
          minWidth: 48,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: components.knob.value.text,
            textAlign: 'center',
            textShadow: `0 0 8px ${components.knob.value.glow}`,
            letterSpacing: '0.05em',
          }}
        >
          {displayValue}
          {unit}
        </Typography>
      </Box>
    </Box>
  )
}
