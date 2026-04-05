import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pendente: 'bg-secondary text-secondary-foreground',
  confirmado: 'bg-info text-info-foreground',
  parcialmente_faturado: 'bg-warning text-warning-foreground',
  faturado: 'bg-success text-success-foreground',
  cancelado: 'bg-destructive text-destructive-foreground',
};

const mockPedidos = [
  { id: 1, numeroPedido: 'PED-2024-001', clienteId: 1, cliente: 'Metalúrgica Silva Ltda', status: 'confirmado', valorTotal: '15750.00', dataEmissao: '2026-03-01', dataPrazo: '2026-03-15',
    itens: [
      { produtoId: 1, produto: 'Parafuso Sextavado M8', qtdSolicitada: 500, qtdReservada: 300, qtdFaturada: 0, precoUnitario: '12.50', total: '6250.00' },
      { produtoId: 4, produto: 'Barra Roscada M12 1m', qtdSolicitada: 200, qtdReservada: 200, qtdFaturada: 0, precoUnitario: '28.00', total: '5600.00' },
    ]
  },
  { id: 2, numeroPedido: 'PED-2024-002', clienteId: 2, cliente: 'Auto Peças Central', status: 'pendente', valorTotal: '3200.00', dataEmissao: '2026-03-05', dataPrazo: '2026-03-20', itens: [] },
  { id: 3, numeroPedido: 'PED-2024-003', clienteId: 3, cliente: 'Construções ABC S.A.', status: 'faturado', valorTotal: '45000.00', dataEmissao: '2026-02-20', dataPrazo: '2026-03-10', itens: [] },
  { id: 4, numeroPedido: 'PED-2024-004', clienteId: 1, cliente: 'Metalúrgica Silva Ltda', status: 'cancelado', valorTotal: '1200.00', dataEmissao: '2026-02-28', dataPrazo: '2026-03-05', itens: [] },
];

export default function Pedidos() {
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<typeof mockPedidos[0] | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success('Pedido criado com sucesso!');
    setCreateOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-muted-foreground text-sm">Gestão de pedidos de venda</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Pedido</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Pedido</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2"><Label>Número do Pedido</Label><Input required placeholder="PED-2024-005" /></div>
                <div className="space-y-2"><Label>Cliente</Label><Input required placeholder="Buscar cliente..." /></div>
                <div className="space-y-2"><Label>Data Prazo</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Observações do pedido" /></div>
                <DialogFooter><Button type="submit">Criar Pedido</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Data Emissão</TableHead>
                  <TableHead>Prazo</TableHead><TableHead className="text-right">Valor Total</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPedidos.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12">
                    <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  </TableCell></TableRow>
                ) : mockPedidos.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(p)}>
                    <TableCell className="font-mono font-medium">{p.numeroPedido}</TableCell>
                    <TableCell>{p.cliente}</TableCell>
                    <TableCell>{formatDate(p.dataEmissao)}</TableCell>
                    <TableCell>{formatDate(p.dataPrazo)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.valorTotal)}</TableCell>
                    <TableCell><Badge className={statusColors[p.status] || ''}>{p.status.replace('_', ' ')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Pedido {selected?.numeroPedido}</SheetTitle></SheetHeader>
          {selected && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Cliente:</span><p className="font-medium">{selected.cliente}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p><Badge className={statusColors[selected.status]}>{selected.status.replace('_', ' ')}</Badge></p></div>
                <div><span className="text-muted-foreground">Emissão:</span><p>{formatDate(selected.dataEmissao)}</p></div>
                <div><span className="text-muted-foreground">Prazo:</span><p>{formatDate(selected.dataPrazo)}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Valor Total:</span><p className="text-lg font-bold">{formatCurrency(selected.valorTotal)}</p></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Itens do Pedido</h3>
                  <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" />Adicionar</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Adicionar Item</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); toast.success('Item adicionado!'); setAddItemOpen(false); }} className="space-y-4">
                        <div className="space-y-2"><Label>Produto</Label><Input required placeholder="Buscar produto..." /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Quantidade</Label><Input required type="number" min="1" /></div>
                          <div className="space-y-2"><Label>Preço Unitário (R$)</Label><Input required type="number" step="0.01" /></div>
                        </div>
                        <DialogFooter><Button type="submit">Adicionar</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {selected.itens.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado</p>
                ) : (
                  <div className="space-y-3">
                    {selected.itens.map((item, i) => (
                      <Card key={i}>
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{item.produto}</p>
                          <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                            <span>Solicitada: {item.qtdSolicitada}</span>
                            <span>Reservada: {item.qtdReservada}</span>
                            <span>Faturada: {item.qtdFaturada}</span>
                            <span>Unit.: {formatCurrency(item.precoUnitario)}</span>
                          </div>
                          <p className="text-sm font-semibold mt-1">Total: {formatCurrency(item.total)}</p>
                          {item.qtdReservada < item.qtdSolicitada && (
                            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => toast.info('Reserva de estoque em desenvolvimento')}>Reservar Estoque</Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
