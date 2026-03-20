-- ============================================================
-- SEED SQL: DEMO COMPLETA PARA ERP FOOD (Padaria) - VERSÃO ROBUSTA
-- ============================================================

-- 1. Inserção de Produtos com Resolução de Conflitos
INSERT INTO public.products (name, sku, cost_price, sell_price, current_stock, min_stock, is_quick_access, unidade) VALUES
('Pão Francês Unitário', 'PAO001', 0.25, 0.75, 450, 100, true, 'un'),
('Pão de Queijo Mineiro', 'PAO002', 0.80, 4.00, 12, 50, true, 'un'),
('Coxinha de Frango c/ Catupiry', 'SAL001', 2.50, 8.50, 15, 10, true, 'un'),
('Enrolado de Presunto e Queijo', 'SAL002', 2.20, 7.50, 8, 10, true, 'un'),
('Bolo de Rolo (Fatia)', 'DOC001', 3.00, 12.00, 20, 5, true, 'un'),
('Café Coado Pequeno', 'BEB001', 0.50, 4.50, 999, 10, true, 'un'),
('Suco de Laranja Natural 500ml', 'BEB002', 4.00, 14.00, 25, 5, true, 'un'),
('Leite Tipo A 1L', 'MERC001', 4.80, 7.90, 4, 12, false, 'un'),
('Manteiga com Sal 200g', 'MERC002', 8.00, 15.50, 10, 5, false, 'un')
ON CONFLICT (sku) DO UPDATE SET
    name = EXCLUDED.name,
    cost_price = EXCLUDED.cost_price,
    sell_price = EXCLUDED.sell_price,
    current_stock = EXCLUDED.current_stock,
    min_stock = EXCLUDED.min_stock,
    is_quick_access = EXCLUDED.is_quick_access,
    unidade = EXCLUDED.unidade,
    updated_at = NOW();

-- 2. Inserção de Fornadas (Produção)
INSERT INTO public.baking_batches (product_id, quantity, expected_time, status)
SELECT id, 50, NOW() + interval '15 minutes', 'No Forno' FROM public.products WHERE sku = 'PAO001' LIMIT 1;

INSERT INTO public.baking_batches (product_id, quantity, expected_time, status)
SELECT id, 20, NOW() + interval '45 minutes', 'Aguardando' FROM public.products WHERE sku = 'PAO002' LIMIT 1;

INSERT INTO public.baking_batches (product_id, quantity, expected_time, status)
SELECT id, 10, NOW() - interval '10 minutes', 'Atrasado' FROM public.products WHERE sku = 'DOC001' LIMIT 1;

-- 3. Simulação de Vendas (Criação de Comandas Fechadas)
DO $$
DECLARE
    v_pao_id UUID;
    v_cafe_id UUID;
    v_coxinha_id UUID;
    v_cmd_id UUID;
    v_pm_pix UUID;
    v_pm_money UUID;
BEGIN
    -- Busca IDs
    SELECT id INTO v_pao_id FROM public.products WHERE sku = 'PAO001' LIMIT 1;
    SELECT id INTO v_cafe_id FROM public.products WHERE sku = 'BEB001' LIMIT 1;
    SELECT id INTO v_coxinha_id FROM public.products WHERE sku = 'SAL001' LIMIT 1;
    SELECT id INTO v_pm_pix FROM public.payment_methods WHERE name = 'PIX' LIMIT 1;
    SELECT id INTO v_pm_money FROM public.payment_methods WHERE name = 'Dinheiro' LIMIT 1;

    -- VENDA 1: Café da manhã básico (PIX)
    INSERT INTO public.commands (status, total_amount) VALUES ('Fechada', 22.50) RETURNING id INTO v_cmd_id;
    INSERT INTO public.command_items (command_id, product_id, quantity, unit_price) VALUES (v_cmd_id, v_pao_id, 4, 0.75);
    INSERT INTO public.command_items (command_id, product_id, quantity, unit_price) VALUES (v_cmd_id, v_cafe_id, 2, 4.50);
    INSERT INTO public.command_items (command_id, product_id, quantity, unit_price) VALUES (v_cmd_id, v_coxinha_id, 1, 10.50);
    
    INSERT INTO public.financial_transactions (transaction_type, amount, due_date, status, description, command_id, payment_method_id)
    VALUES ('IN', 22.50, CURRENT_DATE, 'Pago', 'Venda Demonstrativa A', v_cmd_id, v_pm_pix);

    -- VENDA 2: Apenas pães (Dinheiro)
    INSERT INTO public.commands (status, total_amount) VALUES ('Fechada', 7.50) RETURNING id INTO v_cmd_id;
    INSERT INTO public.command_items (command_id, product_id, quantity, unit_price) VALUES (v_cmd_id, v_pao_id, 10, 0.75);
    
    INSERT INTO public.financial_transactions (transaction_type, amount, due_date, status, description, command_id, payment_method_id)
    VALUES ('IN', 7.50, CURRENT_DATE, 'Pago', 'Venda Demonstrativa B', v_cmd_id, v_pm_money);

END $$;
