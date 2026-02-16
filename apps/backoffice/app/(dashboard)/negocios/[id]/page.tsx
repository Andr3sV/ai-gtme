import { db } from "@/lib/db";
import { businesses, businessCollectedData } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NegocioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);

  if (!business) notFound();

  const collected = await db
    .select()
    .from(businessCollectedData)
    .where(eq(businessCollectedData.businessId, id))
    .orderBy(desc(businessCollectedData.collectedAt));

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link
        href="/negocios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Negocios
      </Link>

      <nav className="text-sm text-muted-foreground">
        <Link href="/negocios" className="hover:text-foreground">Negocios</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{business.name}</span>
      </nav>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <p className="text-sm text-muted-foreground">
            ID: {business.id} · Externo: {business.externalId ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Datos recolectados por fuente</h2>
        </div>
        <div className="p-4">
          {collected.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay datos para este negocio.</p>
          ) : (
            <div className="space-y-2">
              {collected.map((row) => (
                <details
                  key={row.id}
                  className="group rounded-lg border"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    <span className="uppercase tracking-wide text-muted-foreground">
                      {row.source}
                    </span>
                    <span className="text-foreground">
                      {new Date(row.collectedAt).toLocaleString("es")}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t px-3 pb-3 pt-0">
                    <pre className="mt-2 overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
                      {JSON.stringify(row.payload, null, 2)}
                    </pre>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
