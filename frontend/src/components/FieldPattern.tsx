type FieldPatternProps = {
  className?: string
}

function FieldPattern({ className }: FieldPatternProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="20" y="20" width="360" height="360" rx="12" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="2" />
      <circle cx="200" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="200" cy="200" r="3" fill="currentColor" />
      <rect x="20" y="140" width="40" height="120" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="340" y="140" width="40" height="120" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

export default FieldPattern
