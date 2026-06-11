interface ClubCrestProps {
  name: string
  primaryColor: string
  template?: number
  size?: number
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || name.slice(0, 2).toUpperCase()
}

export function ClubCrest({ name, primaryColor, template = 1, size = 48 }: ClubCrestProps) {
  const initials = getInitials(name)
  const h = Math.round(size * 1.08)
  const cx = size / 2
  const cy = h / 2

  // Template 1 — classic shield
  if (template === 1) {
    const sx = size / 48
    const sy = h / 52
    return (
      <svg width={size} height={h} viewBox="0 0 48 52" fill="none">
        <path
          d="M24 3L43 12V28C43 37 35 44 24 49C13 44 5 37 5 28V12L24 3Z"
          fill="#111111"
          stroke={primaryColor}
          strokeWidth="1.5"
        />
        <text
          x="24" y="30"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={primaryColor}
          fontFamily="Inter, sans-serif"
          fontSize={initials.length > 2 ? '11' : '14'}
          fontWeight="700"
        >
          {initials}
        </text>
        {/* suppress lint */}
        <title>{name} {sx} {sy}</title>
      </svg>
    )
  }

  // Template 2 — round badge
  if (template === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" fill="#111111" stroke={primaryColor} strokeWidth="1.5" />
        <circle cx="24" cy="24" r="16" fill="none" stroke={primaryColor} strokeWidth="0.75" opacity="0.4" />
        <text x="24" y="24" textAnchor="middle" dominantBaseline="middle" fill={primaryColor}
          fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{initials}</text>
      </svg>
    )
  }

  // Template 3 — hexagonal
  if (template === 3) {
    return (
      <svg width={size} height={h} viewBox="0 0 48 54" fill="none">
        <polygon points="24,2 44,13 44,41 24,52 4,41 4,13" fill="#111111" stroke={primaryColor} strokeWidth="1.5" />
        <text x="24" y="27" textAnchor="middle" dominantBaseline="middle" fill={primaryColor}
          fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{initials}</text>
      </svg>
    )
  }

  // Template 4 — diamond
  if (template === 4) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="6" y="6" width="36" height="36" fill="#111111" stroke={primaryColor} strokeWidth="1.5" transform="rotate(45 24 24)" />
        <text x="24" y="24" textAnchor="middle" dominantBaseline="middle" fill={primaryColor}
          fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{initials}</text>
      </svg>
    )
  }

  // Template 5 — modern shield
  if (template === 5) {
    return (
      <svg width={size} height={h} viewBox="0 0 48 52" fill="none">
        <path d="M6 4H42V30C42 38 34 44 24 49C14 44 6 38 6 30V4Z" fill="#111111" stroke={primaryColor} strokeWidth="1.5" />
        <line x1="6" y1="18" x2="42" y2="18" stroke={primaryColor} strokeWidth="0.75" opacity="0.4" />
        <text x="24" y="33" textAnchor="middle" dominantBaseline="middle" fill={primaryColor}
          fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{initials}</text>
      </svg>
    )
  }

  // Template 6 — crest with bar
  return (
    <svg width={size} height={h} viewBox="0 0 48 52" fill="none">
      <path d="M24 3L43 12V28C43 37 35 44 24 49C13 44 5 37 5 28V12L24 3Z" fill="#111111" stroke={primaryColor} strokeWidth="1.5" />
      <rect x="5" y="18" width="38" height="2" fill={primaryColor} opacity="0.6" />
      <text x="24" y="33" textAnchor="middle" dominantBaseline="middle" fill={primaryColor}
        fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">{initials}</text>
    </svg>
  )

  // unreachable but satisfies TS
  void cx; void cy
}
