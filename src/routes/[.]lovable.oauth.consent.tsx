import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Details = { client?: { name?: string }; redirect_url?: string; redirect_to?: string } | null;
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: Details; error: { message: string } | null }>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  head: () => ({
    meta: [
      { title: "Autoriser l'accès — AgriConnect" },
      { name: "description", content: "Autoriser une application à accéder à votre compte AgriConnect." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Consent,
});

function Consent() {
  const { authorization_id } = Route.useSearch();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [details, setDetails] = useState<Details>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  useEffect(() => {
    if (!signedIn || !authorization_id) return;
    oauth().getAuthorizationDetails(authorization_id).then(({ data, error }) => {
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    });
  }, [signedIn, authorization_id]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message); else setSignedIn(true);
  }

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (error || !target) { setBusy(false); setError(error?.message ?? "Aucune redirection reçue."); return; }
    window.location.href = target;
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-base";
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-lg space-y-4">
        <h1 className="text-xl font-bold text-foreground">AgriConnect</h1>
        {!authorization_id ? (
          <p>Demande d'autorisation invalide.</p>
        ) : signedIn === null ? (
          <p>Chargement…</p>
        ) : !signedIn ? (
          <form onSubmit={login} className="space-y-3">
            <p className="text-sm text-muted-foreground">Connectez-vous pour continuer.</p>
            <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={input} type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button disabled={busy} className="w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground">Se connecter</button>
          </form>
        ) : (
          <>
            <p className="text-foreground">
              <strong>{details?.client?.name ?? "Une application"}</strong> souhaite accéder à AgriConnect en votre nom.
            </p>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => decide(true)} className="flex-1 rounded-lg bg-primary py-2 font-semibold text-primary-foreground">Autoriser</button>
              <button disabled={busy} onClick={() => decide(false)} className="flex-1 rounded-lg border border-border py-2">Refuser</button>
            </div>
          </>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </main>
  );
}
