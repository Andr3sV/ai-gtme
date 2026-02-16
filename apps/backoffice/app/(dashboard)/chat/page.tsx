"use client";

import { useEffect, useRef, useState } from "react";

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
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView();

  async function loadConversations() {
    setConversationsError(null);
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    } else {
      let msg = "No se pudieron cargar las conversaciones.";
      if (res.status === 503) msg = "Base de datos no disponible. Revisa DATABASE_URL.";
      if (res.status === 401) msg = "Sesión expirada. Inicia sesión de nuevo.";
      setConversationsError(msg);
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
    const t = setInterval(() => loadMessages(selectedId), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [pendingRun, selectedId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setSendError(null);
    setInput("");
    setLoading(true);
    setPendingRun(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: text, created_at: new Date().toISOString() },
    ]);
    setTimeout(scrollToBottom, 50);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: selectedId, content: text }),
      });
      if (res.status === 202) {
        const { conversation_id, agent_run_id } = await res.json();
        setSelectedId(conversation_id);
        setPendingRun(agent_run_id);
        await loadConversations();
        await loadMessages(conversation_id);
      } else {
        const err = await res.json().catch(() => ({}));
        const message =
          res.status === 502
            ? "No se pudo conectar con el agente. Comprueba que el agent-service esté en marcha (AGENT_SERVICE_URL)."
            : (err as { error?: string }).error ?? "Error al enviar el mensaje.";
        setSendError(message);
        setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
      }
    } finally {
      setLoading(false);
    }
  }

  const hasConversations = conversations.length > 0;
  const emptyNoConversations = !hasConversations && !selectedId && messages.length === 0;
  const emptyNoSelection = hasConversations && !selectedId && messages.length === 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex flex-1 min-h-0">
        {/* Panel conversaciones */}
        <aside className="flex w-60 shrink-0 flex-col border-r bg-muted/30">
          <div className="flex items-center justify-between border-b px-3 py-3">
            <h2 className="text-sm font-medium">Conversaciones</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setMessages([]);
                setPendingRun(null);
                setSendError(null);
              }}
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Nueva
            </button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {conversationsError && (
              <div className="space-y-2 p-2">
                <p className="text-xs text-destructive">{conversationsError}</p>
                <button
                  type="button"
                  onClick={loadConversations}
                  className="rounded-md border px-2 py-1.5 text-xs hover:bg-accent"
                >
                  Reintentar
                </button>
              </div>
            )}
            <ul className="space-y-0.5">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setPendingRun(null);
                      setSendError(null);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm truncate ${
                      selectedId === c.id ? "bg-accent" : "hover:bg-accent/70"
                    }`}
                  >
                    {c.title ?? "Sin título"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Área mensajes */}
        <div className="flex flex-1 flex-col min-h-0 bg-background">
          <div className="flex-1 overflow-auto p-4">
            {emptyNoConversations && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Crea una conversación escribiendo abajo y pulsando Enviar.
              </p>
            )}
            {emptyNoSelection && !emptyNoConversations && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Selecciona una conversación o escribe un mensaje para crear una nueva.
              </p>
            )}
            {sendError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {sendError}
              </div>
            )}
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Pensando…
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 border-t p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <textarea
                placeholder="Escribe tu mensaje (varias líneas = un mensaje)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                disabled={loading}
                rows={2}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
