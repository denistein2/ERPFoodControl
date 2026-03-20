import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Flame, 
  Clock, 
  DollarSign,
  ShoppingCart,
  ChefHat
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProduto } from "@/data/mockData";

export default function Dashboard() {
  const [stats, setStats] = useState({
    saldoDia: 0,
    estoqueCritico: 0,
    vendasHoje: 0,
    fornadasPendentes: 0
  });
  const [batches, setBatches] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock data for demo
      setStats({
        saldoDia: 1250.80,
        estoqueCritico: 3,
        vendasHoje: 42,
        fornadasPendentes: 5
      });
      setBatches([
        { id: "1", product_id: "p1", quantity: 50, expected_time: "2026-03-19T23:30:00", status: 'Aguardando' },
        { id: "2", product_id: "p2", quantity: 100, expected_time: "2026-03-20T00:15:00", status: 'No Forno' },
        { id: "3", product_id: "p1", quantity: 50, expected_time: "2026-03-19T22:30:00", status: 'Atrasado' },
      ]);
      setRecentSales([
        { id: "1", amount: 45.90, created_at: "2026-03-19T22:15:00", payment_method: "PIX" },
        { id: "2", amount: 12.50, created_at: "2026-03-19T22:10:00", payment_method: "Dinheiro" },
        { id: "3", amount: 89.00, created_at: "2026-03-19T21:55:00", payment_method: "Cartão" },
      ]);
      return;
    }

    const fetchData = async () => {
      // Fetch Stats
      const today = new Date().toISOString().split('T')[0];
      
      const { data: salesData } = await supabase
        .from("financial_transactions")
        .select("amount")
        .eq("type", "IN")
        .gte("created_at", today);
      
      const saldo = salesData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
      
      const { count: criticoCount } = await supabase
        .from("produtos")
        .select("id", { count: 'exact' })
        .lte("current_stock", "min_stock");

      const { count: fornadasCount } = await supabase
        .from("baking_batches")
        .select("id", { count: 'exact' })
        .neq("status", "Concluido");

      setStats({
        saldoDia: saldo,
        estoqueCritico: criticoCount || 0,
        vendasHoje: salesData?.length || 0,
        fornadasPendentes: fornadasCount || 0
      });

      // Fetch Batches
      const { data: batchesData } = await supabase
        .from("baking_batches")
        .select("*")
        .neq("status", "Concluido")
        .order("expected_time", { ascending: true })
        .limit(5);
      
      if (batchesData) setBatches(batchesData);

      // Fetch Recent Sales
      const { data: recentData } = await supabase
        .from("financial_transactions")
        .select("*, payment_methods(name)")
        .eq("type", "IN")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (recentData) setRecentSales(recentData.map(s => ({
        ...s,
        payment_method: s.payment_methods?.name || "—"
      })));

      setLoading(false);
    };

    fetchData();

    // Set up real-time for dashboard
    const channel = supabase
      .channel("dashboard_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "baking_batches" }, fetchData)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "financial_transactions" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Painel Executivo</h1>
        <p className="text-muted-foreground font-medium">Visão geral da operação hoje</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary/10 shadow-lg shadow-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Saldo do Dia</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-primary">{formatCurrency(stats.saldoDia)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Entradas brutas em vendas</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-destructive/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-destructive uppercase tracking-widest">Estoque Crítico</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-destructive">{stats.estoqueCritico}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Itens abaixo do nível mínimo</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Vendas no Balcão</CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-foreground">{stats.vendasHoje}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Atendimentos finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-amber-500 uppercase tracking-widest">Fornadas</CardTitle>
            <Flame className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-foreground">{stats.fornadasPendentes}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Lotes pendentes ou no forno</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Fornadas Real-time */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-black">Próximas Fornadas</CardTitle>
            </div>
            <Badge variant="outline" className="animate-pulse bg-green-50 text-green-700 border-green-200">AO VIVO</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-medium">Sem fornadas ativas</TableCell></TableRow>
                ) : (
                  batches.map(batch => {
                    const prod = getProduto(batch.product_id);
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-bold">{prod?.nome || "Lote"}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{batch.quantity} {prod?.unidade}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {new Date(batch.expected_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={
                              batch.status === 'No Forno' ? 'bg-amber-100 text-amber-700' :
                              batch.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }
                          >
                            {batch.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Últimas Vendas */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-black">Vendas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-black text-primary">{formatCurrency(sale.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">{sale.payment_method}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {new Date(sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold text-xs uppercase">Detalhes</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
