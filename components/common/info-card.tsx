import type { ReactNode } from "react";
import { Card, CardBody, CardHead } from "@/components/ui/card";

/**
 * Titled card shell used across detail pages: a header (h3 title, optional
 * trailing action pushed right by `.grow`) over a body. `padded` wraps the body in
 * `p-5`; set it false for full-bleed bodies such as tables.
 */
export function InfoCard({
  title,
  action,
  padded = true,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHead>
        <h3>{title}</h3>
        {action && (
          <>
            <span className="grow" />
            {action}
          </>
        )}
      </CardHead>
      {padded ? <CardBody>{children}</CardBody> : children}
    </Card>
  );
}
