/* EXAMPLE ENTITY — safe to delete; see README "Removing the example entity". */
import { Input, Textarea } from "@/components/ui/input";
import { FormField as Field } from "@/components/ui/form-field";
import { InfoCard } from "@/components/common/info-card";
import { KvList } from "@/components/common/kv-list";
import { ContactBadge } from "@/components/ui/badges";
import type { Contact } from "@/lib/supabase/types";
import type { ContactDraft } from "./contact-draft";

type Errors = Partial<Record<keyof ContactDraft, string>>;

export function ContactProfileCard({
  contact: c,
  editing = false,
  draft,
  errors = {},
  onField,
}: {
  contact: Contact;
  editing?: boolean;
  draft?: ContactDraft;
  errors?: Errors;
  onField?: (key: keyof ContactDraft, value: string) => void;
}) {
  return (
    <InfoCard title="Profile">
      {editing && draft ? (
        <ProfileForm draft={draft} errors={errors} onField={onField} />
      ) : (
        <KvList
          rows={[
            { label: "Status", value: <ContactBadge status={c.status} /> },
            { label: "Company", value: c.company ?? "—" },
            { label: "Email", value: c.email ?? "—" },
            { label: "Phone", value: c.phone ?? "—" },
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
  errors,
  onField,
}: {
  draft: ContactDraft;
  errors: Errors;
  onField?: (key: keyof ContactDraft, value: string) => void;
}) {
  const text = (
    key: keyof ContactDraft,
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
      {text("name", "Name", { required: true })}
      {text("company", "Company")}
      {text("email", "Email", { type: "email" })}
      {text("phone", "Phone")}
      <div className="col-span-2">
        <Field label="Notes" err={errors.notes}>
          <Textarea value={draft.notes} onChange={(e) => onField?.("notes", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
