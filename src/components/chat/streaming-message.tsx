"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot } from "lucide-react";
import type { StreamingMessage } from "@/types";

interface StreamingMessageBubbleProps {
  message: StreamingMessage;
}

export function StreamingMessageBubble({ message }: StreamingMessageBubbleProps) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-secondary">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {message.memberName}
          </Badge>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">typing...</span>
        </div>

        <Card className="p-3 max-w-2xl bg-muted">
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content || "Thinking..."}
            <span className="inline-block w-1.5 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
          </p>
        </Card>
      </div>
    </div>
  );
}
