-- Cole este bloco no SQL Editor do Supabase (uma vez)

-- 1. Role enum + table
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

drop policy if exists "users can read own roles" on public.user_roles;
create policy "users can read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 2. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  birth_date date,
  diabetes_type text check (diabetes_type in ('tipo1','tipo2')),
  glucose_min int not null default 70,
  glucose_max int not null default 180,
  foods_better text,
  foods_worse text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'user') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill
insert into public.profiles (id, email, display_name)
select u.id, u.email, split_part(u.email,'@',1)
from auth.users u on conflict (id) do nothing;
insert into public.user_roles (user_id, role)
select id, 'user' from auth.users on conflict do nothing;

-- 4. Seed admin
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'allexandregabbera@gmail.com'
on conflict do nothing;

-- 5. Admin pode ler/inserir medições de qualquer user
drop policy if exists "admins read all measurements" on public.measurements;
create policy "admins read all measurements" on public.measurements
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "admins insert any measurement" on public.measurements;
create policy "admins insert any measurement" on public.measurements
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));