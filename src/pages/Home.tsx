import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Início</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Página inicial do Stock Whisperer. Acesse o <Link to="/" className="text-primary underline hover:no-underline">Dashboard</Link> para gerenciar seu estoque.</p>
        </CardContent>
      </Card>
    </div>
  );
}
