
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, AlertTriangle, Clock, Banknote, ArrowUpRight, ArrowDownRight, PlusCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

function FluxoDeCaixaTab() {
  const [activeSession, setActiveSession] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMovement, setNewMovement] = useState({ description: '', amount: '', type: 'Entrada' });

  const fetchData = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    
    const { data: session } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('status', 'Aberto')
      .maybeSingle();
    
    setActiveSession(session);

    if (session) {
      const { data: mv } = await supabase
        .from('cashier_movements')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: false });
      
      const { data: txs } = await supabase
        .from('financial_transactions')
        .select('*, payment_methods(name)')
        .eq('cashier_session_id', session.id);

      // Combinar movimentos manuais e vendas
      const allMovements = [
        ...(mv || []).map(m => ({ ...m, isManual: true })),
        ...(txs || []).map(t => ({
          id: t.id,
          type: 'Entrada',
          description: t.description,
          amount: t.amount,
          method: t.payment_methods?.name || 'Venda',
          created_at: t.created_at,
          isManual: false
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setMovements(allMovements);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMovement = async () => {
    if (!activeSession) return;
    if (!newMovement.description || !newMovement.amount) return;

    const { error } = await supabase
      .from('cashier_movements')
      .insert([{
        session_id: activeSession.id,
        type: newMovement.type,
        description: newMovement.description,
        amount: parseFloat(newMovement.amount),
        method: 'Dinheiro'
      }]);

    if (error) {
      toast.error('Erro ao salvar movimento');
    } else {
      toast.success('Movimento registrado!');
      setNewMovement({ description: '', amount: '', type: 'Entrada' });
      fetchData();
    }
  };

  const handleCloseCashier = async () => {
    if (!activeSession) return;
    
    // Calcular o saldo final
    const totalIn = movements.filter(m => m.type === 'Entrada').reduce((s, m) => s + Number(m.amount), 0);
    const totalOut = movements.filter(m => m.type === 'Saída').reduce((s, m) => s + Number(m.amount), 0);
    const closingBalance = (activeSession.opening_balance || 0) + totalIn - totalOut;

    const { error } = await supabase
      .from('cashier_sessions')
      .update({ 
        status: 'Fechado', 
        closed_at: new Date().toISOString(),
        closing_balance: closingBalance 
      })
      .eq('id', activeSession.id);

    if (error) {
      toast.error('Erro ao fechar caixa');
    } else {
      toast.success('Caixa fechado com sucesso!');
      fetchData();
    }
  };

  const totalIn = movements.filter(m => m.type === 'Entrada').reduce((s, m) => s + Number(m.amount), 0);
  const totalOut = movements.filter(m => m.type === 'Saída').reduce((s, m) => s + Number(m.amount), 0);
  const currentBalance = (activeSession?.opening_balance || 0) + totalIn - totalOut;

  if (!activeSession && !loading) {
    return (
      <Card className="p-12 text-center bg-muted/20 border-dashed">
        <div className="mx-auto bg-muted p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-muted-foreground">
          <Banknote className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">Caixa Fechado</h3>
        <p className="text-muted-foreground max-w-sm mx-auto mt-2">Abra o caixa no módulo de PDV para começar a registrar as movimentações financeiras do dia.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Saldo Inicial</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(activeSession?.opening_balance || 0)}</p></CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Entradas (Vendas + Reforço)</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-green-600">+{formatCurrency(totalIn)}</p></CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Saídas (Sangria)</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-red-600">-{formatCurrency(totalOut)}</p></CardContent>
        </Card>
        <Card className="bg-primary border-primary">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs uppercase text-primary-foreground/70">Saldo Atual em Caixa</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20"
              onClick={() => {
                if (window.confirm('Deseja realmente fechar o caixa e encerrar o turno?')) {
                  handleCloseCashier();
                }
              }}
            >
              Fechar Caixa
            </Button>
          </CardHeader>
          <CardContent><p className="text-2xl font-black text-primary-foreground">{formatCurrency(currentBalance)}</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Movimentações do Dia</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {m.type === 'Entrada' ? <ArrowUpRight className="w-3 h-3 text-green-600" /> : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                        <span className="font-medium">{m.description}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{m.method}</Badge></TableCell>
                    <TableCell className={`text-right font-bold ${m.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type === 'Entrada' ? '+' : '-'}{formatCurrency(m.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Sangria / Reforço</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                placeholder="Ex: Sangria p/ Pagamento" 
                value={newMovement.description}
                onChange={e => setNewMovement(p => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input 
                type="number" 
                placeholder="0,00" 
                value={newMovement.amount}
                onChange={e => setNewMovement(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={newMovement.type === 'Entrada' ? 'default' : 'outline'} 
                className="flex-1"
                onClick={() => setNewMovement(p => ({ ...p, type: 'Entrada' }))}
              >Reforço</Button>
              <Button 
                variant={newMovement.type === 'Saída' ? 'default' : 'outline'} 
                className="flex-1"
                onClick={() => setNewMovement(p => ({ ...p, type: 'Saída' }))}
              >Sangria</Button>
            </div>
            <Button className="w-full mt-4" onClick={handleAddMovement} disabled={!newMovement.description || !newMovement.amount}>
              <PlusCircle className="mr-2 h-4 w-4" /> Registrar no Caixa
            </Button>
          </CardContent>
        </Card>
      </div>
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

        <Tabs defaultValue="caixa">
          <TabsList>
            <TabsTrigger value="caixa">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="receber">A Receber</TabsTrigger>
            <TabsTrigger value="pagar">A Pagar</TabsTrigger>
          </TabsList>
          <TabsContent value="caixa"><FluxoDeCaixaTab /></TabsContent>
          <TabsContent value="receber"><TitulosTab titulos={mockReceber} entityLabel="Cliente" /></TabsContent>
          <TabsContent value="pagar"><TitulosTab titulos={mockPagar} entityLabel="Fornecedor" /></TabsContent>
        </Tabs>
      </div>
  );
}
