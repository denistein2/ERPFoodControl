import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Security() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Segurança</h1>
      <Card>
        <CardHeader>
          <CardTitle>Configurações de segurança</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Altere senha, ative autenticação em duas etapas e gerencie sessões. Em breve mais opções estarão disponíveis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
