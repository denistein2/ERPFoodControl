import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, User, Building2 } from 'lucide-react';
import { formatCurrency, formatCPFCNPJ } from '@/lib/format';
import { toast } from 'sonner';

const mockClientes = [
  { id: 1, tipoPessoa: 'J', razaoSocial: 'Metalúrgica Silva Ltda', nomeFantasia: 'Silva Metais', cpfCnpj: '12345678000190', email: 'contato@silva.com', telefone: '11999887766', limiteCredito: '50000.00', saldoCredito: '32500.00', bloqueado: false, ativo: true },
  { id: 2, tipoPessoa: 'J', razaoSocial: 'Auto Peças Central EIRELI', nomeFantasia: 'Central Peças', cpfCnpj: '98765432000110', email: 'vendas@central.com', telefone: '11988776655', limiteCredito: '30000.00', saldoCredito: '28000.00', bloqueado: false, ativo: true },
  { id: 3, tipoPessoa: 'F', razaoSocial: 'João Carlos de Souza', nomeFantasia: null, cpfCnpj: '12345678901', email: 'joao@email.com', telefone: '11977665544', limiteCredito: '5000.00', saldoCredito: '0.00', bloqueado: true, ativo: true },
  { id: 4, tipoPessoa: 'J', razaoSocial: 'Construções ABC S.A.', nomeFantasia: 'ABC Construções', cpfCnpj: '11222333000144', email: 'compras@abc.com', telefone: '11966554433', limiteCredito: '100000.00', saldoCredito: '75000.00', bloqueado: false, ativo: true },
  { id: 5, tipoPessoa: 'F', razaoSocial: 'Maria Oliveira Santos', nomeFantasia: null, cpfCnpj: '98765432100', email: null, telefone: '11955443322', limiteCredito: '3000.00', saldoCredito: '3000.00', bloqueado: false, ativo: false },
];

type Filter = 'todos' | 'ativos' | 'bloqueados';

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = mockClientes.filter(c => {
    const matchSearch = c.razaoSocial.toLowerCase().includes(search.toLowerCase()) || c.cpfCnpj.includes(search);
    if (filter === 'ativos') return matchSearch && c.ativo && !c.bloqueado;
    if (filter === 'bloqueados') return matchSearch && c.bloqueado;
    return matchSearch;
  });

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground text-sm">Cadastro e gestão de clientes</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); toast.success('Cliente criado!'); setCreateOpen(false); }} className="space-y-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="F">Pessoa Física</SelectItem><SelectItem value="J">Pessoa Jurídica</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Razão Social / Nome</Label><Input required /></div>
                <div className="space-y-2"><Label>Nome Fantasia</Label><Input /></div>
                <div className="space-y-2"><Label>CPF / CNPJ</Label><Input required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" /></div>
                  <div className="space-y-2"><Label>Telefone</Label><Input /></div>
                </div>
                <div className="space-y-2"><Label>Limite de Crédito (R$)</Label><Input type="number" step="0.01" /></div>
                <DialogFooter><Button type="submit">Criar Cliente</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CPF/CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2">
            {(['todos', 'ativos', 'bloqueados'] as Filter[]).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead><TableHead>Razão Social</TableHead><TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Limite</TableHead>
                  <TableHead className="text-right">Saldo Disp.</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                  </TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.tipoPessoa === 'F' ? <User className="w-4 h-4 text-primary" /> : <Building2 className="w-4 h-4 text-primary" />}</TableCell>
                    <TableCell className="font-medium">{c.razaoSocial}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCPFCNPJ(c.cpfCnpj)}</TableCell>
                    <TableCell className="text-sm">{c.email || '—'}</TableCell>
                    <TableCell className="text-sm">{c.telefone}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.limiteCredito)}</TableCell>
                    <TableCell className={`text-right font-medium ${c.bloqueado ? 'text-destructive' : 'text-success'}`}>{formatCurrency(c.saldoCredito)}</TableCell>
                    <TableCell>
                      {c.bloqueado && <Badge className="bg-destructive text-destructive-foreground">Bloqueado</Badge>}
                      {!c.ativo && !c.bloqueado && <Badge variant="secondary">Inativo</Badge>}
                      {c.ativo && !c.bloqueado && <Badge className="bg-success text-success-foreground">Ativo</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
}
