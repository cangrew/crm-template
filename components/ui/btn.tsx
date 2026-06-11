import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger" | "danger-solid";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm";
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
};

export function Btn({
  variant = "outline",
  size,
  icon,
  iconRight,
  children,
  className,
  ...rest
}: Props) {
  const cls = ["btn", "btn-" + variant];
  if (size === "sm") cls.push("btn-sm");
  if (!children) cls.push("btn-icon");
  if (className) cls.push(className);
  return (
    <button className={cls.join(" ")} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
