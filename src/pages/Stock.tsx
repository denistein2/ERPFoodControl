import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, Package2, TrendingDown } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format";

interface ProductStock {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  unidade: string;
  cost_price: number;
  sell_price: number;
}

export default function Stock() {
  const [items, setItems] = useState<ProductStock[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock data if no Supabase
      setItems([
        { id: "1", name: "Pão Francês", sku: "PAO001", current_stock: 1250, min_stock: 100, unidade: "kg", cost_price: 0.50, sell_price: 1.20 },
        { id: "2", name: "Pão de Queijo", sku: "PAO002", current_stock: 45, min_stock: 50, unidade: "un", cost_price: 1.00, sell_price: 3.50 },
        { id: "3", name: "Farinha de Trigo", sku: "INF001", current_stock: 500, min_stock: 200, unidade: "kg", cost_price: 3.20, sell_price: 0 },
      ]);
      return;
    }

    async function fetchData() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    }
    fetchData();

    // Real-time updates for stock changes
    const channel = supabase
      .channel("stock_changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = items.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.sku.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (current: number, min: number) => {
    if (current <= 0) return { label: "Zerado", className: "bg-red-500 text-white", icon: AlertTriangle };
    if (current <= min) return { label: "Baixo", className: "bg-amber-500 text-white", icon: TrendingDown };
    return { label: "Normal", className: "bg-green-500 text-white", icon: Package2 };
  };

  const totalValue = items.reduce((acc, curr) => acc + (curr.current_stock * curr.cost_price), 0);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Estoque de Alimentos</h1>
          <p className="text-muted-foreground font-medium">Controle físico e valoração de inventário</p>
        </div>
        <Card className="px-6 py-2 border-primary/20 bg-primary/5">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Valor em Estoque (Custo)</p>
          <p className="text-2xl font-black">{formatCurrency(totalValue)}</p>
        </Card>
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por nome ou SKU..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-10 h-11" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold pl-6">Produto</TableHead>
                <TableHead className="font-bold">SKU</TableHead>
                <TableHead className="text-right font-bold">Saldo</TableHead>
                <TableHead className="font-bold">Unidade</TableHead>
                <TableHead className="text-right font-bold">P. Custo</TableHead>
                <TableHead className="text-right font-bold uppercase tracking-wider text-[10px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Sincronizando com Supabase...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Nenhum produto encontrado.</TableCell></TableRow>
              ) : filtered.map(item => {
                const status = getStatus(Number(item.current_stock), Number(item.min_stock));
                const Icon = status.icon;
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold pl-6 py-4">{item.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                    <TableCell className={`text-right font-black ${Number(item.current_stock) <= Number(item.min_stock) ? 'text-destructive' : 'text-foreground'}`}>
                      {item.current_stock}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{item.unidade}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.cost_price)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge className={`gap-1 px-3 py-1 font-bold ${status.className}`}>
                        <Icon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
