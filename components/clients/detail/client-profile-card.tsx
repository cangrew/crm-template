import Link from "next/link";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { ClientBadge } from "@/components/ui/badges";
import type { Agent, Client } from "@/lib/supabase/types";
import type { ClientDraft } from "./client-draft";

type Errors = Partial<Record<keyof ClientDraft, string>>;

export function ClientProfileCard({
  client: c,
  agents,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  client: Client;
  agents: Agent[];
  editing?: boolean;
  draft?: ClientDraft;
  errors?: Errors;
  onField?: (key: keyof ClientDraft, value: string) => void;
}) {
  const agent = c.agent_id ? agents.find((a) => a.id === c.agent_id) : undefined;
  return (
    <InfoCard title="Profile">
      {editing && draft ? (
        <ProfileForm draft={draft} agents={agents} errors={errors} onField={onField} />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <ClientBadge status={c.status} /> },
            {
              label: "Agent",
              value: agent ? (
                <Link href={`/agents/${agent.id}`}>{agent.full_name}</Link>
              ) : (
                "Unassigned"
              ),
            },
            { label: "Date of birth", value: c.dob ?? "—" },
            { label: "Email", value: c.email ?? "—" },
            { label: "Phone", value: c.phone ?? "—" },
            { label: "Address", value: c.address ?? "—" },
            { label: "Added", value: c.created_at.slice(0, 10) },
            { label: "Last updated", value: c.updated_at.slice(0, 10) },
            { label: "Notes", value: c.notes ?? "—" },
          ]}
        />
      )}
    </InfoCard>
  );
}

function ProfileForm({
  draft,
  agents,
  errors,
  onField,
}: {
  draft: ClientDraft;
  agents: Agent[];
  errors: Errors;
  onField?: (key: keyof ClientDraft, value: string) => void;
}) {
  const text = (
    key: keyof ClientDraft,
    label: string,
    opts: { required?: boolean; placeholder?: string; type?: string } = {},
  ) => (
    <Field label={label} required={opts.required} err={errors[key]}>
      <Input
        err={!!errors[key]}
        type={opts.type ?? "text"}
        value={draft[key]}
        placeholder={opts.placeholder}
        onChange={(e) => onField?.(key, e.target.value)}
      />
    </Field>
  );

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-4">
      {text("first_name", "First name", { required: true })}
      {text("last_name", "Last name", { required: true })}
      {text("dob", "Date of birth", { type: "date" })}
      {text("email", "Email", { type: "email" })}
      {text("phone", "Phone")}
      <Field label="Agent" err={errors.agent_id}>
        <Select value={draft.agent_id} onChange={(e) => onField?.("agent_id", e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="col-span-2">{text("address", "Address")}</div>
      <div className="col-span-2">
        <Field label="Notes" err={errors.notes}>
          <Textarea value={draft.notes} onChange={(e) => onField?.("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
