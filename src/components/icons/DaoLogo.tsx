interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left tapered stroke - winding path edge */}
      <path
        d="M18 56 
           C22 48, 14 42, 20 34 
           C26 26, 18 20, 24 12
           C28 6, 26 4, 28 2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{ strokeWidth: '2.5px' }}
      />
      {/* Right tapered stroke - parallel path edge */}
      <path
        d="M38 58 
           C42 50, 34 44, 40 36 
           C46 28, 38 22, 44 14
           C48 8, 46 4, 48 2"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Connecting fill for the road body */}
      <path
        d="M18 56 
           C22 48, 14 42, 20 34 
           C26 26, 18 20, 24 12
           C28 6, 26 4, 28 2
           L48 2
           C46 4, 48 8, 44 14
           C38 22, 46 28, 40 36
           C34 44, 42 50, 38 58
           Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
