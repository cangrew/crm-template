"use client";
import { Table } from "@/components/ui/table";
import type { Tone } from "@/lib/design/tones";
import { Badge } from "@/components/ui/badge";

import { QuickChangeSelect } from "@/components/common/quick-change-select";
import { Avatar } from "@/components/ui/avatar";
import { Btn } from "@/components/ui/btn";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";
import type { Profile } from "@/lib/supabase/types";

const ROLE_TONE: Record<AppRole, Tone> = {
  admin: "t-orange",
  manager: "t-blue",
  member: "t-teal",
};

const ROLE_OPTIONS = (Object.keys(APP_ROLE_LABELS) as AppRole[]).map((r) => ({
  value: r,
  label: APP_ROLE_LABELS[r],
}));

export function UsersTable({
  rows,
  onChangeRole,
  onToggleActive,
}: {
  rows: Profile[];
  onChangeRole: (id: string, next: AppRole) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="strong">
                  <span className="inline-flex items-center gap-2.5">
                    <Avatar name={p.full_name || p.email} size={28} />
                    {p.full_name || "—"}
                  </span>
                </td>
                <td className="muted">{p.email}</td>
                <td>
                  <QuickChangeSelect
                    value={p.role ?? ""}
                    options={
                      p.role
                        ? ROLE_OPTIONS
                        : [{ value: "", label: "Assign role…" }, ...ROLE_OPTIONS]
                    }
                    onChange={(next) => {
                      if (next) onChangeRole(p.id, next as AppRole);
                    }}
                    title="Change role"
                  >
                    <Badge tone={p.role ? ROLE_TONE[p.role] : "t-amber"}>
                      <span className="bdot" />
                      {p.role ? APP_ROLE_LABELS[p.role] : "Pending"}
                    </Badge>
                  </QuickChangeSelect>
                </td>
                <td>
                  {p.is_active ? (
                    <Badge tone="t-green">
                      <span className="bdot" />
                      Active
                    </Badge>
                  ) : (
                    <Badge tone="t-slate">
                      <span className="bdot" />
                      Disabled
                    </Badge>
                  )}
                </td>
                <td className="muted">{p.created_at?.slice(0, 10)}</td>
                <td className="text-right">
                  <Btn
                    variant={p.is_active ? "danger" : "outline"}
                    size="sm"
                    onClick={() => onToggleActive(p.id, p.is_active)}
                  >
                    {p.is_active ? "Disable" : "Re-enable"}
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
