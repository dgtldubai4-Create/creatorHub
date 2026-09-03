-- ============================================================================
-- Ruhh cloud sync — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Then set your admin token in the INSERT at the bottom, and copy the project
-- URL + anon key into the CLOUD constant in index.html (see README.md).
--
-- Security model: the anon key ships in the page (that is what it is for).
-- Anonymous visitors can only (a) read the published site document and
-- (b) call the RPCs below. Every write except create_order requires the
-- admin token, checked server-side; order status reads require the per-order
-- secret key that only the ordering device knows. The orders and admin_secret
-- tables have no direct anon access at all.
-- ============================================================================

create table if not exists site (
  id int primary key default 1 check (id = 1),   -- single-row document
  data jsonb not null default '{}'::jsonb,       -- {menu, cats, specials, settings}
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  code text primary key,                          -- RUH-YYMMDD-XXXX
  key text not null,                              -- per-order secret, held by the customer device
  payload jsonb not null,                         -- the full order (items, name, address, ...)
  status int not null default 0,                  -- 0 sent · 1 confirmed · 2 baking · 3 on the way/ready · 4 delivered
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_secret (
  id int primary key default 1 check (id = 1),
  token text not null
);

alter table site enable row level security;
alter table orders enable row level security;
alter table admin_secret enable row level security;

-- The published site document is world-readable; nothing else is.
drop policy if exists site_read on site;
create policy site_read on site for select using (true);

create or replace function check_admin(p_token text) returns boolean
language sql security definer set search_path = public as $$
  select exists(select 1 from admin_secret where id = 1 and token = p_token and length(p_token) >= 12);
$$;

create or replace function publish_site(p_token text, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_admin(p_token) then raise exception 'invalid admin token'; end if;
  insert into site(id, data, updated_at) values (1, p_data, now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end; $$;

create or replace function create_order(p_code text, p_key text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(p_code) > 40 or length(p_key) > 64 or pg_column_size(p_payload) > 50000 then
    raise exception 'order too large';
  end if;
  insert into orders(code, key, payload) values (p_code, p_key, p_payload);
end; $$;

create or replace function get_order(p_code text, p_key text) returns table(status int)
language sql security definer set search_path = public as $$
  select o.status from orders o where o.code = p_code and o.key = p_key;
$$;

create or replace function list_orders(p_token text)
returns table(code text, status int, payload jsonb, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not check_admin(p_token) then raise exception 'invalid admin token'; end if;
  return query
    select o.code, o.status, o.payload, o.created_at
    from orders o order by o.created_at desc limit 200;
end; $$;

create or replace function set_order_status(p_token text, p_code text, p_status int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not check_admin(p_token) then raise exception 'invalid admin token'; end if;
  update orders set status = greatest(0, least(4, p_status)), updated_at = now()
  where code = p_code;
end; $$;

-- check_admin is internal: only callable by the other definer functions.
revoke execute on function check_admin(text) from public, anon, authenticated;
grant execute on function
  publish_site(text, jsonb),
  create_order(text, text, jsonb),
  get_order(text, text),
  list_orders(text),
  set_order_status(text, text, int)
to anon;

-- ---------------------------------------------------------------------------
-- FINALLY: set the admin token (12+ chars; use a long random string).
-- Shweta pastes this same token into Admin → Settings → Cloud sync.
-- ---------------------------------------------------------------------------
-- insert into admin_secret(id, token) values (1, 'REPLACE_WITH_A_LONG_RANDOM_TOKEN')
--   on conflict (id) do update set token = excluded.token;
