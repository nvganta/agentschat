"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER = [
  "## Decision",
  "",
  "## Affected files by repository",
  "- repository: path/to/file",
].join("\n");

interface DecisionProps {
  roomId: number;
}

export function Decision({ roomId }: DecisionProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Loading decision…");

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/decision`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load decision");
        return response.json();
      })
      .then((data: { content: string }) => {
        setContent(data.content);
        setStatus("");
      })
      .catch(() =>
        setStatus("Could not load the decision. Refresh to try again.")
      );
  }, [roomId]);

  async function save() {
    setStatus("Saving…");
    try {
      const response = await fetch(`/api/rooms/${roomId}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to save decision");
      setStatus("Saved in this room.");
    } catch {
      setStatus("Could not save. Try again.");
    }
  }

  function exportMarkdown() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "decision.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details className="border-b px-4 py-3">
      <summary className="cursor-pointer font-semibold">
        Decision &amp; affected files
      </summary>
      <div className="space-y-2 pt-3">
        <p className="text-sm text-muted-foreground">
          Write the decision you agree on and list affected files under each
          repository. Save it to this room or export Markdown.
        </p>
        <Textarea
          aria-label="Decision and affected files"
          className="min-h-32"
          placeholder={PLACEHOLDER}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>
            Save decision
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={exportMarkdown}
            disabled={!content}
          >
            Export Markdown
          </Button>
        </div>
        <p role="status" className="text-sm">
          {status}
        </p>
      </div>
    </details>
  );
}
