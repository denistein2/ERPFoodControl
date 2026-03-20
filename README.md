# 🏭 EstoqueControl

> Sistema de controle de estoque e produção multi-tenant — construído com Lovable + Supabase

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20TypeScript-blue)
![License](https://img.shields.io/badge/license-MIT-green)
## Novidades v1.1 (05/03/2026)
- Autenticação completa com Supabase Auth (registro, login, senha, confirmação por e-mail)
- Integração CRUD de produtos com dados reais do usuário logado
- RLS reforçado para multi-tenant
- Demo ao vivo: https://steintechnology.com.br/projetos/estoquecontrol/
🌐 **Demo ao vivo:** [steintechnology.com.br/projetos/estoquecontrol](https://steintechnology.com.br/projetos/estoquecontrol/)

---

## 📋 Sobre o projeto

O **EstoqueControl** é um sistema interno de gestão operacional que controla o fluxo de materiais em múltiplas etapas de produção — do almoxarifado até a expedição.

Construído do zero com arquitetura **multi-tenant**, o sistema garante isolamento completo de dados por empresa, com regras de negócio implementadas diretamente no banco de dados via triggers e RLS.

### Problema que resolve

Empresas que controlam estoque e produção em planilhas perdem rastreabilidade, cometem erros de saldo e não têm visibilidade do fluxo de materiais entre setores. O EstoqueControl centraliza tudo em um sistema confiável e auditável.

---

## ✨ Funcionalidades

- **Dashboard** — visão geral de estoque por setor, itens críticos e movimentações do dia
- **Controle de estoque** — saldo em tempo real por produto e setor
- **Entradas** — registro de recebimento de materiais com lote e referência
- **Movimentações** — transferência entre setores com validação de saldo
- **Saídas** — baixa de materiais com rastreabilidade
- **Ordens de Produção** — fluxo completo: abertura → produção → conclusão automática
- **Relatórios** — histórico completo com filtros e exportação CSV
- **Configurações** — gestão de setores, categorias e usuários por perfil
- **Multiempresa** — isolamento total de dados por empresa via RLS

---

## 🧱 Arquitetura

```
Frontend (React + Vite + Lovable)
        ↓
Supabase (Auth + Database + RLS)
        ↓
PostgreSQL (triggers + functions + views)
```

### Decisões arquiteturais

**Saldo nunca é calculado no frontend.**
Toda movimentação insere um registro na tabela `transacoes`. Um trigger automático (`processar_transacao`) atualiza a tabela `estoque` a cada insert — garantindo consistência independente de falhas no cliente.

**Validação no banco, não na aplicação.**
A função `concluir_ordem_producao()` valida o saldo de todos os insumos antes de processar qualquer transação. Se algum insumo estiver em falta, retorna erro descritivo com produto, setor, disponível e necessário.

**empresa_id automático.**
Um trigger `preencher_empresa_id()` preenche automaticamente o `empresa_id` em todos os inserts — o frontend nunca controla isolamento de dados.

---

## 🗄️ Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `setores` | Etapas do fluxo (almoxarifado, produção, qualidade, expedição) |
| `categorias` | Classificação de produtos |
| `produtos` | Cadastro de itens com SKU e estoque mínimo |
| `estoque` | Saldo atual por produto + setor (atualizado por trigger) |
| `transacoes` | Coração do sistema — toda movimentação passa aqui |
| `ordens_producao` | Ordens com status: aberta → em_producao → concluida |
| `ordens_itens` | Insumos vinculados a cada ordem |
| `auditoria` | Log automático de todas as alterações críticas |
| `empresas` | Multiempresa — isolamento por RLS |

### Views analíticas

| View | Uso |
|------|-----|
| `vw_estoque_atual` | Dashboard e tela de estoque |
| `vw_transacoes_detalhadas` | Histórico com nomes de produto, setor e usuário |
| `vw_resumo_setores` | Cards do dashboard |

### Tipos de transação

```
entrada      → material chegou (compra, recebimento)
saida        → material saiu (venda, consumo)
movimentacao → transferência entre setores
ajuste       → correção de inventário
producao     → consumo de insumos na ordem de produção
```

---

## 🔐 Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas
- Cada usuário só acessa dados da própria empresa
- Perfis: `operador` (insere), `supervisor` (gerencia produtos), `admin` (acesso total)
- Escrita direta na tabela `estoque` bloqueada — somente triggers internos podem alterar saldo
- Auditoria automática em tabelas críticas (transacoes, estoque, produtos)

---

## 🚀 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/estoquecontrol.git
cd estoquecontrol

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### Banco de dados

Execute os scripts SQL no Supabase SQL Editor na seguinte ordem:

```
1. schema_ajustado.sql      — tabelas base, triggers, views, seed
2. fix_ordem_correta.sql    — multiempresa, RLS, empresa_id automático
3. fix_ordem_validacao.sql  — validação de saldo na ordem de produção
```

### Rodando

```bash
npm run dev
```

Acesse `http://localhost:5173`

---

## 📁 Estrutura do projeto

```
estoquecontrol/
├── src/
│   ├── components/         # Componentes React
│   ├── pages/              # Telas do sistema
│   │   ├── Dashboard.tsx
│   │   ├── Estoque.tsx
│   │   ├── Entradas.tsx
│   │   ├── Movimentacoes.tsx
│   │   ├── Saidas.tsx
│   │   ├── OrdensProducao.tsx
│   │   ├── Relatorios.tsx
│   │   └── Configuracoes.tsx
│   ├── lib/
│   │   └── estoque.ts      # Funções de integração Supabase
│   └── main.tsx
├── sql/
│   ├── schema_ajustado.sql
│   ├── fix_ordem_correta.sql
│   └── fix_ordem_validacao.sql
├── .env.example
└── README.md
```

---

## 🗺️ Roadmap

- [x] Schema completo com triggers e RLS
- [x] Frontend com 9 telas funcionais
- [x] Ordem de produção com validação prévia de saldo
- [x] Arquitetura multiempresa
- [x] Deploy na Hostinger — [live](https://steintechnology.com.br/projetos/estoquecontrol/)
- [x] Conectar frontend ao Supabase real (substituir dados mock)
- [ ] Integração com Google Sheets via n8n
- [ ] Relatório mensal automático
- [ ] Inventário periódico

---

## 🧠 Aprendizados técnicos

Este projeto foi usado como laboratório de decisões arquiteturais reais:

- Por que o saldo nunca deve ser calculado no frontend
- Como triggers garantem consistência sem depender da aplicação
- Como RLS elimina a necessidade de filtros manuais no código
- Como validar regras de negócio complexas em funções SQL
- Como estruturar um sistema multi-tenant do zero
- Como fazer deploy de SPA React em subpasta com `.htaccess` e `vite base`

---

## 👨‍💻 Autor

**Denis Henrique Ferreira Stein**
Analista de Sistemas | Desenvolvedor Low-Code | Porto Alegre – RS

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Denis%20Stein-blue)](https://linkedin.com/in/denisstein)
[![GitHub](https://img.shields.io/badge/GitHub-denistein-black)](https://github.com/denistein)

---

> *"Saldo nunca é calculado no frontend. O banco garante consistência."*
