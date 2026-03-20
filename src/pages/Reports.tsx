import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search } from "lucide-react";
import { transacoes, produtos, setores, getProduto, getSetor, tipoTransacaoLabel, type TipoTransacao } from "@/data/mockData";

export default function Reports() {
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const filtered = transacoes
    .filter(t => {
      if (tipoFilter !== "todos" && t.tipo !== tipoFilter) return false;
      if (search) {
        const prod = getProduto(t.produtoId);
        if (!prod?.nome.toLowerCase().includes(search.toLowerCase()) && !prod?.sku.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const exportCSV = () => {
    const header = "Data,Tipo,Produto,SKU,Origem,Destino,Quantidade,Usuário,Referência\n";
    const rows = filtered.map(t => {
      const p = getProduto(t.produtoId);
      return [
        new Date(t.data).toLocaleString("pt-BR"),
        tipoTransacaoLabel[t.tipo],
        p?.nome, p?.sku,
        t.setorOrigemId ? getSetor(t.setorOrigemId)?.nome : "",
        t.setorDestinoId ? getSetor(t.setorDestinoId)?.nome : "",
        t.quantidade, t.usuario, t.referencia || "",
      ].join(",");
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "relatorio-movimentacoes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="movimentacao">Movimentação</SelectItem>
                <SelectItem value="producao_consumo">Consumo Produção</SelectItem>
                <SelectItem value="producao_entrada">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => {
                const prod = getProduto(t.produtoId);
                const origem = t.setorOrigemId ? getSetor(t.setorOrigemId)?.nome : "—";
                const destino = t.setorDestinoId ? getSetor(t.setorDestinoId)?.nome : "—";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{new Date(t.data).toLocaleString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="secondary">{tipoTransacaoLabel[t.tipo]}</Badge></TableCell>
                    <TableCell className="font-medium">{prod?.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{origem} → {destino}</TableCell>
                    <TableCell className="text-right font-semibold">{t.quantidade}</TableCell>
                    <TableCell className="text-sm">{t.usuario}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.referencia || "—"}</TableCell>
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
