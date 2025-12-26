import { Box, Typography } from '@mui/material'
import { useRef, useCallback, useState, useEffect } from 'react'
import { colors } from '../../theme'

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

export function Knob({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  size = 56
}: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef({ startY: 0, startValue: 0 })

  const normalizedValue = (value - min) / (max - min)
  const rotation = normalizedValue * 270 - 135

  const clamp = (val: number, minVal: number, maxVal: number) =>
    Math.min(Math.max(val, minVal), maxVal)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragState.current = { startY: e.clientY, startValue: value }
  }, [value])

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
      {/* Label - small, subtle */}
      <Typography
        sx={{
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: colors.warmGray,
        }}
      >
        {label}
      </Typography>

      {/* Knob - authentic bakelite style */}
      <Box
        ref={knobRef}
        onMouseDown={handleMouseDown}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative',
          // Bakelite knob gradient
          background: `
            radial-gradient(circle at 40% 35%,
              #4A4540 0%,
              #353230 30%,
              #252320 60%,
              #1A1918 100%
            )
          `,
          boxShadow: `
            inset 0 1px 2px rgba(255,255,255,0.08),
            inset 0 -2px 3px rgba(0,0,0,0.4),
            0 3px 8px rgba(0,0,0,0.4)
          `,
          border: '1px solid #1A1918',
          // Knurled edge - subtle ridges
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 1,
            left: 1,
            right: 1,
            bottom: 1,
            borderRadius: '50%',
            background: `
              repeating-conic-gradient(
                from 0deg,
                transparent 0deg 4deg,
                rgba(0,0,0,0.15) 4deg 8deg
              )
            `,
          },
        }}
      >
        {/* Chrome indicator line */}
        <Box
          sx={{
            position: 'absolute',
            top: '12%',
            left: '50%',
            width: 2,
            height: '28%',
            backgroundColor: colors.chrome,
            borderRadius: 1,
            transformOrigin: 'center 140%',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }}
        />
      </Box>

      {/* LED-style value display */}
      <Box
        sx={{
          backgroundColor: '#0A0908',
          border: '1px solid #2A2826',
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
            color: colors.amber,
            textAlign: 'center',
            textShadow: `0 0 6px ${colors.amber}60`,
            letterSpacing: '0.05em',
          }}
        >
          {displayValue}{unit}
        </Typography>
      </Box>
    </Box>
  )
}
