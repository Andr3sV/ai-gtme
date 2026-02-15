export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRunPayload {
  conversation_id: string;
  message_id: string;
  agent_run_id: string;
  content: string;
  recent_messages?: ChatMessage[];
}
