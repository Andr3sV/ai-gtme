"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error(error);
      return;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">GTME Backoffice</h1>
      <p className="text-muted-foreground text-center text-sm">
        Inicia sesión con tu cuenta de Google (@plinng)
      </p>
      <button
        type="button"
        onClick={signInWithGoogle}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Continuar con Google
      </button>
    </div>
  );
}
