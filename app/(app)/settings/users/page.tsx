"use client";
import { Table } from "@/components/ui/table";

import { Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { PageErrorState } from "@/components/common/page-states";
import { UsersFilterBar } from "@/components/settings/users/users-filter-bar";
import { UsersTable } from "@/components/settings/users/users-table";
import { Btn } from "@/components/ui/btn";
import { EmptyState, TableSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useProfiles, useUpdateProfile } from "@/lib/data/hooks";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/domain/enums";

export default function UserManagementPage() {
  const profilesQ = useProfiles();
  const updateProfile = useUpdateProfile();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | AppRole>("");

  const profiles = profilesQ.data;

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return (profiles ?? []).filter((p) => {
      if (
        ql &&
        !(p.email.toLowerCase().includes(ql) || (p.full_name ?? "").toLowerCase().includes(ql))
      )
        return false;
      if (role && p.role !== role) return false;
      return true;
    });
  }, [profiles, q, role]);

  const all = profiles ?? [];
  const active = all.filter((p) => p.is_active).length;

  function changeRole(id: string, next: AppRole) {
    updateProfile.mutate(
      { id, patch: { role: next } },
      {
        onSuccess: () => toast(`Role set to ${APP_ROLE_LABELS[next]}`, "success"),
        onError: (e) => toast(`Could not update: ${e.message}`, "error"),
      },
    );
  }

  function toggleActive(id: string, isActive: boolean) {
    updateProfile.mutate(
      { id, patch: { is_active: !isActive } },
      {
        onSuccess: () => toast(isActive ? "User disabled" : "User re-enabled", "success"),
      },
    );
  }

  if (profilesQ.isError) {
    return <PageErrorState body="Failed to fetch users." onRetry={() => profilesQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 pt-[26px] pb-20">
      <PageHeader
        title="User Management"
        subtitle={`${all.length} account${all.length === 1 ? "" : "s"} · ${active} active`}
        actions={
          <Btn
            variant="primary"
            icon={<Plus size={17} />}
            onClick={() => toast("Invitations go through Microsoft Entra ID.", "default")}
          >
            Invite User
          </Btn>
        }
      />

      <UsersFilterBar q={q} onQ={setQ} role={role} onRole={setRole} />

      {profilesQ.isLoading ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <Table>
            <thead>
              <tr>
                {["User", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <TableSkeleton cols={[140, 180, 90, 70, 80, 80]} rows={6} />
          </Table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border bg-bg rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]">
          <EmptyState
            icon={Users}
            title={all.length === 0 ? "No users provisioned" : "No users match these filters"}
            body={
              all.length === 0 ? "Invite teammates to give them access." : "Try clearing a filter."
            }
          />
        </div>
      ) : (
        <UsersTable rows={filtered} onChangeRole={changeRole} onToggleActive={toggleActive} />
      )}
    </div>
  );
}
