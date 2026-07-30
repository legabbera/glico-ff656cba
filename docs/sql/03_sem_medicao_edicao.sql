-- Cole este bloco no SQL Editor do Supabase (uma vez)

-- 1. Permitir linhas "sem medição" (valor/contexto/hora opcionais)
alter table public.measurements alter column valor drop not null;
alter table public.measurements alter column contexto drop not null;
alter table public.measurements alter column hora drop not null;

alter table public.measurements
  add column if not exists sem_medicao boolean not null default false;

-- 2. Permitir que o dono edite e apague suas próprias medições
drop policy if exists "users update own measurements" on public.measurements;
create policy "users update own measurements" on public.measurements
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users delete own measurements" on public.measurements;
create policy "users delete own measurements" on public.measurements
  for delete to authenticated
  using (auth.uid() = user_id);

-- 3. Admin também pode atualizar/apagar
drop policy if exists "admins update any measurement" on public.measurements;
create policy "admins update any measurement" on public.measurements
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admins delete any measurement" on public.measurements;
create policy "admins delete any measurement" on public.measurements
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));