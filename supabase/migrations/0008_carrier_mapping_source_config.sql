-- Preserve legacy carrier statement-import metadata that does not fit the
-- normalized statement-field -> CSV-header mapping shape.
alter table public.carrier_csv_mappings
add column source_config jsonb not null default '{}'::jsonb;
