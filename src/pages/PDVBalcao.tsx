import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Receipt
} from "lucide-react";
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

export default function PDVBalcao() {
  const [productList, setProductList] = useState<Produto[]>(() => (isSupabaseConfigured ? [] : [...produtos]));
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito' | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true);
      if (!error && data) setProductList(data.map(row => ({
        id: row.id,
        nome: row.nome,
        sku: row.sku,
        categoriaId: row.categoria_id,
        unidade: row.unidade,
        estoqueMinimo: row.estoque_minimo,
        costPrice: row.cost_price,
        sellPrice: row.sell_price,
        isQuickAccess: row.is_quick_access,
        permiteNegativo: row.permite_negativo,
        ativo: row.ativo,
      })));
    };
    fetchProducts();
  }, []);

  const quickProducts = productList.filter(p => p.isQuickAccess);
  const filteredProducts = productList.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, nome: product.nome, price: product.sellPrice, quantity: 1 }];
    });
    toast.success(`${product.nome} adicionado`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleFinishSale = async () => {
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }
    
    // Logic for database saving would go here
    toast.success("Venda realizada com sucesso!");
    setCart([]);
    setIsPaymentOpen(false);
    setPaymentMethod(null);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Esquerda: Grade de Produtos */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar produto por nome ou SKU..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button variant="outline" className="h-12 px-6">
            <User className="h-4 w-4 mr-2" />
            Vincular Cliente
          </Button>
        </div>

        <Tabs defaultValue="rapido" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rapido">Acesso Rápido</TabsTrigger>
            <TabsTrigger value="todos">Todos os Produtos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rapido" className="flex-1 min-h-0 pt-4">
            <ScrollArea className="h-full pr-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickProducts.map(product => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-32 flex flex-col gap-2 bg-card hover:bg-accent transition-all border-2"
                    onClick={() => addToCart(product)}
                  >
                    <span className="text-lg font-bold line-clamp-2 text-center">{product.nome}</span>
                    <span className="text-primary font-bold">{formatCurrency(product.sellPrice)}</span>
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

      {/* Direita: Carrinho e Comandas */}
      <div className="w-[400px] flex flex-col gap-4">
        {/* Comandas / Aberto */}
        <Card className="shrink-0">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Comandas Abertas
            </CardTitle>
            <Badge variant="outline">04</Badge>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {['Mesa 01', 'Balcão 02', 'Mesa 08', 'Mesa 12'].map((name, i) => (
                <Button key={i} variant="outline" size="sm" className="shrink-0 whitespace-nowrap">
                  {name}
                </Button>
              ))}
              <Button variant="ghost" size="sm" className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Carrinho */}
        <Card className="flex-1 flex flex-col min-h-0 bg-primary/5 border-primary/20">
          <CardHeader className="py-4 px-6 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Itens do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50">
                  <ShoppingCart className="h-12 w-12 mb-2" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <div className="divide-y divide-primary/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-foreground pr-2">{item.nome}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-bold text-lg">{item.quantity}x</span>
                          <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <div className="p-6 bg-background border-t mt-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="text-4xl font-black text-primary tracking-tight">R$ {total.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 font-bold border-2"
                onClick={() => setCart([])}
              >
                Limpar
              </Button>
              <Button 
                size="lg" 
                className="h-14 text-lg font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={() => total > 0 && setIsPaymentOpen(true)}
                disabled={total === 0}
              >
                Pagar <HandCoins className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" />
              Finalizar Venda
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20 flex justify-between items-center">
              <span className="font-bold text-muted-foreground uppercase text-sm tracking-widest">Valor a Pagar</span>
              <span className="text-4xl font-black text-primary tracking-tight">R$ {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'dinheiro', label: 'Dinheiro', icon: Banknote, color: 'text-green-500' },
                { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-blue-500' },
                { id: 'debito', label: 'Débito', icon: CreditCard, color: 'text-purple-500' },
                { id: 'credito', label: 'Crédito', icon: CreditCard, color: 'text-amber-500' },
              ].map(method => (
                <Button
                  key={method.id}
                  variant={paymentMethod === method.id ? "default" : "outline"}
                  className={`h-24 flex flex-col gap-2 rounded-xl transition-all border-2 ${paymentMethod === method.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                  onClick={() => setPaymentMethod(method.id as any)}
                >
                  <method.icon className={`h-8 w-8 ${paymentMethod === method.id ? 'text-primary-foreground' : method.color}`} />
                  <span className="font-bold">{method.label}</span>
                </Button>
              ))}
            </div>

            {paymentMethod === 'dinheiro' && (
              <div className="space-y-2">
                <Label>Valor Recebido</Label>
                <Input type="number" step="0.01" className="h-12 text-lg font-bold" placeholder="0,00" />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button variant="secondary" size="sm">R$ 20,00</Button>
                  <Button variant="secondary" size="sm">R$ 50,00</Button>
                  <Button variant="secondary" size="sm">R$ 100,00</Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentOpen(false)} className="h-12 font-bold">Cancelar</Button>
            <Button 
              className="h-12 px-8 font-black text-lg bg-primary hover:bg-primary/90 min-w-[150px]"
              onClick={handleFinishSale}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
