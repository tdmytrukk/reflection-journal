import * as React from "react";

export interface DaoLogoProps {
  className?: string;
  size?: number;
}

/**
 * Dao mark: two parallel, tapered strokes forming a calm winding path.
 * Flat vector, single-color via `currentColor`.
 */
export const DaoLogo = React.forwardRef<SVGSVGElement, DaoLogoProps>(
  function DaoLogo({ className = "", size = 32 }, ref) {
    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Dao"
      >
        {/* Left stroke (tapered ribbon) */}
        <path
          fill="currentColor"
          d="M24 86
             C40 70, 20 58, 34 44
             C48 30, 34 20, 46 12
             C52 8, 56 8, 60 6
             C56 10, 52 12, 48 16
             C40 22, 48 34, 38 44
             C28 56, 48 70, 30 90
             Z"
        />

        {/* Right stroke (parallel tapered ribbon) */}
        <path
          fill="currentColor"
          d="M64 88
             C84 72, 66 60, 76 48
             C88 36, 82 26, 92 18
             C96 14, 98 14, 100 12
             C96 16, 92 18, 88 22
             C80 30, 84 40, 74 52
             C64 64, 82 76, 66 94
             Z"
        />
      </svg>
    );
  }
);
