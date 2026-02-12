"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MessageWithMember } from "@/types";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: MessageWithMember;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback
          className={isUser ? "bg-primary text-primary-foreground" : "bg-secondary"}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={`flex-1 space-y-1 ${isUser ? "flex flex-col items-end" : ""}`}
      >
        <div className="flex items-center gap-2">
          {!isUser && message.memberName && (
            <Badge variant="outline" className="text-xs">
              {message.memberName}
            </Badge>
          )}
          {isUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <Card
          className={`p-3 max-w-2xl ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </Card>
      </div>
    </div>
  );
}
