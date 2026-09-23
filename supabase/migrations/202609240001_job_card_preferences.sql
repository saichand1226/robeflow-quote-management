create table if not exists public.job_card_preferences (
  id integer primary key default 1 check (id = 1),
  visible_fields jsonb not null default '["createdAt","siteAddress","customerName","phone","serviceType","salespersonName","amount","invoiceStatus"]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.job_card_preferences (id)
values (1)
on conflict (id) do nothing;

alter table public.job_card_preferences enable row level security;
