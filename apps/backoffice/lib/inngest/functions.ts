import { inngest } from "./client";
import { db } from "@/lib/db";
import {
  agentRuns,
  messages,
  businesses,
  businessCollectedData,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const AGENT_SERVICE_URL =
  process.env.AGENT_SERVICE_URL ?? "http://localhost:8000";

interface AgentRunPayload {
  conversation_id: string;
  message_id: string;
  agent_run_id: string;
  content: string;
}

interface AgentRunResponse {
  status: string;
  assistant_message?: string;
  result_snapshot?: Record<string, unknown>;
  businesses?: Array<{ name: string; external_id?: string | null; payload?: Record<string, unknown> }>;
  business_collected_data?: Array<{
    business_id?: string;
    source: string;
    payload: Record<string, unknown>;
  }>;
}

export const runAgent = inngest.createFunction(
  { id: "agent-run", retries: 2 },
  { event: "agent/run.requested" },
  async ({ event, step }) => {
    const { conversation_id, message_id, agent_run_id, content } =
      event.data as AgentRunPayload;

    const recent_messages = (event.data as { recent_messages?: Array<{ role: string; content: string }> }).recent_messages;

    const res = await fetch(`${AGENT_SERVICE_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id,
        message_id,
        agent_run_id,
        content,
        recent_messages: recent_messages ?? undefined,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      await db
        .update(agentRuns)
        .set({
          status: "failed",
          resultSnapshot: { error: text },
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, agent_run_id));
      throw new Error(`Agent service error: ${res.status} ${text}`);
    }

    let data: AgentRunResponse;
    try {
      data = (await res.json()) as AgentRunResponse;
    } catch {
      await db
        .update(agentRuns)
        .set({
          status: "failed",
          resultSnapshot: { error: "Invalid JSON from agent" },
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, agent_run_id));
      throw new Error("Agent service returned invalid JSON");
    }

    const status = ["pending", "running", "completed", "failed"].includes(
      data.status
    )
      ? (data.status as "pending" | "running" | "completed" | "failed")
      : "completed";

    await db
      .update(agentRuns)
      .set({
        status,
        resultSnapshot: data.result_snapshot ?? null,
        updatedAt: new Date(),
      })
      .where(eq(agentRuns.id, agent_run_id));

    if (data.assistant_message) {
      await db.insert(messages).values({
        conversationId: conversation_id,
        role: "assistant",
        content: data.assistant_message,
      });
    }

    const insertedBusinessIds: string[] = [];
    if (data.businesses?.length) {
      for (const b of data.businesses) {
        const [inserted] = await db
          .insert(businesses)
          .values({
            name: b.name || "Unknown",
            externalId: b.external_id ?? null,
          })
          .returning({ id: businesses.id });
        if (inserted) {
          insertedBusinessIds.push(inserted.id);
          await db.insert(businessCollectedData).values({
            businessId: inserted.id,
            source: "reputation_agent",
            payload: (b.payload ?? {}) as Record<string, unknown>,
            agentRunId: agent_run_id,
          });
        }
      }
    }

    if (data.business_collected_data?.length) {
      for (const row of data.business_collected_data) {
        if (row.business_id) {
          await db.insert(businessCollectedData).values({
            businessId: row.business_id,
            source: row.source,
            payload: row.payload,
            agentRunId: agent_run_id,
          });
        }
      }
    }

    return data;
  }
);
