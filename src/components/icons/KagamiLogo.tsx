interface KagamiLogoProps {
  className?: string;
  size?: number;
}

export function KagamiLogo({ className = "", size = 32 }: KagamiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Minimalist brush stroke representing reflection/journey */}
      <path
        d="M8 24C8 24 10 12 16 8C22 4 24 16 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small accent dot - like a journal mark */}
      <circle cx="16" cy="20" r="2" fill="currentColor" />
    </svg>
  );
}
