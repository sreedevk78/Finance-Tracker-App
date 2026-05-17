create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  label text not null,
  tone text not null default '#6d7480',
  keywords text[] not null default '{}'::text[]
);

insert into public.categories (id, label, tone, keywords) values
  ('food', 'Food', '#b85c38', array['swiggy','zomato','cafe','restaurant','food','grocery','mess','canteen']),
  ('shopping', 'Shopping', '#8060a8', array['amazon','flipkart','myntra','store','shop','retail']),
  ('transport', 'Transport', '#2f7a78', array['uber','ola','metro','fuel','petrol','bus','train','irctc']),
  ('bills', 'Bills', '#a77b2c', array['rent','electricity','utility','internet','phone','bill','airtel','jio']),
  ('subscriptions', 'Subscriptions', '#4f72c8', array['netflix','spotify','prime','subscription','icloud','google one']),
  ('education', 'Education', '#3f69a8', array['college','school','course','tuition','book','exam']),
  ('health', 'Health', '#4e8b55', array['pharmacy','doctor','clinic','medical','hospital','gym']),
  ('transfers', 'Transfers', '#606976', array['transfer','upi','self','wallet']),
  ('income', 'Income', '#2b8c66', array['salary','stipend','allowance','payroll','invoice','received']),
  ('other', 'Other', '#6d7480', array[]::text[])
on conflict (id) do update set
  label = excluded.label,
  tone = excluded.tone,
  keywords = excluded.keywords;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  lifestyle text not null check (lifestyle in ('student','freelancer','salaried','business_owner','custom')),
  cashflow_cadence text not null,
  expected_monthly_inflow numeric(14,2),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'INR',
  currency_symbol text not null default '₹',
  balance numeric(14,2) not null default 0,
  balance_known boolean not null default false,
  balance_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('debit','credit','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  merchant_name text not null,
  category_id text not null default 'other',
  date date not null,
  note text,
  source text not null default 'manual',
  external_ref text,
  vpa text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists type text;
alter table public.transactions add column if not exists date date;
alter table public.transactions add column if not exists note text;
alter table public.transactions add column if not exists external_ref text;
alter table public.transactions add column if not exists vpa text;
update public.transactions
set
  type = coalesce(type, transaction_type, 'debit'),
  date = coalesce(date, transaction_date::date, created_at::date),
  note = coalesce(note, description)
where type is null or date is null;
alter table public.transactions alter column type set default 'debit';
alter table public.transactions alter column date set default current_date;
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions add constraint transactions_source_check
  check (source in ('manual','sync','import','ai','csv_import','upi_csv_import','gpay_upi_import','gpay_upi_bulk_import'));

create unique index if not exists transactions_user_source_ref_idx
on public.transactions(user_id, source, external_ref)
where external_ref is not null and external_ref <> '';

create unique index if not exists transactions_user_external_ref_idx
on public.transactions(user_id, external_ref)
where external_ref is not null and external_ref <> '';

create index if not exists transactions_user_date_idx on public.transactions(user_id, date desc);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id);
create index if not exists transactions_user_source_idx on public.transactions(user_id, source);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  deadline date,
  status text not null default 'active' check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_status_idx on public.goals(user_id, status, created_at desc);

alter table public.profiles add column if not exists lifestyle text;
alter table public.profiles add column if not exists cashflow_cadence text;
alter table public.profiles add column if not exists expected_monthly_inflow numeric(14,2);
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
update public.profiles
set
  lifestyle = coalesce(lifestyle, case when financial_persona in ('student','freelancer','salaried','business_owner','custom') then financial_persona else 'custom' end, 'custom'),
  cashflow_cadence = coalesce(cashflow_cadence, 'unknown'),
  expected_monthly_inflow = coalesce(expected_monthly_inflow, monthly_income),
  onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
where lifestyle is null or cashflow_cadence is null;
alter table public.profiles alter column lifestyle set default 'custom';
alter table public.profiles alter column cashflow_cadence set default 'unknown';
create index if not exists profiles_user_id_idx on public.profiles(user_id);

