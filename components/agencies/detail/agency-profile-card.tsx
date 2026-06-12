import { Input, Textarea } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { AgencyBadge } from "@/components/ui/badges";
import { fmtBpsPercent } from "@/lib/domain/bps";
import type { Agency } from "@/lib/supabase/types";
import type { AgencyDraft } from "./agency-draft";

type Errors = Partial<Record<keyof AgencyDraft, string>>;

export function AgencyProfileCard({
  agency: g,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  agency: Agency;
  editing?: boolean;
  draft?: AgencyDraft;
  errors?: Errors;
  onField?: (key: keyof AgencyDraft, value: string) => void;
}) {
  return (
    <InfoCard title="Agency">
      {editing && draft ? (
        <ProfileForm draft={draft} errors={errors} onField={onField} />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <AgencyBadge status={g.status} /> },
            { label: "Commission cut", value: fmtBpsPercent(g.commission_cut_bps) },
            { label: "Override cut", value: fmtBpsPercent(g.override_cut_bps) },
            { label: "Added", value: g.created_at.slice(0, 10) },
            { label: "Last updated", value: g.updated_at.slice(0, 10) },
            { label: "Notes", value: g.notes ?? "—" },
          ]}
        />
      )}
    </InfoCard>
  );
}

function ProfileForm({
  draft,
  errors,
  onField,
}: {
  draft: AgencyDraft;
  errors: Errors;
  onField?: (key: keyof AgencyDraft, value: string) => void;
}) {
  const text = (key: keyof AgencyDraft, label: string, opts: { required?: boolean } = {}) => (
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
      <div className="col-span-2">{text("name", "Name", { required: true })}</div>
      {text("commission_cut_pct", "Commission cut (%)")}
      {text("override_cut_pct", "Override cut (%)")}
      <div className="col-span-2">
        <Field label="Notes" err={errors.notes}>
          <Textarea value={draft.notes} onChange={(e) => onField?.("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
