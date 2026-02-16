import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/chat";
  const origin = url.origin.replace(/\/+$/, "");
  const path = next.startsWith("/") ? next : `/${next}`;

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
    return NextResponse.redirect(`${origin}${path}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
