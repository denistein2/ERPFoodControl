import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Help() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ajuda</h1>
      <Card>
        <CardHeader>
          <CardTitle>Central de ajuda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Consulte perguntas frequentes, tutoriais e documentação do sistema. Em breve mais conteúdo será disponibilizado.</p>
        </CardContent>
      </Card>
    </div>
  );
}
