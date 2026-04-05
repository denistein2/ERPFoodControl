import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { produtos, setores, getEstoqueProdutoSetor, getProduto, getSetor } from "@/data/mockData";

export default function MaterialEntry() {
  const [produtoId, setProdutoId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [lote, setLote] = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacao, setObservacao] = useState("");

  const prod = getProduto(produtoId);
  const setor = getSetor(setorId);
  const saldoAtual = produtoId && setorId ? getEstoqueProdutoSetor(produtoId, setorId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId || !setorId || !quantidade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const novoSaldo = (saldoAtual ?? 0) + Number(quantidade);
    toast.success(`Entrada registrada! Novo saldo de ${prod?.nome} em ${setor?.nome}: ${novoSaldo} ${prod?.unidade}`);
    setProdutoId(""); setSetorId(""); setQuantidade(""); setLote(""); setReferencia(""); setObservacao("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Entrada de Material</h1>
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Produto *</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger><SelectValue placeholder="Buscar produto..." /></SelectTrigger>
                <SelectContent>
                  {produtos.filter(p => p.ativo).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Setor de destino *</Label>
              <Select value={setorId} onValueChange={setSetorId}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {saldoAtual !== null && (
              <div className="p-3 rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">Saldo atual: </span>
                <Badge variant="secondary" className="font-semibold">{saldoAtual} {prod?.unidade}</Badge>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lote</Label>
                <Input value={lote} onChange={e => setLote(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="grid gap-2">
                <Label>Referência / NF</Label>
                <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Opcional" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Opcional" />
            </div>
            <Button type="submit" className="w-full">Registrar Entrada</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
