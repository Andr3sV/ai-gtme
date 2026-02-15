import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    if (data.user && !isAllowedEmail(data.user.email ?? undefined)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/unauthorized`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
