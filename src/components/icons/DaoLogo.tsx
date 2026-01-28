interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Minimalist winding path/road - the journey */}
      <path
        d="M8 26C8 26 12 20 16 16C20 12 16 8 16 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16 8C16 8 20 12 24 16C28 20 24 26 24 26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Small circle - current position on the path */}
      <circle cx="16" cy="16" r="2" fill="currentColor" />
    </svg>
  );
}
