import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { produtos, setores, getEstoqueProdutoSetor, getProduto, getSetor } from "@/data/mockData";

export default function StockMovement() {
  const [produtoId, setProdutoId] = useState("");
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");

  const prod = getProduto(produtoId);
  const saldoOrigem = produtoId && origemId ? getEstoqueProdutoSetor(produtoId, origemId) : null;
  const qtdNum = Number(quantidade) || 0;
  const excedeSaldo = saldoOrigem !== null && qtdNum > saldoOrigem;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId || !origemId || !destinoId || !quantidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (origemId === destinoId) {
      toast.error("Origem e destino devem ser diferentes");
      return;
    }
    if (excedeSaldo) {
      toast.error("Quantidade excede o saldo disponível");
      return;
    }
    toast.success(`Movimentação registrada: ${qtdNum} ${prod?.unidade} de ${getSetor(origemId)?.nome} → ${getSetor(destinoId)?.nome}`);
    setProdutoId(""); setOrigemId(""); setDestinoId(""); setQuantidade(""); setObservacao("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Movimentação entre Setores</h1>
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Produto *</Label>
              <Select value={produtoId} onValueChange={v => { setProdutoId(v); setOrigemId(""); }}>
                <SelectTrigger><SelectValue placeholder="Buscar produto..." /></SelectTrigger>
                <SelectContent>
                  {produtos.filter(p => p.ativo).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Setor de origem *</Label>
                <Select value={origemId} onValueChange={setOrigemId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {setores.filter(s => s.ativo).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {saldoOrigem !== null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Saldo: </span>
                    <Badge variant="secondary">{saldoOrigem} {prod?.unidade}</Badge>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Setor de destino *</Label>
                <Select value={destinoId} onValueChange={setDestinoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {setores.filter(s => s.ativo && s.id !== origemId).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input
                type="number" min="1" value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                className={excedeSaldo ? "border-critical" : ""}
              />
              {excedeSaldo && (
                <p className="text-sm text-critical">Quantidade excede o saldo disponível ({saldoOrigem})</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={excedeSaldo}>Registrar Movimentação</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
