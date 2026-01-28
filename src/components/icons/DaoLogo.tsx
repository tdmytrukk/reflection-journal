interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Winding road - perspective path going into distance */}
      {/* Left edge of road */}
      <path
        d="M12 42 C16 34, 10 28, 18 22 C26 16, 18 10, 22 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* Main road body */}
      <path
        d="M18 44 C24 36, 16 30, 24 24 C32 18, 22 12, 24 2"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
      {/* Right edge of road */}
      <path
        d="M36 42 C32 34, 38 28, 30 22 C22 16, 30 10, 26 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
