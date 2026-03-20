import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Privacidade</h1>
      <Card>
        <CardHeader>
          <CardTitle>Política de privacidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Informações sobre como tratamos seus dados pessoais. Em breve este conteúdo será disponibilizado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
