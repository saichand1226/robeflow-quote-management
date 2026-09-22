alter table public.quotes
  add column if not exists deposit_invoice_number text not null default '',
  add column if not exists deposit_invoice_sent_at timestamptz,
  add column if not exists balance_invoice_number text not null default '',
  add column if not exists balance_invoice_sent_at timestamptz,
  add column if not exists order_confirmation_sent_at timestamptz;
