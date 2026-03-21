import { type ButtonHTMLAttributes } from "react";
import { Button } from "./Button";

interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The icon element to render */
  icon: React.ReactNode;
  /** Required accessible label — screen readers use this */
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  ...props
}: IconButtonProps) {
  return (
    <Button variant="icon" size={size} aria-label={label} {...props}>
      {icon}
    </Button>
  );
}
