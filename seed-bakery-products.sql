-- SQL para semente (Seed) de produtos iniciais para teste do PDV
INSERT INTO public.products (name, sku, cost_price, sell_price, current_stock, min_stock, is_quick_access) VALUES
('Pão Francês', 'PAO001', 0.50, 1.20, 1000, 100, true),
('Pão de Queijo', 'PAO002', 1.00, 3.50, 200, 50, true),
('Coxinha de Frango', 'SAL001', 2.00, 6.00, 50, 10, true),
('Café Espresso', 'BEB001', 0.80, 5.00, 999, 10, true),
('Suco de Laranja 300ml', 'BEB002', 3.00, 9.00, 30, 5, true),
('Bolo de Cenoura (Fatia)', 'DOC001', 2.50, 7.50, 20, 5, false),
('Leite Integral 1L', 'MERC001', 4.50, 6.50, 48, 12, false);
