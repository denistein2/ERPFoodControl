import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ordensProducao, produtos, setores, getProduto, getSetor, type OrdemProducao, type StatusOrdem } from "@/data/mockData";

const statusConfig: Record<StatusOrdem, { label: string; className: string }> = {
  aberta: { label: "Aberta", className: "bg-primary text-primary-foreground" },
  em_producao: { label: "Em Produção", className: "bg-warning text-warning-foreground" },
  concluida: { label: "Concluída", className: "bg-success text-success-foreground" },
  cancelada: { label: "Cancelada", className: "bg-muted text-muted-foreground" },
};

export default function ProductionOrders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [ordens, setOrdens] = useState(ordensProducao);

  const filtered = ordens.filter(o => statusFilter === "todos" || o.status === statusFilter);

  const updateStatus = (id: string, newStatus: StatusOrdem) => {
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    const labels: Record<string, string> = { em_producao: "Produção iniciada", concluida: "Ordem concluída", cancelada: "Ordem cancelada" };
    toast.success(labels[newStatus] || "Status atualizado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Ordens de Produção</h1>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Ordem</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="em_producao">Em Produção</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => {
                const cfg = statusConfig[o.status];
                const prod = getProduto(o.produtoFinalId);
                const setor = getSetor(o.setorId);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-semibold">{o.numero}</TableCell>
                    <TableCell>{prod?.nome}</TableCell>
                    <TableCell className="text-right">{o.quantidade}</TableCell>
                    <TableCell>{setor?.nome}</TableCell>
                    <TableCell><Badge className={cfg.className}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {o.status === "aberta" && (
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(o.id, "em_producao")} title="Iniciar">
                            <Play className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {o.status === "em_producao" && (
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(o.id, "concluida")} title="Concluir">
                            <CheckCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        {(o.status === "aberta" || o.status === "em_producao") && (
                          <Button variant="ghost" size="icon" onClick={() => updateStatus(o.id, "cancelada")} title="Cancelar">
                            <XCircle className="h-4 w-4 text-critical" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [itens, setItens] = useState([{ produtoId: "", quantidade: "" }]);

  const addItem = () => setItens(prev => [...prev, { produtoId: "", quantidade: "" }]);
  const removeItem = (i: number) => setItens(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Produção</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Número</Label>
            <Input placeholder="Auto-gerado" />
          </div>
          <div className="grid gap-2">
            <Label>Produto Final *</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {produtos.filter(p => p.ativo).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Quantidade *</Label>
              <Input type="number" min="1" />
            </div>
            <div className="grid gap-2">
              <Label>Setor *</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Itens a Consumir</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" />Adicionar
              </Button>
            </div>
            {itens.map((item, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
                    <SelectContent>
                      {produtos.filter(p => p.ativo).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Input type="number" placeholder="Qtd" className="w-24" />
                {itens.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-critical" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label>Observação</Label>
            <Textarea />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onOpenChange(false); toast.success("Ordem criada!"); }}>Criar Ordem</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
