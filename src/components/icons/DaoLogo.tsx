import daoLogo from "@/assets/dao-logo.png";

interface DaoLogoProps {
  className?: string;
  size?: number;
}

export function DaoLogo({ className = "", size = 32 }: DaoLogoProps) {
  return (
    <img
      src={daoLogo}
      alt="Dao"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
