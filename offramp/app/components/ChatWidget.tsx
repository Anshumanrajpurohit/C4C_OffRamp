"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { DishDetail } from "../../lib/dishes";

const systemPrompt = (
  dish: DishDetail
) => `You are a friendly plant-based cooking assistant.
Dish: ${dish.name}
Diet: ${dish.diet}
Course: ${dish.course}
Region: ${dish.region}
Flavor: ${dish.flavorProfile}
Total time: ${dish.totalTime}
Replaces: ${dish.replaces.join(", ")}
Ingredients: ${dish.ingredients.map((i) => `${i.quantity} ${i.item}`).join(", ")}
Goal: Help the user cook this dish, suggest swaps, give timing help, and keep responses concise.`;

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  open: boolean;
  onClose: () => void;
  dish: DishDetail;
};

export function ChatWidget({ open, onClose, dish }: Props) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content: `Hi! I can help you cook ${dish.name}, suggest plant-based swaps, and plan timing. What do you need?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset when dish changes
    setMessages([
      {
        role: "assistant",
        content: `Hi! I can help you cook ${dish.name}, suggest plant-based swaps, and plan timing. What do you need?`,
      },
    ]);
    setInput("");
    setError(null);
  }, [dish.name]);

  const chatContext = useMemo(() => systemPrompt(dish), [dish]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    const userMessage: Message = { role: "user", content: trimmed };
    const placeholder: Message = { role: "assistant", content: "" };
    const nextMessages: Message[] = [...messages, userMessage, placeholder];
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish, messages: nextMessages, system: chatContext }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content;
            if (typeof delta === "string") {
              assembled += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assembled };
                return updated;
              });
            }
          } catch (e) {
            // ignore malformed chunks
          }
        }
      }

      if (!assembled) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: "Sorry, I could not generate a reply right now." };
          return updated;
        });
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed bottom-24 right-4 z-50 w-85 sm:w-95 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#136c56] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">AI</span>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#136c56] bg-[#4ade80]" />
            </div>
            <div>
              <p className="text-sm font-bold">Dish Assistant</p>
              <p className="text-[11px] text-white/80">Chat about {dish.name}</p>
            </div>
          </div>
          <button className="text-white/80 hover:text-white" onClick={onClose} aria-label="Close chat">
            ✕
          </button>
        </div>
        <div className="h-72 bg-gray-50 px-3 py-3 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "assistant" ? "flex gap-2" : "flex justify-end"}>
              {m.role === "assistant" && (
                <div className="mt-1 h-7 w-7 rounded-full bg-[#136c56]/15 flex items-center justify-center text-[#136c56] text-xs font-bold">AI</div>
              )}
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed " +
                  (m.role === "assistant"
                    ? "bg-white border border-gray-200 text-gray-800"
                    : "bg-[#136c56] text-white")
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 text-xs text-gray-500">
              <div className="h-7 w-7 rounded-full bg-[#136c56]/15" />
              <div className="rounded-2xl bg-white px-3 py-2 border border-gray-200 animate-pulse">Typing…</div>
            </div>
          )}
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
        <div className="border-t border-gray-200 px-3 py-3 bg-white">
          <div className="relative flex items-center">
            <input
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-12 text-sm text-gray-900 focus:border-[#136c56] focus:outline-none focus:ring-1 focus:ring-[#136c56]"
              placeholder="Ask about steps, timing, or swaps…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="absolute right-1.5 rounded-full bg-[#136c56] px-3 py-1.5 text-white text-xs font-bold shadow-sm hover:bg-[#0f5745] disabled:opacity-50"
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </button>
          </div>
          <div className="text-[11px] text-center text-gray-400 mt-2">AI can make mistakes. Check important info.</div>
        </div>
      </div>
    </>
  );
}
