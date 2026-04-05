import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Termos de uso</h1>
      <Card>
        <CardHeader>
          <CardTitle>Termos e condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Termos de uso do serviço. Em breve este conteúdo será disponibilizado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
