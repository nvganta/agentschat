"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { StreamingMessageBubble } from "./streaming-message";
import { MessageInput } from "./message-input";
import type {
  MessageWithMember,
  StreamingMessage,
  SSEEvent,
} from "@/types";

interface ChatInterfaceProps {
  roomId: number;
}

export function ChatInterface({ roomId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageWithMember[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<
    Map<number, StreamingMessage>
  >(new Map());
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch member names for @mention hints
  useEffect(() => {
    fetch(`/api/rooms/${roomId}/members`)
      .then((res) => res.json())
      .then((data: Array<{ name: string }>) =>
        setMemberNames(data.map((m) => m.name))
      )
      .catch(console.error);
  }, [roomId]);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/messages`)
      .then((res) => res.json())
      .then((data) =>
        setMessages(
          data.map((m: MessageWithMember) => ({
            ...m,
            createdAt: new Date(m.createdAt),
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roomId]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessages, scrollToBottom]);

  async function sendMessage(content: string, targetMemberId?: number) {
    setIsSending(true);

    // Optimistic user message
    const userMessage: MessageWithMember = {
      id: Date.now(),
      roomId,
      role: "user",
      memberId: null,
      memberName: null,
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/rooms/${roomId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, targetMemberId }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const event: SSEEvent = JSON.parse(trimmed.slice(6));
            handleSSEEvent(event);
          } catch {
            // skip malformed events
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const event: SSEEvent = JSON.parse(buffer.trim().slice(6));
          handleSSEEvent(event);
        } catch {
          // skip
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
      setStreamingMessages(new Map());
    }
  }

  function handleSSEEvent(event: SSEEvent) {
    switch (event.type) {
      case "start":
        setStreamingMessages((prev) => {
          const next = new Map(prev);
          next.set(event.memberId, {
            id: `streaming-${event.memberId}-${Date.now()}`,
            memberId: event.memberId,
            memberName: event.memberName,
            role: "assistant",
            content: "",
            isStreaming: true,
            createdAt: new Date(),
          });
          return next;
        });
        break;

      case "chunk":
        setStreamingMessages((prev) => {
          const next = new Map(prev);
          const existing = next.get(event.memberId);
          if (existing) {
            next.set(event.memberId, {
              ...existing,
              content: existing.content + event.content,
            });
          }
          return next;
        });
        break;

      case "done":
        setStreamingMessages((prev) => {
          const next = new Map(prev);
          const msg = next.get(event.memberId);
          if (msg && msg.content) {
            setMessages((prevMsgs) => [
              ...prevMsgs,
              {
                id: Date.now() + event.memberId,
                roomId,
                role: "assistant",
                memberId: event.memberId,
                memberName: msg.memberName,
                content: msg.content,
                createdAt: new Date(),
              },
            ]);
          }
          next.delete(event.memberId);
          return next;
        });
        break;

      case "error":
        setStreamingMessages((prev) => {
          const next = new Map(prev);
          const msg = next.get(event.memberId);
          if (msg) {
            // Show error as a message
            setMessages((prevMsgs) => [
              ...prevMsgs,
              {
                id: Date.now() + event.memberId,
                roomId,
                role: "assistant",
                memberId: event.memberId,
                memberName: msg.memberName,
                content: `Error: ${event.error}`,
                createdAt: new Date(),
              },
            ]);
          }
          next.delete(event.memberId);
          return next;
        });
        break;
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && streamingMessages.size === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Add some agents and start chatting!
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {Array.from(streamingMessages.values()).map((message) => (
            <StreamingMessageBubble key={message.id} message={message} />
          ))}
          <div ref={scrollRef} />
        </div>
      </div>
      <div className="border-t p-4">
        <MessageInput
          onSend={sendMessage}
          disabled={isSending}
          memberNames={memberNames}
        />
      </div>
    </>
  );
}
