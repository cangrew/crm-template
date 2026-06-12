import Link from "next/link";
import { Input, Select, Textarea } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { PolicyBadge } from "@/components/ui/badges";
import { fmtPremium } from "@/components/policies/policies-table";
import type { Agent, Carrier, Client, Policy } from "@/lib/supabase/types";
import type { PolicyDraft } from "./policy-draft";

type Errors = Partial<Record<keyof PolicyDraft, string>>;

export function PolicyProfileCard({
  policy: p,
  clients,
  carriers,
  agents,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  policy: Policy;
  clients: Client[];
  carriers: Carrier[];
  agents: Agent[];
  editing?: boolean;
  draft?: PolicyDraft;
  errors?: Errors;
  onField?: (key: keyof PolicyDraft, value: string) => void;
}) {
  const client = clients.find((c) => c.id === p.client_id);
  const carrier = carriers.find((k) => k.id === p.carrier_id);
  const agent = agents.find((a) => a.id === p.agent_id);
  return (
    <InfoCard title="Policy">
      {editing && draft ? (
        <ProfileForm
          draft={draft}
          clients={clients}
          carriers={carriers}
          agents={agents}
          errors={errors}
          onField={onField}
        />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <PolicyBadge status={p.status} /> },
            {
              label: "Client",
              value: client ? (
                <Link href={`/clients/${client.id}`}>
                  {client.first_name} {client.last_name}
                </Link>
              ) : (
                "—"
              ),
            },
            {
              label: "Carrier",
              value: carrier ? <Link href={`/carriers/${carrier.id}`}>{carrier.name}</Link> : "—",
            },
            {
              label: "Agent",
              value: agent ? <Link href={`/agents/${agent.id}`}>{agent.full_name}</Link> : "—",
            },
            { label: "Policy #", value: p.policy_number ?? "—" },
            { label: "Member ID", value: p.carrier_member_id ?? "—" },
            { label: "Plan", value: p.plan_name ?? "—" },
            { label: "Members", value: p.member_count },
            { label: "Premium", value: fmtPremium(p.monthly_premium_cents) },
            { label: "Effective", value: p.effective_date ?? "—" },
            { label: "Effectuated", value: p.effectuated_at ?? "—" },
            { label: "Original effective", value: p.original_effective_date ?? "—" },
            { label: "Terminated", value: p.termination_date ?? "—" },
            { label: "Notes", value: p.notes ?? "—" },
          ]}
        />
      )}
    </InfoCard>
  );
}

function ProfileForm({
  draft,
  clients,
  carriers,
  agents,
  errors,
  onField,
}: {
  draft: PolicyDraft;
  clients: Client[];
  carriers: Carrier[];
  agents: Agent[];
  errors: Errors;
  onField?: (key: keyof PolicyDraft, value: string) => void;
}) {
  const text = (
    key: keyof PolicyDraft,
    label: string,
    opts: { placeholder?: string; type?: string } = {},
  ) => (
    <Field label={label} err={errors[key]}>
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
      <Field label="Client" required err={errors.client_id}>
        <Select value={draft.client_id} onChange={(e) => onField?.("client_id", e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.last_name}, {c.first_name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Carrier" required err={errors.carrier_id}>
        <Select value={draft.carrier_id} onChange={(e) => onField?.("carrier_id", e.target.value)}>
          {carriers.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Agent" required err={errors.agent_id}>
        <Select value={draft.agent_id} onChange={(e) => onField?.("agent_id", e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </Select>
      </Field>
      {text("policy_number", "Policy number")}
      {text("carrier_member_id", "Carrier member ID")}
      {text("plan_name", "Plan name")}
      {text("member_count", "Member count", { type: "number" })}
      {text("monthly_premium", "Monthly premium ($)", { placeholder: "e.g. 450.00" })}
      {text("effective_date", "Effective date", { type: "date" })}
      {text("effectuated_at", "Effectuated", { type: "date" })}
      {text("original_effective_date", "Original effective", { type: "date" })}
      {text("termination_date", "Termination date", { type: "date" })}
      <div className="col-span-2">
        <Field label="Notes" err={errors.notes}>
          <Textarea value={draft.notes} onChange={(e) => onField?.("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
