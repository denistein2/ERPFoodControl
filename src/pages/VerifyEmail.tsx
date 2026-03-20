import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmail() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Verificar email</h1>
      <Card>
        <CardHeader>
          <CardTitle>Confirme seu email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta.</p>
          <p>
            Já verificou? <Link to="/login" className="text-primary underline hover:no-underline">Fazer login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
