import type { TripWorkspaceSectionIcon as SectionIcon } from '../model/trip-workspace-section'

type TripSectionIconProps = {
  icon: SectionIcon
  className?: string
}

export function TripSectionIcon({ icon, className }: TripSectionIconProps) {
  const commonProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (icon) {
    case 'place':
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      )
    case 'bed':
      return (
        <svg {...commonProps}>
          <path d="M3 19v-8M21 19v-6a2 2 0 0 0-2-2H9a3 3 0 0 0-3 3v2M3 16h18M6 11V7h5a3 3 0 0 1 3 3v1" />
        </svg>
      )
    case 'wallet':
      return (
        <svg {...commonProps}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H18a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2V6.5Z" />
          <path d="M4 8h16M15 12h7v4h-7a2 2 0 0 1 0-4Z" />
        </svg>
      )
    case 'restaurant':
      return (
        <svg {...commonProps}>
          <path d="M6 3v18M3 3v5a3 3 0 0 0 6 0V3M17 13V3a4 4 0 0 1 4 4v6h-4Zm0 0v8" />
        </svg>
      )
    case 'route':
      return (
        <svg {...commonProps}>
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="6" r="2" />
          <path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
        </svg>
      )
    case 'info':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7h.01" />
        </svg>
      )
  }
}
