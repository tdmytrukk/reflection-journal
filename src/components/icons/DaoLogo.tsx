import * as React from "react";
import daoMark from "@/assets/dao-mark.png";

export interface DaoLogoProps {
  className?: string;
  size?: number;
}

export const DaoLogo = React.forwardRef<HTMLImageElement, DaoLogoProps>(
  function DaoLogo({ className = "", size = 32 }, ref) {
    return (
      <img
        ref={ref}
        src={daoMark}
        alt="Dao"
        width={size}
        height={size}
        className={`block select-none ${className}`}
        style={{ width: size, height: size, objectFit: "contain" }}
        draggable={false}
      />
    );
  }
);
