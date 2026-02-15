import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import {
  businesses,
  businessCollectedData,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        ← Volver a Negocios
      </Link>
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <p className="text-muted-foreground text-sm">
            ID: {business.id} · Externo: {business.externalId ?? "—"}
          </p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Datos recolectados por fuente</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {collected.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no hay datos para este negocio.
            </p>
          ) : (
            collected.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border p-3"
              >
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                  {row.source} · {new Date(row.collectedAt).toLocaleString("es")}
                </p>
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(row.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
