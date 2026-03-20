-- ============================================================
-- CAIXA: Abertura, Fechamento e Movimentações
-- ============================================================

CREATE TABLE IF NOT EXISTS public.cashier_sessions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    closed_at           TIMESTAMPTZ,
    opening_balance     NUMERIC(12, 2)  NOT NULL DEFAULT 0,
    closing_balance     NUMERIC(12, 2),
    status              TEXT            NOT NULL CHECK (status IN ('Aberto', 'Fechado')) DEFAULT 'Aberto',
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cashier_movements (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID            NOT NULL REFERENCES public.cashier_sessions(id),
    type                TEXT            NOT NULL CHECK (type IN ('Entrada', 'Saída')),
    description         TEXT            NOT NULL,
    amount              NUMERIC(12, 2)  NOT NULL,
    method              TEXT            NOT NULL DEFAULT 'Dinheiro', -- Dinheiro, PIX, etc.
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Adicionar session_id às transações financeiras para vincular vendas ao caixa atual
ALTER TABLE public.financial_transactions
ADD COLUMN IF NOT EXISTS cashier_session_id UUID REFERENCES public.cashier_sessions(id);

COMMENT ON TABLE public.cashier_sessions IS 'Sessões de abertura e fechamento de caixa diário.';
COMMENT ON TABLE public.cashier_movements IS 'Movimentações manuais (Sangria/Reforço) no caixa.';
