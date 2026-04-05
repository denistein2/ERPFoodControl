-- Criar tabela de configuração do PIX
create table if not exists public.pix_config (
  id uuid primary key default gen_random_uuid(),
  pix_key text not null,
  merchant_name text not null default 'Estabelecimento',
  city text not null default 'Cidade',
  updated_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table public.pix_config enable row level security;

-- Política para leitura (Usuários Autenticados)
create policy "Permitir leitura para usuários autenticados"
on public.pix_config for select
to authenticated
using (true);

-- Política para inserção/atualização (Usuários Autenticados)
create policy "Permitir inserção para usuários autenticados"
on public.pix_config for insert
to authenticated
with check (true);

create policy "Permitir atualização para usuários autenticados"
on public.pix_config for update
to authenticated
using (true);

-- Inserir dados iniciais se a tabela estiver vazia
insert into public.pix_config (pix_key, merchant_name, city)
select 'seu-pix-aqui', 'Estabelecimento', 'Cidade'
where not exists (select 1 from public.pix_config);
