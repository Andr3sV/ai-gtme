"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-center text-xl font-semibold">GTME Backoffice</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Inicia sesión con tu cuenta de Google para acceder al panel.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
