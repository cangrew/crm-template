import { Input, Textarea } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { CarrierBadge } from "@/components/ui/badges";
import type { Carrier } from "@/lib/supabase/types";
import type { CarrierDraft } from "./carrier-draft";

type Errors = Partial<Record<keyof CarrierDraft, string>>;

export function CarrierProfileCard({
  carrier: k,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  carrier: Carrier;
  editing?: boolean;
  draft?: CarrierDraft;
  errors?: Errors;
  onField?: (key: keyof CarrierDraft, value: string) => void;
}) {
  return (
    <InfoCard title="Carrier">
      {editing && draft ? (
        <ProfileForm draft={draft} errors={errors} onField={onField} />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <CarrierBadge status={k.status} /> },
            { label: "Added", value: k.created_at.slice(0, 10) },
            { label: "Last updated", value: k.updated_at.slice(0, 10) },
            { label: "Notes", value: k.notes ?? "—" },
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
  draft: CarrierDraft;
  errors: Errors;
  onField?: (key: keyof CarrierDraft, value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <Field label="Name" required err={errors.name}>
        <Input
          err={!!errors.name}
          value={draft.name}
          onChange={(e) => onField?.("name", e.target.value)}
        />
      </Field>
      <Field label="Notes" err={errors.notes}>
        <Textarea value={draft.notes} onChange={(e) => onField?.("notes", e.target.value)} />
      </Field>
    </div>
  );
}
