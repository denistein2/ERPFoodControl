import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Seu perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground">
          <p>Gerencie suas informações pessoais e preferências. Em breve você poderá editar nome, email e foto.</p>
        </CardContent>
      </Card>
    </div>
  );
}
