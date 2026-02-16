"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Building2, LogOut, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const nav = [
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/negocios", label: "Negocios", icon: Building2 },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: HTML + Tailwind, sin Radix */}
      <aside
        className={`flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] ${
          sidebarOpen ? "w-56" : "w-16"
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-md p-2 hover:bg-sidebar-accent"
            aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <Menu className="h-5 w-5" />
          </button>
          {sidebarOpen && (
            <span className="text-sm font-semibold">GTME</span>
          )}
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href === "/chat" && pathname === "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
          <span className="text-sm font-medium text-muted-foreground">
            GTME Backoffice
          </span>
          <div className="flex items-center gap-2">
            <span className="max-w-[180px] truncate text-xs text-muted-foreground">
              {user?.email ?? "—"}
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cerrar sesión
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col min-h-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
