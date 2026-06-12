import Link from "next/link";
import { Input, Select } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { AgentBadge } from "@/components/ui/badges";
import { fmtBpsPercent } from "@/lib/domain/bps";
import type { Agency, Agent } from "@/lib/supabase/types";
import type { AgentDraft } from "./agent-draft";

type Errors = Partial<Record<keyof AgentDraft, string>>;

export function AgentProfileCard({
  agent: a,
  agencies,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  agent: Agent;
  agencies: Agency[];
  editing?: boolean;
  draft?: AgentDraft;
  errors?: Errors;
  onField?: (key: keyof AgentDraft, value: string) => void;
}) {
  const agency = a.agency_id ? agencies.find((g) => g.id === a.agency_id) : undefined;
  return (
    <InfoCard title="Agent">
      {editing && draft ? (
        <ProfileForm draft={draft} agencies={agencies} errors={errors} onField={onField} />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <AgentBadge status={a.status} /> },
            {
              label: "Agency",
              value: agency ? (
                <Link href={`/agencies/${agency.id}`}>{agency.name}</Link>
              ) : (
                "Findway (direct)"
              ),
            },
            { label: "Email", value: a.email ?? "—" },
            { label: "NPN", value: a.npn ?? "—" },
            { label: "Commission split", value: fmtBpsPercent(a.commission_split_bps) },
            { label: "Added", value: a.created_at.slice(0, 10) },
            { label: "Last updated", value: a.updated_at.slice(0, 10) },
          ]}
        />
      )}
    </InfoCard>
  );
}

function ProfileForm({
  draft,
  agencies,
  errors,
  onField,
}: {
  draft: AgentDraft;
  agencies: Agency[];
  errors: Errors;
  onField?: (key: keyof AgentDraft, value: string) => void;
}) {
  const text = (key: keyof AgentDraft, label: string, opts: { required?: boolean } = {}) => (
    <Field label={label} required={opts.required} err={errors[key]}>
      <Input
        err={!!errors[key]}
        value={draft[key]}
        onChange={(e) => onField?.(key, e.target.value)}
      />
    </Field>
  );

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      <div className="col-span-2">{text("full_name", "Full name", { required: true })}</div>
      {text("email", "Email")}
      {text("npn", "NPN")}
      <Field label="Agency" err={errors.agency_id}>
        <Select value={draft.agency_id} onChange={(e) => onField?.("agency_id", e.target.value)}>
          <option value="">Findway (direct)</option>
          {agencies.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </Field>
      {text("commission_split_pct", "Commission split (%)")}
    </div>
  );
}
