import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Flame, 
  Clock, 
  CheckCircle2, 
  ChefHat,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProduto } from "@/data/mockData";

interface BakingBatch {
  id: string;
  product_id: string;
  quantity: number;
  expected_time: string;
  status: 'Aguardando' | 'No Forno' | 'Concluido' | 'Atrasado';
  notes?: string;
}

export default function PainelCozinha() {
  const [batches, setBatches] = useState<BakingBatch[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock data for demo if not configured
      setBatches([
        { id: "1", product_id: "p1", quantity: 50, expected_time: "2026-03-19T23:30:00", status: 'Aguardando' },
        { id: "2", product_id: "p2", quantity: 100, expected_time: "2026-03-20T00:15:00", status: 'No Forno' },
        { id: "3", product_id: "p1", quantity: 50, expected_time: "2026-03-19T22:30:00", status: 'Atrasado' },
      ]);
      return;
    }

    const fetchBatches = async () => {
      const { data, error } = await supabase
        .from("baking_batches")
        .select("*")
        .neq("status", "Concluido")
        .order("expected_time", { ascending: true });

      if (!error && data) setBatches(data);
      setLoading(false);
    };

    fetchBatches();

    // Setup Real-time subscription
    const channel = supabase
      .channel("baking_batches_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "baking_batches" }, (payload) => {
        fetchBatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const advanceStatus = async (batch: BakingBatch) => {
    const statusFlow: Record<string, BakingBatch['status']> = {
      'Aguardando': 'No Forno',
      'Atrasado': 'No Forno',
      'No Forno': 'Concluido'
    };

    const nextStatus = statusFlow[batch.status];
    if (!nextStatus) return;

    // Optimistic UI update
    setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, status: nextStatus } : b).filter(b => b.status !== 'Concluido'));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("baking_batches")
        .update({ status: nextStatus })
        .eq("id", batch.id);

      if (error) {
        console.error("Erro Supabase ao atualizar status da fornada:", error);
        toast.error(`Erro: ${error.message} (Código: ${error.code})`);
        // Revert UI update
        fetchBatches();
      } else {
        toast.success(`Lote ${nextStatus === 'No Forno' ? 'entrou no forno' : 'concluído'}`);
      }
    } else {
      toast.success(`Lote ${nextStatus === 'No Forno' ? 'entrou no forno' : 'concluído'} (Mock)`);
    }
  };

  const getStatusConfig = (status: BakingBatch['status']) => {
    switch (status) {
      case 'Aguardando': return { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: Clock };
      case 'No Forno': return { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Flame };
      case 'Atrasado': return { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle };
      default: return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: CheckCircle2 };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChefHat className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Cozinha & Forno</h1>
            <p className="text-muted-foreground font-medium">Controle de Produção em Tempo Real</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Card className="px-6 py-2 border-primary/20 bg-primary/5">
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Ativos</p>
            <p className="text-2xl font-black">{batches.length}</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map(batch => {
          const product = getProduto(batch.product_id);
          const config = getStatusConfig(batch.status);
          const StatusIcon = config.icon;

          return (
            <Card key={batch.id} className={`overflow-hidden border-2 transition-all hover:shadow-xl ${batch.status === 'Atrasado' ? 'border-red-500/30' : 'border-border'}`}>
              <CardHeader className={`${config.color} border-b py-4 flex flex-row items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" />
                  <span className="font-black uppercase tracking-tighter text-sm">{batch.status}</span>
                </div>
                <span className="text-xs font-bold opacity-70">
                  {new Date(batch.expected_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-foreground mb-1">{product?.nome || "Produto"}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-bold text-lg">{batch.quantity} {product?.unidade}</span>
                  </div>
                </div>

                <Button 
                  className={`w-full h-16 text-xl font-black rounded-xl shadow-lg transition-transform active:scale-95 ${
                    batch.status === 'No Forno' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-primary hover:bg-primary/90'
                  }`}
                  onClick={() => advanceStatus(batch)}
                >
                  {batch.status === 'No Forno' ? 'CONCLUIR' : 'INICIAR FORNO'}
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {batches.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-card border rounded-2xl border-dashed">
            <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">Nenhuma fornada programada no momento</p>
          </div>
        )}
      </div>
    </div>
  );
}
