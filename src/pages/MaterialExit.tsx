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

export default function MaterialExit() {
  const [produtoId, setProdutoId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [observacao, setObservacao] = useState("");

  const prod = getProduto(produtoId);
  const saldo = produtoId && setorId ? getEstoqueProdutoSetor(produtoId, setorId) : null;
  const qtdNum = Number(quantidade) || 0;
  const excede = saldo !== null && qtdNum > saldo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId || !setorId || !quantidade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (excede) { toast.error("Quantidade excede saldo"); return; }
    toast.success(`Saída registrada: ${qtdNum} ${prod?.unidade} de ${getSetor(setorId)?.nome}`);
    setProdutoId(""); setSetorId(""); setQuantidade(""); setReferencia(""); setObservacao("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Saída de Material</h1>
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
              <Label>Setor de origem *</Label>
              <Select value={setorId} onValueChange={setSetorId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {saldo !== null && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Saldo: </span>
                  <Badge variant="secondary">{saldo} {prod?.unidade}</Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                className={excede ? "border-critical" : ""} />
              {excede && <p className="text-sm text-critical">Excede saldo disponível ({saldo})</p>}
            </div>
            <div className="grid gap-2">
              <Label>Referência (pedido, cliente)</Label>
              <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="grid gap-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={excede}>Registrar Saída</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
