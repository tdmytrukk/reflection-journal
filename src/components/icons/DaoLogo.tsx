interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Winding path - two parallel tapered strokes forming a road */}
      {/* Left edge - thin tapered stroke */}
      <path
        d="M25 95 
           Q35 75, 22 60
           Q10 45, 30 30
           Q45 18, 38 5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Right edge / main body - thicker tapered stroke */}
      <path
        d="M55 95 
           Q65 75, 52 60
           Q40 45, 60 30
           Q75 18, 62 5"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
