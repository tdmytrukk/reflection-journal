interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left thin tapered edge of path */}
      <path
        d="M30 110 
           C38 90, 20 75, 32 55 
           C44 35, 28 20, 45 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Main road body - filled shape tapering from wide to narrow */}
      <path
        d="M42 115 
           C55 95, 35 78, 50 58 
           C65 38, 45 22, 55 5
           L72 5
           C62 22, 82 38, 67 58
           C52 78, 72 95, 58 115
           Z"
        fill="currentColor"
      />
      
      {/* Right thin edge accent */}
      <path
        d="M70 115 
           C80 95, 65 78, 78 58 
           C91 38, 72 20, 82 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
