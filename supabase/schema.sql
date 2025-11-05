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

-- Recommended Row Level Security (RLS) off for anon demo; enable and policies for production
alter table inventory enable row level security;
alter table clients enable row level security;
alter table history enable row level security;
alter table users enable row level security;

-- Public read/write for anon (demo). Replace with proper policies in production.
create policy if not exists "anon_read_inventory" on inventory for select to anon using (true);
create policy if not exists "anon_write_inventory" on inventory for insert with check (true);
create policy if not exists "anon_update_inventory" on inventory for update using (true) with check (true);
create policy if not exists "anon_delete_inventory" on inventory for delete using (true);

create policy if not exists "anon_read_clients" on clients for select to anon using (true);
create policy if not exists "anon_write_clients" on clients for insert with check (true);
create policy if not exists "anon_update_clients" on clients for update using (true) with check (true);
create policy if not exists "anon_delete_clients" on clients for delete using (true);

create policy if not exists "anon_read_history" on history for select to anon using (true);
create policy if not exists "anon_write_history" on history for insert with check (true);
create policy if not exists "anon_update_history" on history for update using (true) with check (true);
create policy if not exists "anon_delete_history" on history for delete using (true);

create policy if not exists "anon_read_users" on users for select to anon using (true);
create policy if not exists "anon_write_users" on users for insert with check (true);
create policy if not exists "anon_update_users" on users for update using (true) with check (true);
create policy if not exists "anon_delete_users" on users for delete using (true);
