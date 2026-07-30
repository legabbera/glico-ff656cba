-- Cole este bloco no SQL Editor do Supabase (uma vez)

-- Coluna de acesso gratuito vitalício (marcada pelo admin)
alter table public.profiles
  add column if not exists free_access boolean not null default false;
