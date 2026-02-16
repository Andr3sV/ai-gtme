import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NegociosPage() {
  const list = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      externalId: businesses.externalId,
      updatedAt: businesses.updatedAt,
    })
    .from(businesses)
    .orderBy(desc(businesses.updatedAt))
    .limit(200);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Negocios</h1>
        <p className="text-sm text-muted-foreground">
          Listado de negocios con datos obtenidos por las skills (Google My Business, SEO, etc.).
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">Datos de negocios recolectados</h2>
        </div>
        <div className="p-4">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Aún no hay negocios</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Usa el Chat para pedir listados (ej. negocios en Catalunya con menos de 3 reviews).
              </p>
              <Link
                href="/chat"
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Ir al Chat
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">ID externo</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Última actualización</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">{b.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{b.externalId ?? "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString("es") : "—"}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/negocios/${b.id}`}
                          className="text-primary hover:underline"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
