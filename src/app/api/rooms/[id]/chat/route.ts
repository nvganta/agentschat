import { NextRequest } from "next/server";
import {
  getMembers,
  createMessage,
  getRecentMessages,
  getContextSourcesByMemberIds,
} from "@/lib/db/queries";
import { runAgent, formatConversationHistory } from "@/lib/agents/runner";
import type { SendMessageRequest, SSEEvent } from "@/types";
import type { Member, ContextSource } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Parse @mentions from message content.
 * Matches @name (case-insensitive) against member names.
 * Returns matched members, or all members if no @mentions found.
 */
function resolveMentions(
  content: string,
  allMembers: Member[]
): Member[] {
  const mentionPattern = /@(\w[\w\s]*?)(?=\s@|\s|$)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionPattern.exec(content)) !== null) {
    mentions.push(match[1].trim().toLowerCase());
  }

  if (mentions.length === 0) return allMembers;

  const matched = allMembers.filter((m) =>
    mentions.some((mention) => m.name.toLowerCase().includes(mention))
  );

  // If no valid matches found, fall back to all members
  return matched.length > 0 ? matched : allMembers;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = parseInt(id);

  let body: SendMessageRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.content?.trim()) {
    return new Response("Message content is required", { status: 400 });
  }

  // Save user message
  createMessage({
    roomId,
    role: "user",
    memberId: null,
    content: body.content.trim(),
  });

  // Get members (already sorted by sortOrder) and history
  const allMembers = getMembers(roomId);
  const recentMessages = getRecentMessages(roomId, 30);

  // Resolve which agents should respond: @mentions or explicit target
  let targetMembers: Member[];
  if (body.targetMemberId) {
    targetMembers = allMembers.filter((m) => m.id === body.targetMemberId);
  } else {
    targetMembers = resolveMentions(body.content, allMembers);
  }

  if (targetMembers.length === 0) {
    return new Response("No agents available in this room", { status: 400 });
  }

  // Batch-load context sources for all target members
  const allContextSources = getContextSourcesByMemberIds(
    targetMembers.map((m) => m.id)
  );
  const contextSourcesByMember = new Map<number, ContextSource[]>();
  for (const source of allContextSources) {
    const existing = contextSourcesByMember.get(source.memberId) || [];
    existing.push(source);
    contextSourcesByMember.set(source.memberId, existing);
  }

  const baseHistory = formatConversationHistory(
    recentMessages.map((m) => ({
      role: m.role,
      content: m.content,
      memberName: m.memberName,
    }))
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      // Track responses from this round so each agent sees prior agents' answers
      const roundResponses: Array<{ name: string; content: string }> = [];

      // Run agents SEQUENTIALLY in sort order
      for (const member of targetMembers) {
        sendEvent({
          type: "start",
          memberId: member.id,
          memberName: member.name,
        });

        // Build context: base history + responses from earlier agents in this round
        let conversationHistory = baseHistory;
        if (roundResponses.length > 0) {
          const roundContext = roundResponses
            .map((r) => `${r.name}: ${r.content}`)
            .join("\n\n");
          conversationHistory += `\n\n--- Responses from other agents in this round ---\n${roundContext}`;
        }

        let fullResponse = "";

        try {
          for await (const chunk of runAgent({
            member,
            userMessage: body.content,
            conversationHistory,
            contextSources: contextSourcesByMember.get(member.id) || [],
          })) {
            if (chunk.type === "chunk") {
              fullResponse += chunk.content;
              sendEvent({
                type: "chunk",
                memberId: member.id,
                content: chunk.content,
              });
            } else if (chunk.type === "done") {
              if (fullResponse) {
                createMessage({
                  roomId,
                  role: "assistant",
                  memberId: member.id,
                  content: fullResponse,
                });
                roundResponses.push({
                  name: member.name,
                  content: fullResponse,
                });
              }
              sendEvent({ type: "done", memberId: member.id });
            } else if (chunk.type === "error") {
              sendEvent({
                type: "error",
                memberId: member.id,
                error: chunk.content,
              });
            }
          }
        } catch (error) {
          sendEvent({
            type: "error",
            memberId: member.id,
            error:
              error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
