import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Sobre</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Stock Whisperer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Esta é a página sobre o projeto. Aqui você pode descrever o sistema de controle de estoque, suas funcionalidades e objetivos.</p>
        </CardContent>
      </Card>
    </div>
  );
}
