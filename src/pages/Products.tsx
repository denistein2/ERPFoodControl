import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { produtos, categorias, unidades, getCategoria, type Produto, type Unidade } from "@/data/mockData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";

/** Converte linha do Supabase (snake_case) para Produto (camelCase). */
function fromSupabaseRow(row: Record<string, unknown>): Produto {
  return {
    id: row.id as string,
    nome: (row.name ?? row.nome) as string,
    sku: row.sku as string,
    categoriaId: (row.categoria_id ?? row.categoriaId) as string,
    unidade: row.unidade as Unidade,
    estoqueMinimo: Number(row.min_stock ?? row.estoqueMinimo ?? 0),
    costPrice: Number(row.cost_price ?? row.costPrice ?? 0),
    sellPrice: Number(row.sell_price ?? row.sellPrice ?? 0),
    isQuickAccess: Boolean(row.is_quick_access ?? row.isQuickAccess ?? false),
    permiteNegativo: Boolean(row.permite_negativo ?? row.permiteNegativo ?? false),
    ativo: Boolean(row.ativo ?? true),
  };
}

/** Converte payload do app (camelCase) para objeto Supabase (snake_case). */
function toSupabaseRow(payload: Omit<Produto, "id"> & { id?: string }) {
  return {
    name: String(payload.nome ?? ""),
    sku: String(payload.sku ?? "").trim(),
    categoria_id: String(payload.categoriaId ?? ""),
    unidade: String(payload.unidade ?? "un"),
    min_stock: Number(payload.estoqueMinimo) || 0,
    cost_price: Number(payload.costPrice) || 0,
    sell_price: Number(payload.sellPrice) || 0,
    is_quick_access: Boolean(payload.isQuickAccess),
    permite_negativo: Boolean(payload.permiteNegativo),
    ativo: Boolean(payload.ativo),
  };
}

export default function Products() {
  const { isAdmin } = useProfile();
  const [productList, setProductList] = useState<Produto[]>(() => (isSupabaseConfigured ? [] : [...produtos]));
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  // Bug 2: Permitir todos os usuários autenticados (MVP)
  const canEditProducts = !isSupabaseConfigured || !!profile;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) setProductList(data.map(fromSupabaseRow));
      setLoading(false);
    };
    fetchItems();
  }, []);

  const filtered = productList.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditProduct(null); setDialogOpen(true); };
  const openEdit = (p: Produto) => { setEditProduct(p); setDialogOpen(true); };

  const handleSave = async (payload: Omit<Produto, "id"> & { id?: string }) => {
    if (isSupabaseConfigured) {
      const row = toSupabaseRow(payload);
      if (editProduct) {
        const { error } = await supabase
          .from("products")
          .update(row)
          .eq("id", editProduct.id);
        if (error) {
          console.error("Supabase update error:", error);
          toast.error(error.message || "Erro ao atualizar produto.");
          return;
        }
        setProductList(prev => prev.map(p => p.id === editProduct.id ? { ...p, ...payload } : p));
        setDialogOpen(false);
        toast.success("Produto atualizado.");
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([row])
          .select();
        if (error) {
          console.error("Supabase insert error:", error);
          toast.error(error.message || "Erro ao cadastrar produto.");
          return;
        }
        if (data?.length) {
          setProductList(prev => [...prev, fromSupabaseRow(data[0] as Record<string, unknown>)]);
          setDialogOpen(false);
          toast.success("Produto cadastrado.");
        }
      }
    } else {
      if (editProduct) {
        setProductList(prev => prev.map(p => p.id === editProduct.id ? { ...payload, id: p.id } as Produto : p));
      } else {
        const id = "p" + Date.now();
        setProductList(prev => [...prev, { ...payload, id } as Produto]);
      }
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        {canEditProducts ? (
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
        ) : (
          <p className="text-sm text-muted-foreground">Apenas administradores podem criar ou editar produtos.</p>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Preço Venda</TableHead>
                <TableHead className="text-right">Est. Mínimo</TableHead>
                <TableHead className="text-center">PDV</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(p => (
                  <TableRow
                    key={p.id}
                    className={canEditProducts ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => canEditProducts && openEdit(p)}
                  >
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>{getCategoria(p.categoriaId)?.nome}</TableCell>
                    <TableCell>{p.unidade}</TableCell>
                    <TableCell className="text-right font-medium">R$ {p.sellPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.estoqueMinimo}</TableCell>
                    <TableCell className="text-center">
                      {p.isQuickAccess && <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Rápido</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.ativo ? "default" : "secondary"}>
                        {p.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
        onSave={handleSave}
      />
    </div>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  product,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Produto | null;
  onSave: (payload: Omit<Produto, "id"> & { id?: string }) => void;
}) {
  const isEdit = !!product;
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("un");
  const [estoqueMinimo, setEstoqueMinimo] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [isQuickAccess, setIsQuickAccess] = useState(false);
  const [permiteNegativo, setPermiteNegativo] = useState(false);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (open) {
      setNome(product?.nome ?? "");
      setSku(product?.sku ?? "");
      setCategoriaId(product?.categoriaId ?? categorias[0]?.id ?? "");
      setUnidade(product?.unidade ?? "un");
      setEstoqueMinimo(product?.estoqueMinimo ?? 0);
      setCostPrice(product?.costPrice ?? 0);
      setSellPrice(product?.sellPrice ?? 0);
      setIsQuickAccess(product?.isQuickAccess ?? false);
      setPermiteNegativo(product?.permiteNegativo ?? false);
      setAtivo(product?.ativo ?? true);
    }
  }, [open, product]);

  const handleSubmit = () => {
    const nomeTrim = nome.trim();
    const skuTrim = sku.trim();
    if (!nomeTrim || !skuTrim) return;
    if (!categoriaId) return;
    onSave({
      nome: nomeTrim,
      sku: skuTrim,
      categoriaId,
      unidade,
      estoqueMinimo: Number(estoqueMinimo) || 0,
      costPrice: Number(costPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      isQuickAccess,
      permiteNegativo,
      ativo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Altere os dados do produto e salve." : "Preencha os dados do novo produto."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do produto" />
          </div>
          <div className="grid gap-2">
            <Label>SKU *</Label>
            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Código SKU único" />
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Unidade *</Label>
            <Select value={unidade} onValueChange={v => setUnidade(v as Unidade)}>
              <SelectTrigger><SelectValue placeholder="Selecione a unidade (un, kg, m, etc.)" /></SelectTrigger>
              <SelectContent>
                {unidades.map(u => (
                  <SelectItem key={u} value={u}>
                    {u === "un" ? "un (unidade)" : u === "pç" ? "pç (peça)" : u === "cx" ? "cx (caixa)" : u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Preço de Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={e => setCostPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Preço de Venda (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={sellPrice}
                onChange={e => setSellPrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Estoque Mínimo</Label>
            <Input
              type="number"
              min={0}
              value={estoqueMinimo}
              onChange={e => setEstoqueMinimo(Number(e.target.value) || 0)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Destaque no PDV (Acesso Rápido)</Label>
            <Switch checked={isQuickAccess} onCheckedChange={setIsQuickAccess} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Permite estoque negativo</Label>
            <Switch checked={permiteNegativo} onCheckedChange={setPermiteNegativo} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Ativo</Label>
            <Switch checked={ativo} onCheckedChange={setAtivo} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
