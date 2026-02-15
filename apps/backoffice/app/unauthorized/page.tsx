import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Acceso no autorizado</h1>
      <p className="text-muted-foreground text-center text-sm">
        Solo se permiten cuentas con correo @plinng. Cierra sesión de Google e
        intenta con una cuenta autorizada.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
      >
        Volver al login
      </Link>
    </div>
  );
}
