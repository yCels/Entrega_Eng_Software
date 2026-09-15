type BallIconProps = {
  className?: string
}

function BallIcon({ className }: BallIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <polygon points="20,11 27,16.5 24.3,25 15.7,25 13,16.5" fill="currentColor" />
      <line x1="20" y1="11" x2="20" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="27" y1="16.5" x2="34" y2="12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="24.3" y1="25" x2="27.5" y2="32.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15.7" y1="25" x2="12.5" y2="32.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="13" y1="16.5" x2="6" y2="12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default BallIcon
