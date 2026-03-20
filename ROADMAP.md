# 🗺️ Roadmap: ERP FOOD - De Colocação em Produção

Este documento serve como guia para a etapa final de entrega do sistema e início da operação real.

## 🚀 Checklist de Amanhã (Go-Live)

### 1. Infraestrutura
- [ ] **Vercel**: Criar projeto e importar `https://github.com/denistein2/ERPFoodControl`.
- [ ] **Variáveis de Ambiente (Vercel)**:
  - Adicionar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `RESEND_API_KEY`.
- [ ] **Configuração Supabase**:
  - Ir em `Authentication` -> `URL Configuration`.
  - Alterar **Site URL** para `https://erp-food-control.vercel.app/`.
- [ ] **DNS Hostinger**: Apontar CNAME de `ERPFoodControl.steintechnology.com.br` para o endereço do Vercel.

### 2. Banco de Dados (Supabase)
- [ ] Rodar `supabase-schema-fix.sql` (ajuste de colunas).
- [ ] Rodar `seed-bakery-products.sql` (dados iniciais).

### 3. E-mail (Resend)
- [ ] Validar o domínio no painel do Resend (para remover o limite de teste).
- [ ] Testar a rota `/api/send-email`.

---

## 🛠️ Processo de Implantação (Como o cliente usa?)

Para uma padaria que hoje usa papel, a implantação segue estes passos:

1. **Abertura de Cadastro**: O administrador (Stein Technology) cadastra o "Produto Pai" (Insumos) e os "Produtos de Venda" (Pão, Doces).
2. **Treinamento de Balcão**: O operador aprende a usar a grade de botões rápidos. É o "Google das vendas" — clicou, somou, pagou.
3. **Loop de Produção**: A cozinha recebe os alertas (ou segue o cronograma) e o padeiro atualiza o status no tablet/monitor. Isso alimenta o estoque do PDV automaticamente.
4. **Fechamento de Caixa**: Ao final do dia, o financeiro valida as transações de "IN" (Entradas) geradas pelo PDV.

---

## 📄 Base: Termo de Uso e Responsabilidade (Draft)

**OBJETO**: Licença de uso do software ERP FOOD CONTROL, plataforma de gestão para o setor de alimentação.

1. **DISPONIBILIDADE**: O sistema é fornecido na modalidade SaaS (Software as a Service). A Stein Technology garante 99% de uptime, salvo falhas em serviços de terceiros (Vercel/Supabase).
2. **DADOS**: Todas as informações inseridas são de propriedade do CLIENTE. A Stein Technology atua como operadora dos dados sob a LGPD.
3. **SEGURANÇA**: O acesso é pessoal e intransferível (Admin: `denisteinoficial@gmail.com`). O cliente é responsável pela guarda de sua senha.
4. **SUPORTE**: O suporte técnico será realizado em horário comercial via canais oficiais.

---

## 🔑 Notas de Acesso
- **Admin**: `denisteinoficial@gmail.com` / `123456`
- **Repositório**: `https://github.com/denistein2/ERPFoodControl`
