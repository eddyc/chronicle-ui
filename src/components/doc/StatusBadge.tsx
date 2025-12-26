import { Chip } from '@mui/material'

export type StatusType = 'working' | 'wip' | 'planned'

interface StatusBadgeProps {
  status: StatusType
}

const statusConfig: Record<StatusType, { label: string; bg: string; color: string }> = {
  working: {
    label: 'Working',
    bg: 'rgba(76, 175, 80, 0.15)',
    color: '#4caf50',
  },
  wip: {
    label: 'WIP',
    bg: 'rgba(255, 193, 7, 0.15)',
    color: '#ffc107',
  },
  planned: {
    label: 'Planned',
    bg: 'rgba(158, 158, 158, 0.15)',
    color: '#9e9e9e',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        backgroundColor: config.bg,
        color: config.color,
        '& .MuiChip-label': {
          px: 1.25,
        },
      }}
    />
  )
}
