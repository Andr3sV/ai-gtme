import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedEmail } from "@/lib/auth";

const ALLOWED_PATHS = ["/login", "/auth/callback", "/unauthorized"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const pathname = request.nextUrl.pathname;
  const isAllowedPath = ALLOWED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAllowedPath) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          } catch {
            // ignore cookie set errors in middleware
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAllowedPath) {
      if (user && pathname === "/login") {
        if (!isAllowedEmail(user.email)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
        return NextResponse.redirect(new URL("/chat", request.url));
      }
      if (user && pathname === "/auth/callback") {
        if (!isAllowedEmail(user.email)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
        return NextResponse.redirect(new URL("/chat", request.url));
      }
      return response;
    }

    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!isAllowedEmail(user.email)) {
      await supabase.auth.signOut();
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return response;
  } catch {
    if (isAllowedPath) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/inngest).*)",
  ],
};
