create table if not exists public.idempotency_keys (
  key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  request_hash text null,
  response jsonb not null,
  status_code integer not null default 200,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
create index if not exists idempotency_keys_user_endpoint_idx on public.idempotency_keys(user_id, endpoint);
create index if not exists idempotency_keys_expires_at_idx on public.idempotency_keys(expires_at);
alter table public.idempotency_keys enable row level security;
drop policy if exists "idempotency service role only" on public.idempotency_keys;
create policy "idempotency service role only" on public.idempotency_keys for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.pending_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  status text not null default 'pending',
  job_id uuid null references public.jobs(id) on delete set null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz null,
  expires_at timestamptz not null default now() + interval '24 hours',
  constraint pending_uploads_status_check check (status in ('pending', 'consumed', 'deleted', 'failed'))
);
create index if not exists pending_uploads_user_status_idx on public.pending_uploads(user_id, status);
create unique index if not exists pending_uploads_bucket_path_unique on public.pending_uploads(storage_bucket, storage_path);
create index if not exists pending_uploads_storage_path_idx on public.pending_uploads(storage_path);
create index if not exists pending_uploads_expires_at_idx on public.pending_uploads(expires_at);
alter table public.pending_uploads enable row level security;
drop policy if exists "pending uploads user read own" on public.pending_uploads;
create policy "pending uploads user read own" on public.pending_uploads for select using (auth.uid() = user_id);
drop policy if exists "pending uploads service role all" on public.pending_uploads;
create policy "pending uploads service role all" on public.pending_uploads for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
