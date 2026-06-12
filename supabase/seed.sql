-- Findway — minimal bootstrap seed.
-- Runs automatically on `supabase db reset`. Provides exactly one
-- admin user so you can sign in and the app shell renders. All
-- workspace tables (clients, documents, etc.) start empty.
--
-- To load the full sample dataset on top, run:  pnpm db:reset:sample
-- See: supabase/seeds/sample.sql
--
-- Admin credentials (local dev only):
--   email:    admin@example.com
--   password: dev-password

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'admin@example.com', '{"full_name":"Avery Admin"}')
on conflict (id) do nothing;

update auth.users set
  instance_id            = '00000000-0000-0000-0000-000000000000',
  aud                    = 'authenticated',
  role                   = 'authenticated',
  encrypted_password     = crypt('dev-password', gen_salt('bf')),
  email_confirmed_at     = now(),
  created_at             = now(),
  updated_at             = now(),
  confirmation_token     = '',
  recovery_token         = '',
  email_change_token_new = '',
  email_change           = ''
where id = '00000000-0000-4000-8000-000000000001';

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  u.email,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.id = '00000000-0000-4000-8000-000000000001'
on conflict do nothing;

update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001';
