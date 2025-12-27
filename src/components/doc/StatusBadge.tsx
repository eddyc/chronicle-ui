import { Chip } from '@mui/material'
import { useChronicleTheme } from '../../hooks'

export type StatusType = 'working' | 'wip' | 'planned'

interface StatusBadgeProps {
  status: StatusType
}

const statusLabels: Record<StatusType, string> = {
  working: 'Working',
  wip: 'WIP',
  planned: 'Planned',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { semantic } = useChronicleTheme()
  const color = semantic.status[status]
  const label = statusLabels[status]

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        backgroundColor: `${color}20`,
        color: color,
        '& .MuiChip-label': {
          px: 1.25,
        },
      }}
    />
  )
}
