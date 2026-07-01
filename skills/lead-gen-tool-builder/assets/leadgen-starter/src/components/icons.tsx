export const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Pin = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
    <path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 15v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const Search = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const X = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const Building = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

export const Person = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

export const Bolt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" />
  </svg>
)

// Parody "Z" logomark — a bold geometric Z, white on the red badge.
export const ZMark = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6.5 7h11L6.5 17h11" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
