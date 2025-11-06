-- Supabase schema for AIJMIROSHOP
-- Run this in your Supabase project's SQL editor

create table if not exists inventory (
  id text primary key,
  nombre text not null,
  color text,
  stock integer default 0,
  costo numeric default 0,
  precio numeric default 0,
  categoria text,
  created_at timestamp with time zone default now()
);

create table if not exists clients (
  id text primary key,
  nombre text not null,
  cedula text,
  telefono text,
  direccion text,
  created_at timestamp with time zone default now()
);

create table if not exists history (
  id text primary key,
  cliente text,
  cliente_id text,
  fecha timestamp with time zone default now(),
  items jsonb default '[]'::jsonb,
  subtotal numeric default 0,
  descuento numeric default 0,
  total numeric default 0,
  envio text,
  pago text,
  atendido_por text,
  estado text default 'Pendiente'
);

create table if not exists users (
  id text primary key,
  username text not null,
  role text not null,
  password text not null,
  enabled boolean default true,
  modules jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- global settings (single-row or multi-tenant por id)
create table if not exists settings (
  id text primary key,
  ticket_company_name text,
  ticket_email text,
  ticket_address text,
  ticket_refs jsonb default '[]'::jsonb,
  ticket_footer text,
  updated_at timestamp with time zone default now()
);

-- Recommended Row Level Security (RLS) off for anon demo; enable and policies for production
alter table inventory enable row level security;
alter table clients enable row level security;
alter table history enable row level security;
alter table users enable row level security;
alter table settings enable row level security;

-- Public read/write for anon (demo). Replace with proper policies in production.
-- Postgres no soporta IF NOT EXISTS en CREATE POLICY, por eso usamos DROP IF EXISTS antes.

-- inventory
drop policy if exists "anon_read_inventory" on inventory;
drop policy if exists "anon_write_inventory" on inventory;
drop policy if exists "anon_update_inventory" on inventory;
drop policy if exists "anon_delete_inventory" on inventory;
create policy "anon_read_inventory" on inventory for select to anon using (true);
create policy "anon_write_inventory" on inventory for insert to anon with check (true);
create policy "anon_update_inventory" on inventory for update to anon using (true) with check (true);
create policy "anon_delete_inventory" on inventory for delete to anon using (true);

-- clients
drop policy if exists "anon_read_clients" on clients;
drop policy if exists "anon_write_clients" on clients;
drop policy if exists "anon_update_clients" on clients;
drop policy if exists "anon_delete_clients" on clients;
create policy "anon_read_clients" on clients for select to anon using (true);
create policy "anon_write_clients" on clients for insert to anon with check (true);
create policy "anon_update_clients" on clients for update to anon using (true) with check (true);
create policy "anon_delete_clients" on clients for delete to anon using (true);

-- history
drop policy if exists "anon_read_history" on history;
drop policy if exists "anon_write_history" on history;
drop policy if exists "anon_update_history" on history;
drop policy if exists "anon_delete_history" on history;
create policy "anon_read_history" on history for select to anon using (true);
create policy "anon_write_history" on history for insert to anon with check (true);
create policy "anon_update_history" on history for update to anon using (true) with check (true);
create policy "anon_delete_history" on history for delete to anon using (true);

-- users
drop policy if exists "anon_read_users" on users;
drop policy if exists "anon_write_users" on users;
drop policy if exists "anon_update_users" on users;
drop policy if exists "anon_delete_users" on users;
create policy "anon_read_users" on users for select to anon using (true);
create policy "anon_write_users" on users for insert to anon with check (true);
create policy "anon_update_users" on users for update to anon using (true) with check (true);
create policy "anon_delete_users" on users for delete to anon using (true);

-- settings
drop policy if exists "anon_read_settings" on settings;
drop policy if exists "anon_write_settings" on settings;
drop policy if exists "anon_update_settings" on settings;
drop policy if exists "anon_delete_settings" on settings;
create policy "anon_read_settings" on settings for select to anon using (true);
create policy "anon_write_settings" on settings for insert to anon with check (true);
create policy "anon_update_settings" on settings for update to anon using (true) with check (true);
create policy "anon_delete_settings" on settings for delete to anon using (true);

-- Enable Realtime replication (so INSERT/UPDATE/DELETE se transmiten a clientes suscritos)
do $$ begin
  alter publication supabase_realtime add table inventory;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table clients;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table history;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table users;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table settings;
exception when duplicate_object then null; end $$;
