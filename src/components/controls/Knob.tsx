import { Box, Typography } from '@mui/material'
import { useRef, useCallback, useState, useEffect } from 'react'
import { useChronicleTheme } from '../../hooks'

// Debounce interval for parameter updates (ms)
// 16ms = ~60fps, reduces main thread work during rapid knob drags
// This improves MIDI responsiveness when adjusting knobs during playback
const DEBOUNCE_MS = 16

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
 * Clean modern aesthetic - subtle, professional
 *
 * Uses local state for smooth visual feedback during dragging,
 * with debounced callbacks to reduce main thread blocking.
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

  // Local value for smooth visual feedback during dragging
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value)
    }
  }, [value, isDragging])

  // Debounce ref for batching onChange calls
  const debounceRef = useRef<{
    timerId: ReturnType<typeof setTimeout> | null
    pendingValue: number | null
  }>({ timerId: null, pendingValue: null })

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current.timerId !== null) {
        clearTimeout(debounceRef.current.timerId)
      }
    }
  }, [])

  // Guard against undefined value
  const displayValue = localValue ?? min
  const normalizedValue = (displayValue - min) / (max - min)
  const rotation = normalizedValue * 270 - 135

  const clamp = (val: number, minVal: number, maxVal: number) =>
    Math.min(Math.max(val, minVal), maxVal)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      dragState.current = { startY: e.clientY, startValue: displayValue }
    },
    [displayValue]
  )

  useEffect(() => {
    if (!isDragging) return

    const sensitivity = (max - min) / 150

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = dragState.current.startY - e.clientY
      let newValue = dragState.current.startValue + deltaY * sensitivity
      newValue = Math.round(newValue / step) * step
      newValue = clamp(newValue, min, max)

      // Update local state immediately for smooth visual feedback
      setLocalValue(newValue)

      // Debounce the parent callback to reduce main thread work
      debounceRef.current.pendingValue = newValue
      if (debounceRef.current.timerId === null) {
        debounceRef.current.timerId = setTimeout(() => {
          const valueToSend = debounceRef.current.pendingValue
          debounceRef.current.timerId = null
          debounceRef.current.pendingValue = null
          if (valueToSend !== null) {
            onChange(valueToSend)
          }
        }, DEBOUNCE_MS)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      // Flush any pending debounced value immediately on mouse up
      if (debounceRef.current.timerId !== null) {
        clearTimeout(debounceRef.current.timerId)
        debounceRef.current.timerId = null
      }
      const valueToSend = debounceRef.current.pendingValue
      debounceRef.current.pendingValue = null
      if (valueToSend !== null) {
        onChange(valueToSend)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, min, max, step, onChange])

  const formattedValue = step < 1 ? displayValue.toFixed(1) : displayValue.toFixed(0)

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
        {/* Indicator line - touching the edge */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 2,
            height: '20%',
            backgroundColor: components.knob.indicator,
            borderRadius: 1,
            transformOrigin: 'center 250%',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        />
      </Box>

      {/* Value display */}
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: semantic.text.primary,
          textAlign: 'center',
        }}
      >
        {formattedValue}
        {unit}
      </Typography>
    </Box>
  )
}
