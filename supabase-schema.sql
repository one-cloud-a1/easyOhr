-- easyOhr Supabase Schema
-- Run this in the Supabase SQL Editor

create table if not exists orders (
  id bigint generated always as identity primary key,
  mollie_order_id text unique not null,
  status text not null default 'created',
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  customer_address text,
  items jsonb not null default '[]',
  total decimal(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists idx_orders_mollie_id on orders(mollie_order_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_email on orders(customer_email);

-- RLS policies
alter table orders enable row level security;

-- Users can read their own orders (matched by email from auth)
create policy "Users can read own orders"
  on orders for select
  using (auth.jwt() ->> 'email' = customer_email);

-- Service role can do everything (used by Cloudflare Worker)
create policy "Service role full access"
  on orders for all
  using (auth.role() = 'service_role');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at();
