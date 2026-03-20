import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getStatusEstoque } from "@/data/mockData";

interface EstoqueReal {
  produto_id: number;
  deposito_id: number;
  qtd_fisica: number;
  qtd_reservada: number;
  qtd_disponivel: number;
  produto_nome: string;
  produto_sku: string;
  produto_unidade: string;
  produto_estoque_minimo: number;
  deposito_nome: string;
}

export default function Stock() {
  const [items, setItems] = useState<EstoqueReal[]>([]);
  const [setores, setSetores] = useState<{id: number, nome: string}[]>([]);
  const [setorFilter, setSetorFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Buscar setores (depósitos) do banco real
      const { data: depData } = await supabase.from('depositos').select('id, nome').eq('ativo', true);
      if (depData) setSetores(depData);

      // Buscar saldo de estoque com join manual via Supabase (ou view se preferir)
      // Aqui vamos buscar o saldo_estoque e depois os produtos para simplificar sem RPC
      const { data: saldoData, error } = await supabase
        .from('saldo_estoque')
        .select(`
          *,
          produtos:produto_id (nome, sku, estoque_minimo),
          depositos:deposito_id (nome)
        `);

      if (!error && saldoData) {
        const flatData: EstoqueReal[] = saldoData.map((s: any) => ({
          produto_id: s.produto_id,
          deposito_id: s.deposito_id,
          qtd_fisica: Number(s.qtd_fisica),
          qtd_reservada: Number(s.qtd_reservada),
          qtd_disponivel: Number(s.qtd_disponivel),
          produto_nome: s.produtos?.nome || 'Desconhecido',
          produto_sku: s.produtos?.sku || '',
          produto_unidade: 'un', // No core atual é fixo ou ID
          produto_estoque_minimo: Number(s.produtos?.estoque_minimo || 0),
          deposito_nome: s.depositos?.nome || 'Desconhecido'
        }));
        setItems(flatData);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = items.filter(e => {
    if (setorFilter !== "todos" && e.deposito_id.toString() !== setorFilter) return false;
    if (search && !e.produto_nome.toLowerCase().includes(search.toLowerCase()) && !e.produto_sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusConfig = {
    normal: { label: "Normal", className: "bg-success text-success-foreground" },
    critico: { label: "Crítico", className: "bg-warning text-warning-foreground" },
    zerado: { label: "Zerado", className: "bg-critical text-critical-foreground" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Estoque Atual (Real)</h1>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {setores.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Nenhum saldo encontrado no banco real.</TableCell></TableRow>
              ) : filtered.map(e => {
                const status = getStatusEstoque(e.qtd_fisica, e.produto_estoque_minimo);
                const cfg = statusConfig[status];
                return (
                  <TableRow key={`${e.produto_id}-${e.deposito_id}`}>
                    <TableCell className="font-medium">{e.produto_nome}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{e.produto_sku}</TableCell>
                    <TableCell>{e.deposito_nome}</TableCell>
                    <TableCell className="text-right font-semibold">{e.qtd_fisica}</TableCell>
                    <TableCell>{e.produto_unidade}</TableCell>
                    <TableCell>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
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