alter table public.accounts add column if not exists currency_symbol text;
alter table public.accounts add column if not exists balance numeric(14,2);
alter table public.accounts add column if not exists balance_known boolean;
alter table public.accounts add column if not exists balance_updated_at timestamptz;
update public.accounts
set
  currency_symbol = coalesce(currency_symbol, case currency when 'INR' then '₹' when 'EUR' then '€' when 'GBP' then '£' else '$' end),
  balance = coalesce(balance, current_balance, 0),
  balance_known = coalesce(balance_known, true),
  balance_updated_at = coalesce(balance_updated_at, updated_at, created_at)
where currency_symbol is null or balance is null or balance_known is null;
alter table public.accounts alter column currency_symbol set default '₹';
alter table public.accounts alter column balance set default 0;
alter table public.accounts alter column balance_known set default false;
create index if not exists accounts_user_id_idx on public.accounts(user_id);

alter table public.transactions add column if not exists type text;
alter table public.transactions add column if not exists date date;
alter table public.transactions add column if not exists note text;
alter table public.transactions add column if not exists external_ref text;
alter table public.transactions add column if not exists vpa text;
update public.transactions
set
  type = coalesce(type, transaction_type, 'debit'),
  date = coalesce(date, transaction_date::date, created_at::date),
  note = coalesce(note, description)
where type is null or date is null;
alter table public.transactions alter column type set default 'debit';
alter table public.transactions alter column date set default current_date;

alter table public.goals add column if not exists updated_at timestamptz default now();

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null default 'profile',
  content jsonb not null default '{}'::jsonb,
  confidence integer not null default 0 check (confidence between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_memories add column if not exists content jsonb;
alter table public.ai_memories add column if not exists confidence integer;
update public.ai_memories
set
  content = coalesce(content, jsonb_build_object('text', memory_content)),
  confidence = coalesce(confidence, greatest(0, least(100, round(importance_score * 100)::integer)))
where content is null or confidence is null;

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  accepted integer not null default 0,
  rejected integer not null default 0,
  facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists imports_user_created_idx on public.imports(user_id, created_at desc);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  confidence integer,
  facts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_user_created_idx on public.coach_messages(user_id, created_at);

create index if not exists ai_memories_user_type_idx on public.ai_memories(user_id, memory_type, updated_at desc);

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
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists accounts_updated_at on public.accounts;
create trigger accounts_updated_at before update on public.accounts for each row execute function public.set_updated_at();

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();

drop trigger if exists ai_memories_updated_at on public.ai_memories;
create trigger ai_memories_updated_at before update on public.ai_memories for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.imports enable row level security;
alter table public.coach_messages enable row level security;
alter table public.ai_memories enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "accounts_select_own" on public.accounts;
create policy "accounts_select_own" on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "accounts_insert_own" on public.accounts;
create policy "accounts_insert_own" on public.accounts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "accounts_update_own" on public.accounts;
create policy "accounts_update_own" on public.accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "imports_select_own" on public.imports;
create policy "imports_select_own" on public.imports for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "imports_insert_own" on public.imports;
create policy "imports_insert_own" on public.imports for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "coach_messages_select_own" on public.coach_messages;
create policy "coach_messages_select_own" on public.coach_messages for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "coach_messages_insert_own" on public.coach_messages;
create policy "coach_messages_insert_own" on public.coach_messages for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "coach_messages_delete_own" on public.coach_messages;
create policy "coach_messages_delete_own" on public.coach_messages for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "ai_memories_select_own" on public.ai_memories;
create policy "ai_memories_select_own" on public.ai_memories for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "ai_memories_insert_own" on public.ai_memories;
create policy "ai_memories_insert_own" on public.ai_memories for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "ai_memories_update_own" on public.ai_memories;
create policy "ai_memories_update_own" on public.ai_memories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'accounts') then
    alter publication supabase_realtime add table public.accounts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goals') then
    alter publication supabase_realtime add table public.goals;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'coach_messages') then
    alter publication supabase_realtime add table public.coach_messages;
  end if;
end;
$$;
