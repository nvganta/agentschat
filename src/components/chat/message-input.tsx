"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, AtSign } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string, targetMemberId?: number) => void;
  disabled?: boolean;
  memberNames?: string[];
}

export function MessageInput({
  onSend,
  disabled,
  memberNames = [],
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredNames = memberNames.filter((name) =>
    name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
    setShowMentions(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setMessage(value);

    // Detect if user is typing an @mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setShowMentions(true);
      setMentionFilter(atMatch[1]);
    } else {
      setShowMentions(false);
    }
  }

  function insertMention(name: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = message.slice(0, cursorPos);
    const textAfterCursor = message.slice(cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf("@");
    const newText =
      textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor;

    setMessage(newText);
    setShowMentions(false);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = atIndex + name.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* @mention dropdown */}
      {showMentions && filteredNames.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 bg-popover border rounded-md shadow-md p-1 z-10 min-w-[200px]">
          <div className="text-xs text-muted-foreground px-2 py-1">
            Mention an agent
          </div>
          {filteredNames.map((name) => (
            <button
              key={name}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
              onClick={() => insertMention(name)}
              type="button"
            >
              <AtSign className="h-3 w-3 text-muted-foreground" />
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Hint badges when input is empty */}
      {memberNames.length > 0 && !message && !disabled && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Tip: use</span>
          {memberNames.map((name) => (
            <Badge
              key={name}
              variant="outline"
              className="text-[10px] cursor-pointer hover:bg-accent"
              onClick={() => {
                setMessage(`@${name} `);
                textareaRef.current?.focus();
              }}
            >
              @{name}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground">
            to target specific agents, or just type to message all
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Agents are responding..."
              : "Type a message... (use @ to mention agents)"
          }
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={2}
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-[60px]"
          disabled={!message.trim() || disabled}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
