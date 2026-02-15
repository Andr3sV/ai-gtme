import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({ id: conversations.id, title: conversations.title })
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt));

  return NextResponse.json(list);
}
