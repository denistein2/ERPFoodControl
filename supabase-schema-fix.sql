-- Adicional para alinhar a tabela 'products' com as necessidades do Frontend
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'un',
ADD COLUMN IF NOT EXISTS categoria_id TEXT,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.products.unidade IS 'Unidade de medida (kg, un, l, etc).';
COMMENT ON COLUMN public.products.categoria_id IS 'ID da categoria vinculada.';
COMMENT ON COLUMN public.products.ativo IS 'Flag para desativação lógica do produto.';
