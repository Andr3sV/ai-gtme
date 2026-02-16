import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  if (!host) {
    redirect("/chat");
  }
  const base = `${proto}://${host}`.replace(/\/+$/, "");
  redirect(`${base}/chat`);
}
