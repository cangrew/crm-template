import Link from "next/link";
import { EntityTable, type EntityColumn } from "@/components/common/entity-table";
import { AgentBadge } from "@/components/ui/badges";
import { fmtBpsPercent } from "@/lib/domain/bps";
import type { Agent } from "@/lib/supabase/types";

const COLUMNS: readonly EntityColumn<Agent>[] = [
  {
    key: "name",
    label: "Agent",
    className: "strong",
    render: (a) => (
      <Link href={`/agents/${a.id}`} className="block text-inherit no-underline">
        {a.full_name}
      </Link>
    ),
  },
  { key: "npn", label: "NPN", className: "mono muted", render: (a) => a.npn ?? "—" },
  {
    key: "split",
    label: "Split",
    align: "right",
    className: "cell-num",
    render: (a) => fmtBpsPercent(a.commission_split_bps),
  },
  { key: "status", label: "Status", render: (a) => <AgentBadge status={a.status} /> },
];

export function AgencyAgentsTable({ agents }: { agents: Agent[] }) {
  return (
    <EntityTable
      title="Agents"
      rows={agents}
      columns={COLUMNS}
      emptyText="No agents under this agency yet."
      clickableRows
    />
  );
}
