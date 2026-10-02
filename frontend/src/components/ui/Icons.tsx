import type { ReactNode } from 'react'

type IconProps = {
  size?: number
}

function Icon({ size = 16, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function SunIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </Icon>
  )
}

export function MoonIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11Z" />
    </Icon>
  )
}

export function PlusIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function SearchIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  )
}

export function MoreIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
    </Icon>
  )
}

export function TrophyIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
    </Icon>
  )
}

export function UsersIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" />
    </Icon>
  )
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  )
}

export function TableIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M4 6h16M4 12h16M4 18h16M9 4v16" />
    </Icon>
  )
}

export function LogOutIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
    </Icon>
  )
}

export function MenuIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  )
}

export function CloseIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  )
}

export function ArrowLeftIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Icon>
  )
}
