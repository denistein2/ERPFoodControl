import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  User, 
  CreditCard, 
  Banknote, 
  QrCode, 
  X, 
  Trash2, 
  HandCoins,
  Receipt,
  Copy,
  History,
  LayoutDashboard,
  Calendar,
  Wallet
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import { generatePIXPayload } from "@/lib/pix";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { produtos, type Produto } from "@/data/mockData";

interface CartItem {
  id: string;
  nome: string;
  price: number;
  quantity: number;
}

interface Command {
  id: string;
  status: 'Aberta' | 'Fechada';
  total_amount: number;
}

interface CashierSession {
  id: string;
  status: 'Aberto' | 'Fechado';
  opening_balance: number;
}

type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito';

interface AppError {
  message: string;
}

function isAppError(error: unknown): error is AppError {
  return typeof error === "object" && error !== null && "message" in error;
}

export default function PDVBalcao() {
  const [productList, setProductList] = useState<Produto[]>(() => (isSupabaseConfigured ? [] : [...produtos]));
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [paymentsList, setPaymentsList] = useState<{ id: string; method: string; amount: number }[]>([]);
  const [pixConfig, setPixConfig] = useState<{ id?: string; pix_key: string; merchant_name: string; city: string } | null>(null);
  const [cardInfo, setCardInfo] = useState({ nsu: "", auth: "" });
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [isOpeningCashier, setIsOpeningCashier] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Loop 1: Carregamento inicial (Produtos, Pix, Sessão Existente)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("ativo", true);
      if (!error && data) setProductList(data.map(row => ({
        id: row.id,
        nome: row.name,
        sku: row.sku,
        categoriaId: row.categoria_id,
        unidade: row.unidade,
        estoqueMinimo: row.min_stock,
        costPrice: row.cost_price,
        sellPrice: row.sell_price,
        isQuickAccess: row.is_quick_access,
        permiteNegativo: row.permite_negativo,
        ativo: row.ativo,
      })));
    };

    const fetchActiveSessionOnMount = async () => {
      const { data } = await supabase
        .from("cashier_sessions")
        .select("*")
        .eq("status", "Aberto")
        .maybeSingle();
      if (data) setActiveSession(data);
    };

    const fetchPixConfig = async () => {
      const { data } = await supabase.from('pix_config').select('*').maybeSingle();
      if (data) setPixConfig(data);
    };

    fetchProducts();
    fetchActiveSessionOnMount();
    fetchPixConfig();
  }, []); // Só roda ao montar

  // Loop 2: Dados dependentes da SESSÃO (Histórico, Totais)
  useEffect(() => {
    if (activeSession?.id) {
       fetchRecentTransactions();
    }
  }, [activeSession?.id]);

  const fetchRecentTransactions = async () => {
    if (!isSupabaseConfigured || !activeSession?.id) return;
    
    // 1. Buscar últimas 10 transações para a lista
    const { data: recent, error: recentError } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        payment_methods (name)
      `)
      .eq('cashier_session_id', activeSession.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // 2. Buscar soma total das vendas da sessão (sem limite de 10)
    const { data: totals, error: sumError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('cashier_session_id', activeSession.id)
      .eq('transaction_type', 'IN');
    
    if (!recentError && recent) {
      setRecentTransactions(recent);
    }

    if (!sumError && totals) {
      const total = totals.reduce((acc: number, t: any) => acc + t.amount, 0);
      setTotalSales(total);
    }
  };

  const handleOpenCashier = async () => {
    console.log("Tentando abrir caixa com saldo inicial:", openingBalance);
    
    if (!isSupabaseConfigured) {
      console.log("Modo Mock: Abrindo caixa...");
      setActiveSession({ id: 'mock', status: 'Aberto', opening_balance: Number(openingBalance) });
      setIsOpeningCashier(false);
      return;
    }

    try {
      console.log("Supabase: Criando sessão de caixa...");
      const { data, error } = await supabase
        .from("cashier_sessions")
        .insert([{ opening_balance: Number(openingBalance), status: 'Aberto' }])
        .select()
        .single();
      
      if (error) {
        console.error("Erro Supabase ao abrir caixa:", error);
        toast.error("Erro ao abrir caixa: " + error.message);
        return;
      }

      console.log("Sucesso! Sessão criada:", data);
      setActiveSession(data);
      setIsOpeningCashier(false);
      toast.success("Caixa aberto com sucesso!");
    } catch (err) {
      console.error("Erro inesperado ao abrir caixa:", err);
      toast.error("Erro inesperado ao abrir caixa");
    }
  };

  const quickProducts = productList.filter(p => p.isQuickAccess);
  const filteredProducts = productList.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Produto) => {
    const quantityToAdd = Number(itemQuantity) || 1;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item);
      }
      return [...prev, { id: product.id, nome: product.nome, price: product.sellPrice, quantity: quantityToAdd }];
    });
    toast.success(`${quantityToAdd}x ${product.nome} adicionado`);
    setItemQuantity(1);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalPaid = paymentsList.reduce((acc, p) => acc + p.amount, 0);
  const remainingAmount = Math.max(0, total - totalPaid);
  const totalTroco = Math.max(0, totalPaid - total);

  const handleClosePayment = () => {
    setIsPaymentOpen(false);
    setPaymentsList([]);
    setPaymentMethod(null);
    setReceivedAmount("");
    setCardInfo({ nsu: "", auth: "" });
  };

  const handleAddPayment = () => {
    const amount = Number(receivedAmount);
    if (!paymentMethod || amount <= 0) {
      toast.error("Selecione um método e informe um valor válido");
      return;
    }
    
    const newPayment = {
      id: Math.random().toString(36).substring(2, 9),
      method: paymentMethod,
      amount: amount
    };
    
    setPaymentsList(prev => [...prev, newPayment]);
    setReceivedAmount("");
    // Se ainda falta valor, mantemos o modal aberto para novo lançamento
    if (amount >= remainingAmount) {
      toast.success("Valor total atingido!");
    } else {
      toast.success(`Lançado: R$ ${amount.toFixed(2)}. Falta: R$ ${(remainingAmount - amount).toFixed(2)}`);
    }
  };

  const handleRemovePayment = (id: string) => {
    setPaymentsList(prev => prev.filter(p => p.id !== id));
  };

  const handleCloseCashier = async () => {
    if (!isSupabaseConfigured) {
      setActiveSession(null);
      toast.success("Caixa fechado (Modo Mock)");
      return;
    }

    if (!activeSession) return;

    const { error } = await supabase
      .from('cashier_sessions')
      .update({ status: 'Fechado', closed_at: new Date().toISOString() })
      .eq('id', activeSession.id);

    if (error) {
      toast.error("Erro ao fechar caixa: " + error.message);
    } else {
      setActiveSession(null);
      toast.success("Caixa fechado com sucesso!");
    }
  };

  const handleFinishSale = async () => {
    if (paymentsList.length === 0) {
      toast.error("Nenhum pagamento lançado");
      return;
    }

    if (totalPaid < total) {
      toast.error(`Falta receber R$ ${(total - totalPaid).toFixed(2)}`);
      return;
    }
    
    if (!isSupabaseConfigured) {
      toast.success("Venda realizada com sucesso! (Modo Mock)");
      setCart([]);
      handleClosePayment();
      return;
    }

    try {
      // 1. Criar a Comanda
      const { data: command, error: cmdError } = await supabase
        .from("commands")
        .insert([{ status: 'Fechada', total_amount: total }])
        .select()
        .single();

      if (cmdError) throw cmdError;

      // 2. Criar os Itens da Comanda
      const itemsPayload = cart.map(item => ({
        command_id: command.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { error: itemsError } = await supabase
        .from("command_items")
        .insert(itemsPayload);

      if (itemsError) throw itemsError;

      // 3. Criar as Transações Financeiras (Multi-pagamento)
      // Precisamos identificar os IDs dos métodos no banco
      const { data: allMethods } = await supabase.from("payment_methods").select("id, name");
      
      let currentTroco = totalTroco;

      for (const p of paymentsList) {
        const pm = allMethods?.find(m => m.name.toLowerCase() === p.method.toLowerCase());
        
        // Se for dinheiro, subtraímos o troco do valor registrado (líquido)
        let amountToRecord = p.amount;
        if (p.method === 'dinheiro' && currentTroco > 0) {
          const deduction = Math.min(amountToRecord, currentTroco);
          amountToRecord -= deduction;
          currentTroco -= deduction;
        }

        if (amountToRecord <= 0) continue; // Evita salvar transação de R$ 0

        const { data: tx, error: txError } = await supabase
          .from("financial_transactions")
          .insert([{
            transaction_type: 'IN',
            amount: amountToRecord,
            due_date: new Date().toISOString().split('T')[0],
            status: 'Pago',
            description: `Venda PDV - Comanda ${command.id.slice(0,8)} (${p.method})`,
            command_id: command.id,
            payment_method_id: pm?.id,
            cashier_session_id: activeSession?.id
          }])
          .select()
          .single();

        if (txError) throw txError;
        
        // Vincular a primeira/última transação à comanda como referência (opcional, já que estão vinculadas via command_id)
        if (!command.transaction_id) {
           await supabase.from("commands").update({ transaction_id: tx.id }).eq("id", command.id);
        }
      }

      toast.success("Venda finalizada com sucesso!");
      setCart([]);
      handleClosePayment();
      fetchRecentTransactions(); // Atualiza histórico
    } catch (error: unknown) {
      console.error(error);
      toast.error("Erro ao processar venda: " + (isAppError(error) ? error.message : "erro inesperado"));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-2 overflow-hidden w-full">
      {/* Barra de Status do Caixa (Novo) */}
      {activeSession && (
        <div className="bg-card border-2 border-primary/20 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-black text-xs uppercase tracking-widest text-green-600">Caixa Aberto</span>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Mês de Referência</span>
                <span className="text-xs font-bold leading-tight">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Inicial</span>
                <span className="text-xs font-bold leading-tight">{formatCurrency(activeSession.opening_balance)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Vendas (Sessão)</span>
                <span className="text-xs font-bold leading-tight">{formatCurrency(totalSales)}</span>
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold gap-2"
            onClick={handleCloseCashier}
          >
            <X className="h-4 w-4" />
            Encerrar Expediente
          </Button>
        </div>
      )}

      {/* Main Grid: Left Products vs Right Cart */}
      <div className="flex flex-1 gap-6 min-h-0 h-[calc(100vh-175px)]">
        {/* Esquerda: Grade de Produtos */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-2">
              <div className="w-20 shrink-0">
                <Input 
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(Number(e.target.value))}
                  className="h-10 text-center font-bold border-2 focus-visible:ring-primary"
                  title="Multiplicador de quantidade (Qtd)"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar produto ou SKU..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 h-10 text-base"
                />
              </div>
            </div>
            <Button variant="outline" className="h-10 px-4 shrink-0">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Vincular Cliente</span>
            </Button>
          </div>

        <Tabs defaultValue="rapido" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rapido">Acesso Rápido</TabsTrigger>
            <TabsTrigger value="todos">Todos os Produtos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rapido" className="flex-1 min-h-0 pt-4">
            <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {quickProducts.map(product => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-auto min-h-[120px] flex flex-col items-center justify-between p-4 bg-card hover:bg-accent transition-all border-2 text-wrap"
                      onClick={() => addToCart(product)}
                    >
                      <span className="text-sm font-bold text-center leading-tight mb-2 line-clamp-3">
                        {product.nome}
                      </span>
                      <span className="text-primary font-black text-lg mt-auto">
                        {formatCurrency(product.sellPrice)}
                      </span>
                    </Button>
                  ))}
                </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="todos" className="flex-1 min-h-0 pt-4">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => addToCart(product)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{product.nome}</p>
                        <p className="text-sm text-muted-foreground">{product.sku} | {product.unidade}</p>
                      </div>
                      <p className="text-xl font-bold text-primary">{formatCurrency(product.sellPrice)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

        {/* Direita: Carrinho e Comandas com Abas */}
        <div className="w-[400px] flex flex-col h-full rounded-xl border-x border-b shadow-sm overflow-hidden bg-background shrink-0">
          <Tabs defaultValue="venda" className="flex-1 flex flex-col h-full min-h-0">
            <TabsList className="grid w-full grid-cols-3 mb-0 shrink-0 border-b rounded-none h-12">
              <TabsTrigger value="venda" className="gap-1 text-[11px] uppercase font-bold">
                <ShoppingCart className="h-3 w-3" /> Venda
              </TabsTrigger>
              <TabsTrigger value="comandas" className="gap-1 text-[11px] uppercase font-bold">
                <Receipt className="h-3 w-3" /> Comandas
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-1 text-[11px] uppercase font-bold">
                <History className="h-3 w-3" /> Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent 
              value="venda" 
              className="mt-0 bg-white overflow-hidden"
              style={{ height: activeSession ? 'calc(100vh - 215px)' : 'calc(100vh - 155px)' }}
            >
              <div className="flex flex-col h-full">
                <div className="py-2 px-4 border-b border-primary/10 shrink-0 bg-primary/5">
                  <CardTitle className="flex items-center gap-2 text-[11px] uppercase font-black text-primary tracking-widest">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Itens do Pedido
                  </CardTitle>
                </div>
                <CardContent className="flex-1 min-h-0 p-0 overflow-hidden bg-white">
                  <ScrollArea className="h-full">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50 py-20">
                        <ShoppingCart className="h-16 w-16 mb-4" />
                        <p className="font-bold">Aguardando Produtos...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-primary/5">
                        {cart.map((item, index) => (
                          <div key={item.id} className="p-2.5 group hover:bg-primary/5 transition-colors">
                            <div className="flex justify-between items-start mb-0.5">
                              <div className="flex items-start gap-2 pr-2">
                                <span className="text-[10px] font-bold text-muted-foreground mt-0.5 tabular-nums">{String(index + 1).padStart(2, '0')}.</span>
                                <span className="font-bold text-[13px] text-foreground leading-tight">{item.nome}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 pl-6">
                                <span className="text-primary font-black text-sm">{item.quantity}x</span>
                                <span className="text-muted-foreground text-[9px] font-medium">{formatCurrency(item.price)}/un</span>
                              </div>
                              <span className="font-bold text-sm tabular-nums text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <div className="p-3 bg-secondary/30 border-t shrink-0 w-full shadow-inner">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Total da Venda</span>
                    <span className="text-3xl font-black text-primary tracking-tighter leading-none">{formatCurrency(total)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-10 font-bold border-2 bg-white"
                      onClick={() => setCart([])}
                    >
                      Limpar
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-10 text-sm font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      onClick={() => total > 0 && setIsPaymentOpen(true)}
                      disabled={total === 0}
                    >
                      Pagar <HandCoins className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comandas" className="flex-1 flex flex-col min-h-0 mt-0">
              <Card className="flex-1 shadow-sm border-primary/20 overflow-hidden flex flex-col">
                <CardHeader className="py-3 px-4 border-b bg-card shrink-0">
                   <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      Gestão de Comandas
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex-1">
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                      {['Mesa 01', 'Balcão 02', 'Mesa 08', 'Mesa 12', 'Mesa 03', 'Mesa 05'].map((name, i) => (
                        <Button key={i} variant="outline" className="h-16 font-bold flex flex-col items-center justify-center gap-1">
                          <span className="text-xs">{name}</span>
                          <Badge variant="secondary" className="text-[9px]">OCUPADO</Badge>
                        </Button>
                      ))}
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="flex-1 flex flex-col min-h-0 mt-0">
               <Card className="flex-1 overflow-hidden border-2 border-primary/10 shadow-sm flex flex-col bg-card">
                  <CardHeader className="py-4 px-6 border-b shrink-0">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                      <History className="h-4 w-4" />
                      Fluxo de Vendas (Sessão)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      {recentTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50 py-20">
                          <History className="h-12 w-12 mb-2" />
                          <p>Nenhuma venda nesta sessão</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {recentTransactions.map((tx) => (
                            <div key={tx.id} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                  {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Badge variant="secondary" className="text-[9px] uppercase font-bold">
                                  {tx.payment_methods?.name || 'Vários'}
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-foreground line-clamp-1 flex-1 pr-2">
                                  {tx.description}
                                </span>
                                <span className="font-black text-primary">
                                  {formatCurrency(tx.amount)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                  <div className="p-4 bg-muted/20 border-t shrink-0">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span>Total Acumulado</span>
                      <span className="text-primary text-lg">{formatCurrency(totalSales)}</span>
                    </div>
                  </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Overlay de Caixa Fechado */}
      {!activeSession && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="max-w-md w-full shadow-2xl border-2">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <Banknote className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-black">Caixa Fechado</CardTitle>
              <p className="text-muted-foreground mt-2">Para iniciar as vendas, você precisa realizar a abertura do caixa.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Saldo Inicial (Fundo de Troco)</Label>
                <Input 
                  type="number" 
                  className="h-12 text-lg font-bold" 
                  placeholder="R$ 0,00" 
                  value={openingBalance}
                  onChange={e => setOpeningBalance(e.target.value)}
                />
              </div>
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleOpenCashier}
              >
                Abrir Caixa agora
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => !open && handleClosePayment()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Finalizar Venda
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[80vh] px-1">
            <div className="py-2 space-y-4">
              <div className="p-3 bg-primary/5 rounded-xl border-2 border-primary/20 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Total a Pagar</span>
                  <span className="text-2xl font-black text-primary tracking-tight">{formatCurrency(total)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-primary/10">
                    <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Total Recebido</span>
                    <span className="text-xl font-black text-foreground">{formatCurrency(totalPaid)}</span>
                  </div>
                )}
                {remainingAmount > 0 ? (
                  <div className="flex justify-between items-center pt-1 border-t border-primary/10">
                    <span className="font-bold text-red-600 uppercase text-[10px] tracking-widest">Falta Receber</span>
                    <span className="text-xl font-black text-red-600">{formatCurrency(remainingAmount)}</span>
                  </div>
                ) : totalTroco > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-primary/10">
                    <span className="font-bold text-green-600 uppercase text-[10px] tracking-widest">Troco</span>
                    <span className="text-xl font-black text-green-600">{formatCurrency(totalTroco)}</span>
                  </div>
                )}
              </div>

              {/* Lista de Pagamentos Lançados */}
              {paymentsList.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Pagamentos Lançados</Label>
                  <div className="space-y-1">
                    {paymentsList.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-primary/5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-[10px]">{p.method}</Badge>
                          <span className="font-bold text-sm">{formatCurrency(p.amount)}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemovePayment(p.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
                  { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-blue-500' },
                  { id: 'debito', label: 'Débito', icon: CreditCard, color: 'text-purple-500' },
                  { id: 'credito', label: 'Crédito', icon: CreditCard, color: 'text-amber-500' },
                ].map((method: { id: PaymentMethod; label: string; icon: typeof Banknote; color: string }) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    className={`h-16 flex flex-row items-center justify-start px-4 gap-3 rounded-xl transition-all border-2 ${paymentMethod === method.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-primary-foreground' : method.color}`} />
                    <span className="font-bold text-sm">{method.label}</span>
                  </Button>
                ))}
              </div>

              {/* Bug 1: Valor Recebido deve aparecer para todas as formas de pagamento */}
              {paymentMethod && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-end">
                    <Label className="text-xs font-bold">Valor Recebido</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">F7 - Atalhos</span>
                  </div>
                  <Input 
                    type="number" 
                    step="0.01" 
                    className="h-10 text-lg font-black text-primary text-right focus-visible:ring-primary" 
                    placeholder="0,00"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 20, 50, 100].map(val => (
                      <Button 
                        key={val} 
                        variant="outline" 
                        size="sm"
                        className="h-8 px-3 font-bold text-xs hover:bg-primary/10"
                        onClick={() => setReceivedAmount(val.toString())}
                      >
                        R$ {val}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-3 font-bold text-xs border-primary/30 text-primary hover:bg-primary/10 ml-auto"
                      onClick={() => setReceivedAmount(remainingAmount.toString())}
                    >
                      Valor Restante
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full h-10 font-bold bg-primary/10 text-primary hover:bg-primary/20 border-2 border-primary/20"
                    onClick={handleAddPayment}
                  >
                    Lançar Pagamento
                  </Button>
                </div>
              )}

              {paymentMethod === 'pix' && remainingAmount > 0 && (
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner animate-in zoom-in-95 duration-300">
                  {pixConfig && pixConfig.pix_key ? (
                    <>
                      <div className="p-2 bg-white border-2 border-primary/10 rounded-xl mb-2">
                        <QRCodeSVG 
                          value={generatePIXPayload(pixConfig.pix_key, pixConfig.merchant_name, pixConfig.city, Number(receivedAmount) || remainingAmount)} 
                          size={150} 
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg select-all text-blue-600">
                          <span className="text-[10px] font-mono truncate flex-1 font-bold">{pixConfig.pix_key}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 hover:bg-primary/10 text-primary" 
                            onClick={() => {
                              const brCode = generatePIXPayload(pixConfig.pix_key, pixConfig.merchant_name, pixConfig.city, Number(receivedAmount) || remainingAmount);
                              navigator.clipboard.writeText(brCode);
                              toast.success('Cópia e Cola copiado!');
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-[9px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
                          Pague {formatCurrency(Number(receivedAmount) || remainingAmount)} via PIX
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-yellow-600 font-bold mb-1">PIX não configurado</p>
                      <p className="text-[10px] text-muted-foreground px-4 leading-tight">
                        Configure sua chave no módulo Financeiro {">"} Configurações PIX.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(paymentMethod === 'debito' || paymentMethod === 'credito') && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 border-t pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="font-bold text-[10px] uppercase text-muted-foreground">NSU (Opcional)</Label>
                      <Input 
                        placeholder="Doc/NSU" 
                        className="h-8 text-xs font-mono"
                        value={cardInfo.nsu}
                        onChange={e => setCardInfo(prev => ({ ...prev, nsu: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="font-bold text-[10px] uppercase text-muted-foreground">Aut. (Opcional)</Label>
                      <Input 
                        placeholder="Código Aut." 
                        className="h-8 text-xs font-mono"
                        value={cardInfo.auth}
                        onChange={e => setCardInfo(prev => ({ ...prev, auth: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="ghost" onClick={handleClosePayment} className="font-bold">Cancelar</Button>
            <Button 
              className="px-8 font-black text-lg h-12 shadow-lg shadow-primary/20"
              onClick={handleFinishSale}
              disabled={totalPaid < total}
            >
              {totalPaid >= total ? "Finalizar Venda" : "Aguardando Pagamento..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
