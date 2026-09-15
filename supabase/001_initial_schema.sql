-- THREESIXTYFX Build 02
-- Run this entire file in Supabase SQL Editor.
-- This creates the user profile layer and the tables Build 03 will use.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  strategy text not null check (strategy in ('Trend Following','Scalping','Grid','Martingale','Arbitrage','Mean Reversion')),
  pair text not null default 'EUR/USD',
  status text not null default 'paused' check (status in ('active','paused','stopped')),
  risk_level text not null default 'medium' check (risk_level in ('low','medium','high')),
  lot_size numeric(10,4) not null default 0.1,
  max_drawdown numeric(10,2) not null default 10,
  take_profit_pips integer not null default 50,
  stop_loss_pips integer not null default 25,
  account_id uuid,
  total_profit numeric(14,2) not null default 0,
  win_rate numeric(6,2) not null default 0,
  total_trades integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'MetaTrader 5' check (platform in ('MetaTrader 5','MetaTrader 4','cTrader','NinjaTrader')),
  broker text not null,
  account_number text,
  server text,
  balance numeric(14,2) not null default 0,
  equity numeric(14,2) not null default 0,
  leverage text,
  currency text not null default 'USD',
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bots
  drop constraint if exists bots_account_id_fkey;
alter table public.bots
  add constraint bots_account_id_fkey foreign key (account_id) references public.trading_accounts(id) on delete set null;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bot_id uuid references public.bots(id) on delete set null,
  account_id uuid references public.trading_accounts(id) on delete set null,
  pair text not null,
  type text not null check (type in ('buy','sell')),
  volume numeric(10,4) not null default 0.1,
  open_price numeric(18,8),
  close_price numeric(18,8),
  profit numeric(14,2) not null default 0,
  pips numeric(12,2) not null default 0,
  status text not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro','lifetime')),
  status text not null default 'pending' check (status in ('pending','active','cancelled','expired','failed')),
  paystack_reference text unique,
  amount_subunit bigint,
  currency text not null default 'ZAR',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_risk_level text not null default 'medium' check (default_risk_level in ('low','medium','high')),
  max_daily_loss numeric(14,2) not null default 500,
  max_open_trades integer not null default 5,
  auto_close_on_drawdown boolean not null default true,
  trading_hours text not null default '24/5',
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do update set full_name = excluded.full_name, updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists bots_updated_at on public.bots;
create trigger bots_updated_at before update on public.bots for each row execute procedure public.set_updated_at();
drop trigger if exists trading_accounts_updated_at on public.trading_accounts;
create trigger trading_accounts_updated_at before update on public.trading_accounts for each row execute procedure public.set_updated_at();
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute procedure public.set_updated_at();
drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.bots enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.trades enable row level security;
alter table public.subscriptions enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists bots_all_own on public.bots;
create policy bots_all_own on public.bots for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists accounts_all_own on public.trading_accounts;
create policy accounts_all_own on public.trading_accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists trades_all_own on public.trades;
create policy trades_all_own on public.trades for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions for select to authenticated using (user_id = auth.uid());

drop policy if exists settings_all_own on public.user_settings;
create policy settings_all_own on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Build 02 intentionally does not allow normal users to create/update subscription rows.
-- Paystack webhook/server code will handle entitlement updates in the next build.
-- ============================================
-- THREESIXTYFX LICENSE SYSTEM
-- Build 2 License Foundation
-- ============================================

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,

  plan text not null
    check (plan in ('pro', 'lifetime')),

  status text not null default 'unused'
    check (status in ('unused', 'active', 'expired', 'revoked')),

  created_by uuid references auth.users(id) on delete set null,

  used_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),

  activated_at timestamptz,

  expires_at timestamptz,

  updated_at timestamptz not null default now()
);

-- Automatically update the updated_at timestamp
drop trigger if exists licenses_updated_at on public.licenses;

create trigger licenses_updated_at
before update on public.licenses
for each row
execute procedure public.set_updated_at();

-- Enable Row Level Security
alter table public.licenses enable row level security;

-- Users may only see licenses that belong to their own account.
drop policy if exists licenses_select_own on public.licenses;

create policy licenses_select_own
on public.licenses
for select
to authenticated
using (
  used_by = auth.uid()
);

-- Users must NOT be allowed to create, edit, revoke,
-- or delete licenses directly.
--
-- License creation and administration will be handled
-- by the THREESIXTYFX admin system.
-- ============================================
-- THREESIXTYFX SECURE LICENSE FUNCTIONS
-- ============================================

-- Check whether the currently logged-in user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- Allow an admin to generate a new license code.
create or replace function public.generate_license(
  p_plan text,
  p_days integer default 30
)
returns public.licenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_license public.licenses;
begin

  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_plan not in ('pro', 'lifetime') then
    raise exception 'Invalid license plan';
  end if;

  if p_plan = 'pro'
     and (p_days is null or p_days < 1 or p_days > 3650) then
    raise exception 'Invalid Pro license duration';
  end if;

  v_code :=
    'TFX-' ||
    upper(p_plan) ||
    '-' ||
    upper(encode(gen_random_bytes(4), 'hex')) ||
    '-' ||
    upper(encode(gen_random_bytes(4), 'hex'));

  insert into public.licenses (
    code,
    plan,
    status,
    created_by
  )
  values (
    v_code,
    p_plan,
    'unused',
    auth.uid()
  )
  returning * into v_license;

  return v_license;

end;
$$;

revoke all on function public.generate_license(text, integer) from public;
grant execute on function public.generate_license(text, integer) to authenticated;


-- Allow a logged-in customer to activate an unused license.
create or replace function public.activate_license(
  p_code text
)
returns public.licenses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_license public.licenses;
begin

  if auth.uid() is null then
    raise exception 'You must be logged in to activate a license';
  end if;

  select *
  into v_license
  from public.licenses
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'Invalid activation code';
  end if;

  if v_license.status = 'revoked' then
    raise exception 'This activation code has been revoked';
  end if;

  if v_license.status <> 'unused' then
    raise exception 'This activation code has already been used';
  end if;

  update public.licenses
  set
    status = 'active',
    used_by = auth.uid(),
    activated_at = now(),
    expires_at = case
      when plan = 'pro' then now() + interval '30 days'
      else null
    end,
    updated_at = now()
  where id = v_license.id
  returning * into v_license;

  return v_license;

end;
$$;

revoke all on function public.activate_license(text) from public;
grant execute on function public.activate_license(text) to authenticated;


-- Admins can view all license records.
drop policy if exists licenses_admin_select on public.licenses;

create policy licenses_admin_select
on public.licenses
for select
to authenticated
using (
  public.is_admin()
);