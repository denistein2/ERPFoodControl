-- ==========================================
-- SQL FIX: PERMISSÕES E RLS (ERP FOOD)
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. Tabela: products (Bug 2)
-- Permite que qualquer usuário logado possa inserir/editar produtos
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON public.products;
CREATE POLICY "Permitir tudo para autenticados" ON public.products
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Tabela: baking_batches (Bug 4)
-- Resolve o erro de cadastro/atualização na Cozinha
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON public.baking_batches;
CREATE POLICY "Permitir tudo para autenticados" ON public.baking_batches
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Tabela: cashier_sessions (Bug 3)
-- Garante que o caixa possa ser aberto sem erros de RLS
DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON public.cashier_sessions;
CREATE POLICY "Permitir tudo para autenticados" ON public.cashier_sessions
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Perfil: Garantir permissão de gerenciamento no nível de aplicação
-- Isso evita qualquer trava residual no frontend para o usuário de teste
UPDATE public.profiles 
SET can_manage_products = true, role = 'admin'
WHERE email = 'contato@steintechnology.com.br';

-- 5. Tabelas Adicionais (Segurança Preventiva)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baking_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
