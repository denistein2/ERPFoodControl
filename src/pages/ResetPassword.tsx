import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      } else {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        if (accessToken && type === "recovery") {
          supabase.auth.setSession({ access_token: accessToken, refresh_token: hashParams.get("refresh_token") || "" }).then(() => setReady(true));
        } else {
          setError("Link inválido ou expirado. Solicite uma nova redefinição de senha.");
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => navigate("/login", { replace: true }), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Redefinir senha</h1>
      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <p className="text-muted-foreground">
              {error || "Carregando…"}
            </p>
          ) : done ? (
            <p className="text-muted-foreground">
              Senha alterada com sucesso. Redirecionando para o login…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Salvando…" : "Salvar senha"}
              </button>
            </form>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" className="text-primary underline hover:no-underline">
              Voltar ao login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
