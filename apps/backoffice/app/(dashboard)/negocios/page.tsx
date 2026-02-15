import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { businesses, businessCollectedData } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">Datos de negocios recolectados</h1>
          <p className="text-muted-foreground text-sm">
            Listado de negocios con datos obtenidos por las skills (Google My
            Business, SEO, etc.).
          </p>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aún no hay negocios. Usa el Chat para pedir listados (ej. negocios
              en Catalunya con menos de 3 reviews).
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>ID externo</TableHead>
                  <TableHead>Última actualización</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {b.externalId ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {b.updatedAt
                        ? new Date(b.updatedAt).toLocaleDateString("es")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/negocios/${b.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Ver detalle
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
