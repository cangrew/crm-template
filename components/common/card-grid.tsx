import type { ReactNode } from "react";

/**
 * Responsive auto-fill card grid shell (the `.g-4 grid` layout used by the
 * documents page and dashboard card rows). Keeps the structural grid classes in
 * `globals.css`; callers supply the cards as children.
 */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={"g-4 grid" + (className ? " " + className : "")}>{children}</div>;
}
