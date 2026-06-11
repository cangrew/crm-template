-- CRM Template — documents library with private Storage bucket.
-- Documents may stand alone (contact_id null) or attach to a contact (the
-- example entity). When you remove the example, drop the contact_id FK and
-- re-point it at your real entity.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts (id) on delete cascade,
  kind text not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_documents_contact on public.documents (contact_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security: every active role reads; admin & manager manage.
-- ---------------------------------------------------------------------------
alter table public.documents enable row level security;

create policy documents_select on public.documents
for select to authenticated
using (public.has_role('admin', 'manager', 'member'));

create policy documents_insert on public.documents
for insert to authenticated
with check (public.has_role('admin', 'manager'));

create policy documents_update on public.documents
for update to authenticated
using (public.has_role('admin', 'manager'))
with check (public.has_role('admin', 'manager'));

create policy documents_delete on public.documents
for delete to authenticated
using (public.has_role('admin', 'manager'));

-- ---------------------------------------------------------------------------
-- Storage: one private bucket; access is brokered via signed URLs. Policies
-- gate through has_role() (not bare `to authenticated`) so pending and
-- deactivated accounts cannot touch objects. Members keep select because the
-- download route mints signed URLs with the caller's own client after its
-- requireApiRole() check.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents bucket read" on storage.objects
for select to authenticated
using (bucket_id = 'documents' and public.has_role('admin', 'manager', 'member'));

create policy "documents bucket insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'documents' and public.has_role('admin', 'manager'));

create policy "documents bucket update" on storage.objects
for update to authenticated
using (bucket_id = 'documents' and public.has_role('admin', 'manager'))
with check (bucket_id = 'documents' and public.has_role('admin', 'manager'));

create policy "documents bucket delete" on storage.objects
for delete to authenticated
using (bucket_id = 'documents' and public.has_role('admin', 'manager'));
