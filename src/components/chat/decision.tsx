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
  const [saveStatus, setSaveStatus] = useState("");
  // Editing and saving wait for the saved decision, so a slow or failed load
  // can't let Save overwrite it with an empty box. Each load is keyed by room
  // and attempt, so a load for another room or an earlier attempt never counts.
  const [attempt, setAttempt] = useState(0);
  const key = `${roomId}:${attempt}`;
  const [result, setResult] = useState<{ key: string; ok: boolean } | null>(null);
  const load = result?.key !== key ? "loading" : result.ok ? "loaded" : "failed";
  const loaded = load === "loaded";

  useEffect(() => {
    let current = true;
    fetch(`/api/rooms/${roomId}/decision`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load decision");
        return response.json();
      })
      .then((data: { content: string }) => {
        if (!current) return;
        setContent(data.content);
        setSaveStatus("");
        setResult({ key, ok: true });
      })
      .catch(() => {
        if (current) setResult({ key, ok: false });
      });
    return () => {
      current = false;
    };
  }, [roomId, key]);

  const status =
    load === "loading"
      ? "Loading decision…"
      : load === "failed"
        ? "Could not load the decision."
        : saveStatus;

  async function save() {
    if (!loaded) return;
    setSaveStatus("Saving…");
    try {
      const response = await fetch(`/api/rooms/${roomId}/decision`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("Failed to save decision");
      setSaveStatus("Saved in this room.");
    } catch {
      setSaveStatus("Could not save. Try again.");
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
          value={loaded ? content : ""}
          disabled={!loaded}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={!loaded}>
            Save decision
          </Button>
          {load === "failed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={exportMarkdown}
            disabled={!loaded || !content}
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
