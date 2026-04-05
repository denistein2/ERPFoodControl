import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Contact() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Contato</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fale conosco</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Entre em contato para suporte, dúvidas ou sugestões. Em breve você poderá enviar mensagens por aqui.</p>
        </CardContent>
      </Card>
    </div>
  );
}
