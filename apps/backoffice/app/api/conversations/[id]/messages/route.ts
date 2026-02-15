import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { asc, eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conv = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  if (conv.length === 0 || conv[0].userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const list = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      created_at: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json(list);
}
