import { Box, Typography } from '@mui/material'
import { useRef, useCallback, useState, useEffect } from 'react'
import * as d3 from 'd3'
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
 * Uses D3-drag for unified mouse + touch support.
 * Local state provides smooth visual feedback during dragging,
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

  // Set up D3 drag for unified mouse + touch support
  useEffect(() => {
    const knob = knobRef.current
    if (!knob) return

    const sensitivity = (max - min) / 150
    let startY = 0
    let startValue = 0

    const drag = d3
      .drag<HTMLDivElement, unknown>()
      .on('start', (event) => {
        setIsDragging(true)
        startY = event.y
        startValue = localValue ?? min
      })
      .on('drag', (event) => {
        const deltaY = startY - event.y
        let newValue = startValue + deltaY * sensitivity
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
      })
      .on('end', () => {
        setIsDragging(false)
        // Flush any pending debounced value immediately on drag end
        if (debounceRef.current.timerId !== null) {
          clearTimeout(debounceRef.current.timerId)
          debounceRef.current.timerId = null
        }
        const valueToSend = debounceRef.current.pendingValue
        debounceRef.current.pendingValue = null
        if (valueToSend !== null) {
          onChange(valueToSend)
        }
      })

    d3.select(knob).call(drag)

    return () => {
      d3.select(knob).on('.drag', null)
    }
  }, [min, max, step, onChange, localValue])

  const formattedValue = step < 1 ? displayValue.toFixed(1) : displayValue.toFixed(0)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        userSelect: 'none',
        touchAction: 'none', // Prevent browser gestures interfering with drag
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
          touchAction: 'none', // Prevent browser gestures
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
