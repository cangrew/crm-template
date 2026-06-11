import { Shield } from "lucide-react";
import type { ReactNode } from "react";

export function Annotation({
  title = "Role behavior",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="annot">
      <span className="a-icon">
        <Shield size={17} />
      </span>
      <div>
        <div className="a-title">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
