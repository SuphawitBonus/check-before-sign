// Same drawing as app/icon.svg (favicon / app icon): a check mark above a signature line.
export default function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#1E3A5F" />
      <path
        d="M17 29.5 27 39.5 47 17.5"
        fill="none"
        stroke="#E0B25B"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 49.5h36" stroke="#F7F2E8" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
