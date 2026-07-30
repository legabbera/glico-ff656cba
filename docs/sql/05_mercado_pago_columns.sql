-- Cole este bloco no SQL Editor do Supabase (uma vez)

-- Colunas para integração de pagamento com Mercado Pago na tabela profiles
alter table public.profiles
  add column if not exists subscription_status text default 'inactive',
  add column if not exists subscription_active_until timestamptz default null;
