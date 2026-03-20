import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Info } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

const mockNFs = [
  { id: 1, numeroNF: '000123', fornecedor: 'Aço Nacional S.A.', dataEmissao: '2026-03-01', totalNF: '22000.00', chaveAcesso: '35260312345678000190550010001230001234567890' },
  { id: 2, numeroNF: '000456', fornecedor: 'Distribuidora Central', dataEmissao: '2026-03-03', totalNF: '5500.00', chaveAcesso: null },
];

export default function NotasFiscais() {
  const [nfs, setNfs] = useState(mockNFs);
  const [form, setForm] = useState({ numeroNF: '', fornecedor: '', dataEmissao: '', totalNF: '', chaveAcesso: '' });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.chaveAcesso && form.chaveAcesso.length !== 44) {
      toast.error('Chave de acesso deve ter 44 caracteres');
      return;
    }
    setNfs(prev => [...prev, { id: prev.length + 1, ...form, chaveAcesso: form.chaveAcesso || null }]);
    toast.success('Nota fiscal registrada com sucesso!');
    setForm({ numeroNF: '', fornecedor: '', dataEmissao: '', totalNF: '', chaveAcesso: '' });
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
          <p className="text-muted-foreground text-sm">Registro e consulta de notas fiscais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Registrar NF-e</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Número da NF</Label><Input required value={form.numeroNF} onChange={e => setForm(f => ({ ...f, numeroNF: e.target.value }))} placeholder="000789" /></div>
                <div className="space-y-2"><Label>Fornecedor</Label><Input required value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} placeholder="Nome do fornecedor" /></div>
                <div className="space-y-2"><Label>Data de Emissão</Label><Input type="date" required value={form.dataEmissao} onChange={e => setForm(f => ({ ...f, dataEmissao: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Valor Total (R$)</Label><Input type="number" step="0.01" required value={form.totalNF} onChange={e => setForm(f => ({ ...f, totalNF: e.target.value }))} /></div>
                <div className="space-y-2">
                  <Label>Chave de Acesso (opcional)</Label>
                  <Input value={form.chaveAcesso} onChange={e => setForm(f => ({ ...f, chaveAcesso: e.target.value }))} placeholder="44 caracteres" maxLength={44} />
                  {form.chaveAcesso && form.chaveAcesso.length !== 44 && <p className="text-xs text-destructive">{form.chaveAcesso.length}/44 caracteres</p>}
                </div>
                <Button type="submit" className="w-full">Registrar NF-e</Button>
              </form>
              <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-muted">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Importação automática de XML disponível em breve</p>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader><CardTitle className="text-lg">NFs Registradas</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Nº NF</TableHead><TableHead>Fornecedor</TableHead><TableHead>Emissão</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {nfs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">Nenhuma NF registrada</p>
                    </TableCell></TableRow>
                  ) : nfs.map(nf => (
                    <TableRow key={nf.id}>
                      <TableCell className="font-mono">{nf.numeroNF}</TableCell>
                      <TableCell>{nf.fornecedor}</TableCell>
                      <TableCell>{formatDate(nf.dataEmissao)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(nf.totalNF)}</TableCell>
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
