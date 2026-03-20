-- ========== CRIAR E EXECUTAR NO SUPABASE (SQL Editor) ==========
-- Produtos: leitura para usuários logados; criação/edição/exclusão só para admin.

-- 1) Tabela de perfis (role: 'admin' ou 'user')
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Cada usuário pode ler seu próprio perfil
drop policy if exists "Usuário lê próprio perfil" on public.profiles;
create policy "Usuário lê próprio perfil"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- Inserção: trigger (security definer) ou usuário no primeiro acesso (id = auth.uid())
drop policy if exists "Usuário pode criar próprio perfil" on public.profiles;
create policy "Usuário pode criar próprio perfil"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Trigger: criar perfil ao cadastrar usuário (role 'user' por padrão)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Remover política que permitia anon fazer tudo em produtos
drop policy if exists "Permitir tudo para anon em produtos" on public.produtos;

-- 3) Produtos: leitura pública (qualquer um vê a lista); escrita só admin
drop policy if exists "Produtos leitura autenticados" on public.produtos;
create policy "Produtos leitura autenticados"
  on public.produtos for select to authenticated using (true);

drop policy if exists "Produtos leitura anon" on public.produtos;
create policy "Produtos leitura anon"
  on public.produtos for select to anon using (true);

-- 4) Produtos: inserir só admin
drop policy if exists "Produtos insert admin" on public.produtos;
create policy "Produtos insert admin"
  on public.produtos for insert to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5) Produtos: atualizar e deletar só admin
drop policy if exists "Produtos update delete admin" on public.produtos;
create policy "Produtos update delete admin"
  on public.produtos for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Produtos delete admin" on public.produtos;
create policy "Produtos delete admin"
  on public.produtos for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 6) Definir um usuário como admin (substitua EMAIL_DO_ADMIN pelo email real):
-- insert into public.profiles (id, role)
-- select id, 'admin' from auth.users where email = 'EMAIL_DO_ADMIN'
-- on conflict (id) do update set role = 'admin';

-- ========== Resto do script (tabela produtos, etc.) ==========
alter table public.produtos
  add column if not exists unidade text not null default 'un';

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sku text not null,
  categoria_id text not null,
  unidade text not null default 'un',
  estoque_minimo integer not null default 0,
  permite_negativo boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz default now()
);

alter table public.produtos enable row level security;
