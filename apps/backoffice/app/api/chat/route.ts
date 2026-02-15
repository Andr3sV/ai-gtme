import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  agentRuns,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const conversation_id =
    typeof body.conversation_id === "string" ? body.conversation_id : null;
  const content =
    typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  let convId = conversation_id;
  if (convId) {
    const conv = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId))
      .limit(1);
    if (conv.length === 0 || conv[0].userId !== user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const title =
      content.length > 80 ? `${content.slice(0, 77)}...` : content || "Nueva conversación";
    const [inserted] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title: title || "Nueva conversación",
      })
      .returning({ id: conversations.id });
    if (!inserted) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }
    convId = inserted.id;
  }

  const [msg] = await db
    .insert(messages)
    .values({
      conversationId: convId,
      role: "user",
      content,
    })
    .returning({ id: messages.id });
  if (!msg) {
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }

  const [run] = await db
    .insert(agentRuns)
    .values({
      conversationId: convId,
      messageId: msg.id,
      status: "pending",
    })
    .returning({ id: agentRuns.id });
  if (!run) {
    return NextResponse.json(
      { error: "Failed to create agent run" },
      { status: 500 }
    );
  }

  const recent = await db
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(desc(messages.createdAt))
    .limit(10);
  const recent_messages = recent.reverse().map((r) => ({
    role: r.role,
    content: r.content,
  }));

  await inngest.send({
    name: "agent/run.requested",
    data: {
      conversation_id: convId,
      message_id: msg.id,
      agent_run_id: run.id,
      content,
      recent_messages,
    },
  });

  return NextResponse.json(
    {
      conversation_id: convId,
      message_id: msg.id,
      agent_run_id: run.id,
    },
    { status: 202 }
  );
}
