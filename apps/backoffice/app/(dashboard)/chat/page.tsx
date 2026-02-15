"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const POLL_INTERVAL_MS = 2000;

export default function ChatPage() {
  const [conversations, setConversations] = useState<
    { id: string; title: string | null }[]
  >([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    { id: string; role: string; content: string; created_at: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRun, setPendingRun] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView();

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  }

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/conversations/${convId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
      setTimeout(scrollToBottom, 100);
    }
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
    else setMessages([]);
  }, [selectedId]);

  useEffect(() => {
    if (!pendingRun || !selectedId) return;
    const t = setInterval(() => {
      loadMessages(selectedId);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pendingRun, selectedId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);
    setPendingRun(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: selectedId,
          content: text,
        }),
      });

      if (res.status === 202) {
        const { conversation_id, agent_run_id } = await res.json();
        setSelectedId(conversation_id);
        setPendingRun(agent_run_id);
        await loadMessages(conversation_id);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 p-4">
      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[220px_1fr]">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="py-3">
            <h2 className="text-sm font-medium">Conversaciones</h2>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <ul className="space-y-0">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setPendingRun(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${selectedId === c.id ? "bg-muted" : ""}`}
                  >
                    {c.title ?? "Sin título"}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardContent className="flex flex-1 flex-col gap-2 overflow-hidden p-4">
            <div className="flex-1 space-y-2 overflow-auto">
              {messages.length === 0 && !selectedId && (
                <p className="text-muted-foreground text-sm">
                  Escribe un mensaje para crear una conversación o selecciona una
                  existente.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg p-2 ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}
                >
                  <span className="text-muted-foreground text-xs">
                    {m.role}
                  </span>
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Input
                placeholder="Escribe tu mensaje (varias líneas = un mensaje)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[44px] flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                Enviar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
