
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

const statusColors: Record<string, string> = {
  aberto: 'bg-info text-info-foreground',
  parcial: 'bg-warning text-warning-foreground',
  quitado: 'bg-success text-success-foreground',
  cancelado: 'bg-secondary text-secondary-foreground',
};

const mockReceber = [
  { id: 1, numero: 'TIT-R-001', tipo: 'NF', dataVencimento: '2026-03-10', valorOriginal: '15750.00', valorSaldo: '15750.00', status: 'aberto', cliente: 'Metalúrgica Silva Ltda' },
  { id: 2, numero: 'TIT-R-002', tipo: 'NF', dataVencimento: '2026-02-28', valorOriginal: '3200.00', valorSaldo: '1600.00', status: 'parcial', cliente: 'Auto Peças Central' },
  { id: 3, numero: 'TIT-R-003', tipo: 'NF', dataVencimento: '2026-03-20', valorOriginal: '45000.00', valorSaldo: '0.00', status: 'quitado', cliente: 'Construções ABC S.A.' },
  { id: 4, numero: 'TIT-R-004', tipo: 'NF', dataVencimento: '2026-03-01', valorOriginal: '8500.00', valorSaldo: '8500.00', status: 'aberto', cliente: 'Metalúrgica Silva Ltda' },
];

const mockPagar = [
  { id: 1, numero: 'TIT-P-001', tipo: 'NF', dataVencimento: '2026-03-08', valorOriginal: '22000.00', valorSaldo: '22000.00', status: 'aberto', fornecedor: 'Aço Nacional S.A.' },
  { id: 2, numero: 'TIT-P-002', tipo: 'NF', dataVencimento: '2026-03-15', valorOriginal: '5500.00', valorSaldo: '5500.00', status: 'aberto', fornecedor: 'Distribuidora Central' },
  { id: 3, numero: 'TIT-P-003', tipo: 'NF', dataVencimento: '2026-02-25', valorOriginal: '12000.00', valorSaldo: '4000.00', status: 'parcial', fornecedor: 'Metalforte Ind.' },
];

function calcResumo(titulos: { dataVencimento: string; valorSaldo: string; status: string }[]) {
  const hoje = new Date();
  const em30 = new Date();
  em30.setDate(em30.getDate() + 30);

  const abertos = titulos.filter(t => t.status === 'aberto' || t.status === 'parcial');
  const totalAberto = abertos.reduce((s, t) => s + parseFloat(t.valorSaldo), 0);
  const totalVencido = abertos.filter(t => new Date(t.dataVencimento) < hoje).reduce((s, t) => s + parseFloat(t.valorSaldo), 0);
  const totalVencer30 = abertos.filter(t => { const d = new Date(t.dataVencimento); return d >= hoje && d <= em30; }).reduce((s, t) => s + parseFloat(t.valorSaldo), 0);

  return { totalAberto, totalVencido, totalVencer30 };
}

function TitulosTab({ titulos, entityLabel }: { titulos: { id: number; numero: string; dataVencimento: string; valorOriginal: string; valorSaldo: string; status: string; [k: string]: any }[]; entityLabel: string }) {
  const resumo = calcResumo(titulos);
  const hoje = new Date();
  const sorted = [...titulos].sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total em Aberto</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /><span className="text-xl font-bold">{formatCurrency(resumo.totalAberto)}</span></div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Vencido</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" /><span className="text-xl font-bold text-destructive">{formatCurrency(resumo.totalVencido)}</span></div></CardContent>
        </Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A Vencer (30 dias)</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Clock className="w-5 h-5 text-warning" /><span className="text-xl font-bold">{formatCurrency(resumo.totalVencer30)}</span></div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Título</TableHead><TableHead>{entityLabel}</TableHead><TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor Original</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(t => {
                const vencido = (t.status === 'aberto' || t.status === 'parcial') && new Date(t.dataVencimento) < hoje;
                return (
                  <TableRow key={t.id} className={vencido ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-mono">{t.numero}</TableCell>
                    <TableCell>{t.cliente || t.fornecedor}</TableCell>
                    <TableCell className={vencido ? 'text-destructive font-medium' : ''}>{formatDate(t.dataVencimento)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(t.valorOriginal)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(t.valorSaldo)}</TableCell>
                    <TableCell><Badge className={statusColors[t.status] || ''}>{t.status}</Badge></TableCell>
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

export default function Financeiro() {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground text-sm">Contas a receber e a pagar</p>
        </div>

        <Tabs defaultValue="receber">
          <TabsList><TabsTrigger value="receber">A Receber</TabsTrigger><TabsTrigger value="pagar">A Pagar</TabsTrigger></TabsList>
          <TabsContent value="receber"><TitulosTab titulos={mockReceber} entityLabel="Cliente" /></TabsContent>
          <TabsContent value="pagar"><TitulosTab titulos={mockPagar} entityLabel="Fornecedor" /></TabsContent>
        </Tabs>
      </div>
  );
}
