import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.signOut().then(() => {
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Saindo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sessão encerrada</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>Redirecionando para o login…</p>
        </CardContent>
      </Card>
    </div>
  );
}
